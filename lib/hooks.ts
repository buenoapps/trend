import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { todayKey } from './dates';
import {
  __resetStorageForTest,
  deleteEntry as persistDelete,
  deletePerson as persistDeletePerson,
  loadEntries,
  loadPersons,
  loadSettings,
  migrateIfNeeded,
  saveEntries as persistEntries,
  saveSettings as persistSettings,
  upsertEntry as persistUpsert,
  upsertPerson as persistUpsertPerson,
} from './storage';
import {
  DEFAULT_SETTINGS,
  type DateKey,
  type Person,
  type PersonId,
  type Settings,
  type WeightEntry,
} from './types';

type Listener = () => void;

// --- Entries store ---------------------------------------------------------

let entriesCache: WeightEntry[] = [];
let entriesLoaded = false;
let entriesLoadStarted = false;
const entriesListeners = new Set<Listener>();

function notifyEntries() {
  entriesListeners.forEach((l) => l());
}

function subscribeEntries(l: Listener): () => void {
  entriesListeners.add(l);
  if (!entriesLoadStarted) {
    entriesLoadStarted = true;
    migrateIfNeeded()
      .then(() => loadEntries())
      .then((rows) => {
        entriesCache = rows;
        entriesLoaded = true;
        notifyEntries();
      })
      .catch(() => {
        entriesLoaded = true;
        notifyEntries();
      });
  }
  return () => {
    entriesListeners.delete(l);
  };
}

export function useEntries() {
  const entries = useSyncExternalStore(
    subscribeEntries,
    () => entriesCache,
    () => entriesCache,
  );

  const upsert = useCallback(async (entry: WeightEntry) => {
    const next = await persistUpsert(entry);
    entriesCache = next;
    notifyEntries();
    return next;
  }, []);

  const remove = useCallback(async (personId: PersonId, date: string) => {
    const next = await persistDelete(personId, date);
    entriesCache = next;
    notifyEntries();
    return next;
  }, []);

  const replaceAll = useCallback(async (next: WeightEntry[]) => {
    await persistEntries(next);
    entriesCache = await loadEntries();
    notifyEntries();
    return entriesCache;
  }, []);

  return { entries, loaded: entriesLoaded, upsert, remove, replaceAll };
}

/** `useEntries` narrowed to a single person — the per-person screens use this. */
export function useEntriesForPerson(personId: PersonId) {
  const { entries, ...rest } = useEntries();
  const personEntries = useMemo(
    () => entries.filter((e) => e.personId === personId),
    [entries, personId],
  );
  return { entries: personEntries, ...rest };
}

// --- Persons store ---------------------------------------------------------

let personsCache: Person[] = [];
let personsLoaded = false;
let personsLoadStarted = false;
const personsListeners = new Set<Listener>();

function notifyPersons() {
  personsListeners.forEach((l) => l());
}

function subscribePersons(l: Listener): () => void {
  personsListeners.add(l);
  if (!personsLoadStarted) {
    personsLoadStarted = true;
    migrateIfNeeded()
      .then(() => loadPersons())
      .then((rows) => {
        personsCache = rows;
        personsLoaded = true;
        notifyPersons();
      })
      .catch(() => {
        personsLoaded = true;
        notifyPersons();
      });
  }
  return () => {
    personsListeners.delete(l);
  };
}

export function usePersons() {
  const persons = useSyncExternalStore(
    subscribePersons,
    () => personsCache,
    () => personsCache,
  );

  const upsert = useCallback(async (person: Person) => {
    const next = await persistUpsertPerson(person);
    personsCache = next;
    notifyPersons();
    return next;
  }, []);

  const remove = useCallback(async (id: PersonId) => {
    const result = await persistDeletePerson(id);
    personsCache = result.persons;
    entriesCache = result.entries;
    notifyPersons();
    notifyEntries();
    return result;
  }, []);

  return { persons, loaded: personsLoaded, upsert, remove };
}

/** Looks up one person reactively — `undefined` while loading or if removed. */
export function usePerson(id: PersonId): Person | undefined {
  const { persons } = usePersons();
  return useMemo(() => persons.find((p) => p.id === id), [persons, id]);
}

// --- Settings store --------------------------------------------------------

let settingsCache: Settings = { ...DEFAULT_SETTINGS };
let settingsLoaded = false;
let settingsLoadStarted = false;
const settingsListeners = new Set<Listener>();

function notifySettings() {
  settingsListeners.forEach((l) => l());
}

function subscribeSettings(l: Listener): () => void {
  settingsListeners.add(l);
  if (!settingsLoadStarted) {
    settingsLoadStarted = true;
    loadSettings()
      .then((s) => {
        settingsCache = s;
        settingsLoaded = true;
        notifySettings();
      })
      .catch(() => {
        settingsLoaded = true;
        notifySettings();
      });
  }
  return () => {
    settingsListeners.delete(l);
  };
}

export function useSettings() {
  const settings = useSyncExternalStore(
    subscribeSettings,
    () => settingsCache,
    () => settingsCache,
  );

  const update = useCallback(async (patch: Partial<Settings>) => {
    settingsCache = { ...settingsCache, ...patch };
    notifySettings();
    await persistSettings(settingsCache);
  }, []);

  return { settings, loaded: settingsLoaded, update };
}

// --- Active date store -----------------------------------------------------

let activeDateCache: DateKey = todayKey();
const activeDateListeners = new Set<Listener>();

function notifyActiveDate() {
  activeDateListeners.forEach((l) => l());
}

function subscribeActiveDate(l: Listener): () => void {
  activeDateListeners.add(l);
  return () => {
    activeDateListeners.delete(l);
  };
}

export function setActiveDate(date: DateKey) {
  if (activeDateCache === date) return;
  activeDateCache = date;
  notifyActiveDate();
}

export function useActiveDate(): [DateKey, (d: DateKey) => void] {
  const date = useSyncExternalStore(
    subscribeActiveDate,
    () => activeDateCache,
    () => activeDateCache,
  );
  return [date, setActiveDate];
}

export function __resetHooksForTest() {
  entriesCache = [];
  entriesLoaded = false;
  entriesLoadStarted = false;
  entriesListeners.clear();
  personsCache = [];
  personsLoaded = false;
  personsLoadStarted = false;
  personsListeners.clear();
  settingsCache = { ...DEFAULT_SETTINGS };
  settingsLoaded = false;
  settingsLoadStarted = false;
  settingsListeners.clear();
  activeDateCache = todayKey();
  activeDateListeners.clear();
  __resetStorageForTest();
}
