import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  STORAGE_KEYS,
  loadEntries,
  loadSettings,
  saveEntries,
  saveSettings,
  upsertEntry,
} from '../storage';
import { DEFAULT_SETTINGS } from '../types';

describe('storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('loadEntries returns [] when empty', async () => {
    expect(await loadEntries()).toEqual([]);
  });

  it('upsertEntry overwrites the same date', async () => {
    await upsertEntry({ date: '2026-05-01', kg: 72 });
    const after = await upsertEntry({ date: '2026-05-01', kg: 73.5 });
    expect(after).toHaveLength(1);
    expect(after[0]).toEqual({ date: '2026-05-01', kg: 73.5 });
  });

  it('upsertEntry appends and sorts ascending', async () => {
    await upsertEntry({ date: '2026-05-03', kg: 71 });
    await upsertEntry({ date: '2026-05-01', kg: 72 });
    const after = await upsertEntry({ date: '2026-05-02', kg: 73 });
    expect(after.map((e) => e.date)).toEqual(['2026-05-01', '2026-05-02', '2026-05-03']);
  });

  it('saveEntries rounds kg to 2 decimals and sorts', async () => {
    await saveEntries([
      { date: '2026-05-02', kg: 72.123456 },
      { date: '2026-05-01', kg: 70.999 },
    ]);
    const entries = await loadEntries();
    expect(entries).toEqual([
      { date: '2026-05-01', kg: 71 },
      { date: '2026-05-02', kg: 72.12 },
    ]);
  });

  it('saveEntries drops invalid rows', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.entries,
      JSON.stringify([
        { date: '2026-05-01', kg: 70 },
        { date: 'bad-date', kg: 70 },
        { date: '2026-05-02', kg: -1 },
        { date: '2026-05-03', kg: 71 },
      ])
    );
    expect(await loadEntries()).toEqual([
      { date: '2026-05-01', kg: 70 },
      { date: '2026-05-03', kg: 71 },
    ]);
  });

  it('loadSettings returns defaults when empty', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('saveSettings + loadSettings roundtrip', async () => {
    const next = { ...DEFAULT_SETTINGS, unit: 'lb' as const, reminderEnabled: true, reminderTime: '08:30' };
    await saveSettings(next);
    expect(await loadSettings()).toEqual(next);
  });
});
