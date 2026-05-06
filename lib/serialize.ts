import { compareKey, isValidKey } from './dates';
import type { WeightEntry } from './types';

export type DecodeResult<T> = { ok: true; value: T } | { ok: false; reason: string };

export function entriesToJson(entries: WeightEntry[]): string {
  return JSON.stringify({ version: 1, entries }, null, 2);
}

export function entriesFromJson(text: string): DecodeResult<WeightEntry[]> {
  try {
    const parsed = JSON.parse(text);
    const list: unknown = Array.isArray(parsed) ? parsed : parsed?.entries;
    if (!Array.isArray(list)) return { ok: false, reason: 'No entries array' };
    const out: WeightEntry[] = [];
    for (const item of list) {
      if (!item || typeof item !== 'object') return { ok: false, reason: 'Invalid entry' };
      const date = (item as { date?: unknown }).date;
      const kg = (item as { kg?: unknown }).kg;
      if (typeof date !== 'string' || !isValidKey(date)) {
        return { ok: false, reason: `Invalid date: ${String(date)}` };
      }
      if (typeof kg !== 'number' || !Number.isFinite(kg) || kg <= 0) {
        return { ok: false, reason: `Invalid kg: ${String(kg)}` };
      }
      out.push({ date, kg });
    }
    return { ok: true, value: out };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}

export function entriesToCsv(entries: WeightEntry[]): string {
  const rows = ['date,kg', ...entries.map((e) => `${e.date},${e.kg}`)];
  return rows.join('\n') + '\n';
}

export function entriesFromCsv(text: string): DecodeResult<WeightEntry[]> {
  const lines = text.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return { ok: false, reason: 'Empty CSV' };
  const header = lines[0].toLowerCase().replace(/\s+/g, '');
  const startIndex = header === 'date,kg' ? 1 : 0;
  const out: WeightEntry[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.trim());
    if (parts.length !== 2) return { ok: false, reason: `Malformed row: ${lines[i]}` };
    const [date, kgStr] = parts;
    if (!isValidKey(date)) return { ok: false, reason: `Invalid date: ${date}` };
    const kg = Number(kgStr);
    if (!Number.isFinite(kg) || kg <= 0) return { ok: false, reason: `Invalid kg: ${kgStr}` };
    out.push({ date, kg });
  }
  return { ok: true, value: out };
}

export function mergeEntries(existing: WeightEntry[], incoming: WeightEntry[]): WeightEntry[] {
  const byDate = new Map<string, WeightEntry>();
  for (const e of existing) byDate.set(e.date, e);
  for (const e of incoming) byDate.set(e.date, e);
  return Array.from(byDate.values()).sort((a, b) => compareKey(a.date, b.date));
}

export function sniffFormat(text: string): 'json' | 'csv' {
  const head = text.replace(/^﻿/, '').trimStart();
  return head.startsWith('{') || head.startsWith('[') ? 'json' : 'csv';
}
