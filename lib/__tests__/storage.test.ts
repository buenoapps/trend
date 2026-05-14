import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  __resetStorageForTest,
  deletePerson,
  loadEntries,
  loadPersons,
  loadSettings,
  migrateIfNeeded,
  saveEntries,
  saveSettings,
  STORAGE_KEYS,
  upsertEntry,
  upsertPerson,
} from '../storage';
import { DEFAULT_SETTINGS, type Person } from '../types';

const PERSON: Person = {
  id: 'p1',
  name: 'Ada',
  colorKey: 'leaf',
  kind: 'adult',
  goal: 'none',
  cardDisplay: 'big',
  createdAt: 1,
};

describe('storage — entries', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetStorageForTest();
  });

  it('loadEntries returns [] when empty', async () => {
    expect(await loadEntries()).toEqual([]);
  });

  it('upsertEntry overwrites the same (person, date)', async () => {
    await upsertEntry({ personId: 'p1', date: '2026-05-01', kg: 72 });
    const after = await upsertEntry({ personId: 'p1', date: '2026-05-01', kg: 73.5 });
    expect(after).toHaveLength(1);
    expect(after[0]).toEqual({ personId: 'p1', date: '2026-05-01', kg: 73.5 });
  });

  it('upsertEntry keeps same-date entries for different persons', async () => {
    await upsertEntry({ personId: 'p1', date: '2026-05-01', kg: 72 });
    const after = await upsertEntry({ personId: 'p2', date: '2026-05-01', kg: 60 });
    expect(after).toHaveLength(2);
  });

  it('loadEntries rounds kg and drops invalid / owner-less rows', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.entries,
      JSON.stringify([
        { personId: 'p1', date: '2026-05-01', kg: 70.999 },
        { personId: 'p1', date: 'bad-date', kg: 70 },
        { date: '2026-05-02', kg: 71 },
        { personId: 'p1', date: '2026-05-03', kg: -1 },
      ]),
    );
    expect(await loadEntries()).toEqual([{ personId: 'p1', date: '2026-05-01', kg: 71 }]);
  });

  it('saveEntries roundtrips', async () => {
    await saveEntries([{ personId: 'p1', date: '2026-05-02', kg: 72.1 }]);
    expect(await loadEntries()).toEqual([{ personId: 'p1', date: '2026-05-02', kg: 72.1 }]);
  });
});

describe('storage — persons', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetStorageForTest();
  });

  it('upsertPerson adds then updates by id', async () => {
    await upsertPerson(PERSON);
    const after = await upsertPerson({ ...PERSON, name: 'Ada Lovelace' });
    expect(after).toHaveLength(1);
    expect(after[0].name).toBe('Ada Lovelace');
  });

  it('clamps a kid to goal=none', async () => {
    const [p] = await upsertPerson({ ...PERSON, kind: 'kid', goal: 'lose' });
    expect(p.goal).toBe('none');
  });

  it("deletePerson cascades to that person's entries only", async () => {
    await upsertPerson(PERSON);
    await upsertPerson({ ...PERSON, id: 'p2', name: 'Bo', createdAt: 2 });
    await upsertEntry({ personId: 'p1', date: '2026-05-01', kg: 70 });
    await upsertEntry({ personId: 'p2', date: '2026-05-01', kg: 60 });
    const { persons, entries } = await deletePerson('p1');
    expect(persons.map((p) => p.id)).toEqual(['p2']);
    expect(entries).toEqual([{ personId: 'p2', date: '2026-05-01', kg: 60 }]);
  });
});

describe('storage — migration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetStorageForTest();
  });

  it('migrates legacy v1 entries onto a default person', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.entriesLegacy,
      JSON.stringify([
        { date: '2026-05-01', kg: 70 },
        { date: '2026-05-02', kg: 71 },
      ]),
    );
    await migrateIfNeeded();

    const persons = await loadPersons();
    expect(persons).toHaveLength(1);
    expect(persons[0].name).toBe('Me');

    const entries = await loadEntries();
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.personId === persons[0].id)).toBe(true);

    // The legacy key is left untouched as a backup.
    expect(await AsyncStorage.getItem(STORAGE_KEYS.entriesLegacy)).not.toBeNull();
  });

  it('with no legacy data writes empty persons + entries', async () => {
    await migrateIfNeeded();
    expect(await loadPersons()).toEqual([]);
    expect(await loadEntries()).toEqual([]);
  });

  it('is idempotent — a second launch does not re-create the person', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.entriesLegacy,
      JSON.stringify([{ date: '2026-05-01', kg: 70 }]),
    );
    await migrateIfNeeded();
    const firstId = (await loadPersons())[0].id;

    __resetStorageForTest(); // simulate a fresh app launch
    await migrateIfNeeded();

    const persons = await loadPersons();
    expect(persons).toHaveLength(1);
    expect(persons[0].id).toBe(firstId);
  });

  it('concurrent callers share one migration promise', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.entriesLegacy,
      JSON.stringify([{ date: '2026-05-01', kg: 70 }]),
    );
    await Promise.all([migrateIfNeeded(), migrateIfNeeded(), migrateIfNeeded()]);
    expect(await loadPersons()).toHaveLength(1);
  });
});

describe('storage — settings', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetStorageForTest();
  });

  it('loadSettings returns defaults when empty', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('saveSettings + loadSettings roundtrip', async () => {
    const next = {
      ...DEFAULT_SETTINGS,
      unit: 'lb' as const,
      reminderEnabled: true,
      reminderTime: '08:30',
    };
    await saveSettings(next);
    expect(await loadSettings()).toEqual(next);
  });
});
