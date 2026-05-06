import { useCallback, useEffect, useState } from 'react';

import {
  loadEntries,
  loadSettings,
  saveSettings as persistSettings,
  upsertEntry as persistUpsert,
  deleteEntry as persistDelete,
  saveEntries as persistEntries,
} from './storage';
import { DEFAULT_SETTINGS, type Settings, type WeightEntry } from './types';

export function useEntries() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadEntries().then((rows) => {
      if (!cancelled) {
        setEntries(rows);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const upsert = useCallback(async (entry: WeightEntry) => {
    const next = await persistUpsert(entry);
    setEntries(next);
    return next;
  }, []);

  const remove = useCallback(async (date: string) => {
    const next = await persistDelete(date);
    setEntries(next);
    return next;
  }, []);

  const replaceAll = useCallback(async (next: WeightEntry[]) => {
    await persistEntries(next);
    const fresh = await loadEntries();
    setEntries(fresh);
    return fresh;
  }, []);

  return { entries, loaded, upsert, remove, replaceAll };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSettings().then((s) => {
      if (!cancelled) {
        setSettings(s);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      persistSettings(next);
      return next;
    });
  }, []);

  return { settings, loaded, update };
}
