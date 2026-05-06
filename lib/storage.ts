import AsyncStorage from '@react-native-async-storage/async-storage';

import { compareKey, isValidKey } from './dates';
import { DEFAULT_SETTINGS, type Settings, type WeightEntry } from './types';

export const STORAGE_KEYS = {
  entries: 'trend.entries.v1',
  settings: 'trend.settings.v1',
} as const;

function roundKg(kg: number): number {
  return Math.round(kg * 100) / 100;
}

function sanitize(entries: WeightEntry[]): WeightEntry[] {
  return entries
    .filter((e) => e && isValidKey(e.date) && Number.isFinite(e.kg) && e.kg > 0)
    .map((e) => ({ date: e.date, kg: roundKg(e.kg) }))
    .sort((a, b) => compareKey(a.date, b.date));
}

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
  const clean = sanitize(entries);
  await AsyncStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(clean));
}

export async function upsertEntry(entry: WeightEntry): Promise<WeightEntry[]> {
  const current = await loadEntries();
  const next = [...current.filter((e) => e.date !== entry.date), { date: entry.date, kg: roundKg(entry.kg) }];
  const sorted = sanitize(next);
  await AsyncStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(sorted));
  return sorted;
}

export async function deleteEntry(date: string): Promise<WeightEntry[]> {
  const current = await loadEntries();
  const next = current.filter((e) => e.date !== date);
  await AsyncStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(next));
  return next;
}

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
