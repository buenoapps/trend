import AsyncStorage from '@react-native-async-storage/async-storage';

import { PERSON_COLORS } from '@/constants/theme';

import { compareKey, isValidKey } from './dates';
import { newId } from './ids';
import {
  DEFAULT_SETTINGS,
  type CardDisplay,
  type Goal,
  type Person,
  type PersonKind,
  type Settings,
  type WeightEntry,
} from './types';

export const STORAGE_KEYS = {
  entries: 'trend.entries.v2',
  entriesLegacy: 'trend.entries.v1',
  persons: 'trend.persons.v1',
  settings: 'trend.settings.v1',
} as const;

function roundKg(kg: number): number {
  return Math.round(kg * 100) / 100;
}

function sanitize(entries: WeightEntry[]): WeightEntry[] {
  return entries
    .filter(
      (e) =>
        e &&
        typeof e.personId === 'string' &&
        e.personId.length > 0 &&
        isValidKey(e.date) &&
        Number.isFinite(e.kg) &&
        e.kg > 0,
    )
    .map((e) => ({ personId: e.personId, date: e.date, kg: roundKg(e.kg) }))
    .sort((a, b) => compareKey(a.date, b.date));
}

const KINDS: PersonKind[] = ['adult', 'kid'];
const GOALS: Goal[] = ['none', 'lose', 'gain'];
const CARD_DISPLAYS: CardDisplay[] = ['big', 'small', 'hidden'];

function sanitizePersons(persons: Person[]): Person[] {
  return persons
    .filter((p) => p && typeof p.id === 'string' && p.id.length > 0)
    .map((p) => {
      const kind: PersonKind = KINDS.includes(p.kind) ? p.kind : 'adult';
      return {
        id: p.id,
        name: typeof p.name === 'string' ? p.name : '',
        colorKey: PERSON_COLORS.some((c) => c.key === p.colorKey)
          ? p.colorKey
          : PERSON_COLORS[0].key,
        kind,
        goal: kind === 'kid' ? 'none' : GOALS.includes(p.goal) ? p.goal : 'none',
        cardDisplay: CARD_DISPLAYS.includes(p.cardDisplay) ? p.cardDisplay : 'big',
        createdAt: Number.isFinite(p.createdAt) ? p.createdAt : Date.now(),
      };
    })
    .sort((a, b) => a.createdAt - b.createdAt);
}

// --- Migration -------------------------------------------------------------
// v1 stored a flat `WeightEntry[]` keyed by date with no person concept.
// v2 stamps every entry with a `personId`. The first launch after the family
// update creates a default person and migrates the legacy data onto it.
// Both the persons store and the entries store await the SAME promise so they
// can't race each other into a half-migrated state.

let migrationPromise: Promise<void> | null = null;

async function runMigration(): Promise<void> {
  // Already migrated — the persons key only exists post-migration.
  if ((await AsyncStorage.getItem(STORAGE_KEYS.persons)) != null) return;

  let legacy: WeightEntry[] = [];
  const legacyRaw = await AsyncStorage.getItem(STORAGE_KEYS.entriesLegacy);
  if (legacyRaw) {
    try {
      const parsed = JSON.parse(legacyRaw);
      if (Array.isArray(parsed)) legacy = parsed;
    } catch {
      legacy = [];
    }
  }

  if (legacy.length === 0) {
    await AsyncStorage.setItem(STORAGE_KEYS.persons, JSON.stringify([]));
    await AsyncStorage.setItem(STORAGE_KEYS.entries, JSON.stringify([]));
    return;
  }

  // `name: 'Me'` is hardcoded — migration runs before i18n is resolved, and
  // the name is editable. The legacy `trend.entries.v1` key is left in place
  // as an untouched backup.
  const person: Person = {
    id: newId(),
    name: 'Me',
    colorKey: PERSON_COLORS[0].key,
    kind: 'adult',
    goal: 'none',
    cardDisplay: 'big',
    createdAt: Date.now(),
  };
  const stamped = legacy.map((e) => ({ ...e, personId: person.id }));
  await AsyncStorage.setItem(STORAGE_KEYS.persons, JSON.stringify([person]));
  await AsyncStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(sanitize(stamped)));
}

export function migrateIfNeeded(): Promise<void> {
  if (!migrationPromise) migrationPromise = runMigration();
  return migrationPromise;
}

// --- Entries ---------------------------------------------------------------

export async function loadEntries(): Promise<WeightEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.entries);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? sanitize(parsed) : [];
  } catch {
    return [];
  }
}

export async function saveEntries(entries: WeightEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(sanitize(entries)));
}

export async function upsertEntry(entry: WeightEntry): Promise<WeightEntry[]> {
  const current = await loadEntries();
  const next = [
    ...current.filter((e) => !(e.personId === entry.personId && e.date === entry.date)),
    { personId: entry.personId, date: entry.date, kg: roundKg(entry.kg) },
  ];
  const sorted = sanitize(next);
  await AsyncStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(sorted));
  return sorted;
}

export async function deleteEntry(personId: string, date: string): Promise<WeightEntry[]> {
  const current = await loadEntries();
  const next = current.filter((e) => !(e.personId === personId && e.date === date));
  await AsyncStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(next));
  return next;
}

// --- Persons ---------------------------------------------------------------

export async function loadPersons(): Promise<Person[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.persons);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? sanitizePersons(parsed) : [];
  } catch {
    return [];
  }
}

export async function savePersons(persons: Person[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.persons, JSON.stringify(sanitizePersons(persons)));
}

export async function upsertPerson(person: Person): Promise<Person[]> {
  const current = await loadPersons();
  const next = sanitizePersons([...current.filter((p) => p.id !== person.id), person]);
  await AsyncStorage.setItem(STORAGE_KEYS.persons, JSON.stringify(next));
  return next;
}

/** Removes a person and cascades to delete all of that person's entries. */
export async function deletePerson(
  id: string,
): Promise<{ persons: Person[]; entries: WeightEntry[] }> {
  const persons = (await loadPersons()).filter((p) => p.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.persons, JSON.stringify(persons));
  const entries = (await loadEntries()).filter((e) => e.personId !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
  return { persons, entries };
}

// --- Settings --------------------------------------------------------------

export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.settings);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function __resetStorageForTest(): void {
  migrationPromise = null;
}
