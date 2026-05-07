import { useCallback, useSyncExternalStore } from 'react';

import { todayKey } from './dates';
import {
  loadEntries,
  loadSettings,
  saveSettings as persistSettings,
  upsertEntry as persistUpsert,
  deleteEntry as persistDelete,
  saveEntries as persistEntries,
} from './storage';
import { DEFAULT_SETTINGS, type DateKey, type Settings, type WeightEntry } from './types';

type Listener = () => void;

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
    loadEntries()
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

  const remove = useCallback(async (date: string) => {
    const next = await persistDelete(date);
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
  settingsCache = { ...DEFAULT_SETTINGS };
  settingsLoaded = false;
  settingsLoadStarted = false;
  settingsListeners.clear();
  activeDateCache = todayKey();
  activeDateListeners.clear();
}
