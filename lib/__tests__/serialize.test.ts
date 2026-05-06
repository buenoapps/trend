import {
  entriesFromCsv,
  entriesFromJson,
  entriesToCsv,
  entriesToJson,
  mergeEntries,
  sniffFormat,
} from '../serialize';
import type { WeightEntry } from '../types';

const sample: WeightEntry[] = [
  { date: '2026-05-01', kg: 72.5 },
  { date: '2026-05-02', kg: 72.05 },
  { date: '2026-05-03', kg: 71.9 },
];

describe('serialize', () => {
  it('JSON roundtrip', () => {
    const text = entriesToJson(sample);
    const r = entriesFromJson(text);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual(sample);
  });

  it('JSON accepts a bare array shape', () => {
    const r = entriesFromJson(JSON.stringify(sample));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual(sample);
  });

  it('JSON rejects bad shape', () => {
    expect(entriesFromJson('{}').ok).toBe(false);
    expect(entriesFromJson('not json').ok).toBe(false);
    expect(entriesFromJson(JSON.stringify([{ date: 'bad', kg: 1 }])).ok).toBe(false);
    expect(entriesFromJson(JSON.stringify([{ date: '2026-05-01', kg: -1 }])).ok).toBe(false);
  });

  it('CSV roundtrip preserves decimals', () => {
    const text = entriesToCsv(sample);
    expect(text.startsWith('date,kg\n')).toBe(true);
    const r = entriesFromCsv(text);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual(sample);
  });

  it('CSV tolerates CRLF and trailing newline', () => {
    const text = 'date,kg\r\n2026-05-01,72.5\r\n2026-05-02,72.05\r\n\r\n';
    const r = entriesFromCsv(text);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toHaveLength(2);
  });

  it('CSV without header still parses', () => {
    const r = entriesFromCsv('2026-05-01,72.5\n2026-05-02,72.05\n');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toHaveLength(2);
  });

  it('CSV rejects malformed rows', () => {
    expect(entriesFromCsv('date,kg\n2026-05-01').ok).toBe(false);
    expect(entriesFromCsv('date,kg\n2026-05-01,abc').ok).toBe(false);
    expect(entriesFromCsv('date,kg\nbad-date,72').ok).toBe(false);
  });

  it('mergeEntries — incoming wins on date collision, sorted', () => {
    const existing: WeightEntry[] = [
      { date: '2026-05-01', kg: 70 },
      { date: '2026-05-03', kg: 72 },
    ];
    const incoming: WeightEntry[] = [
      { date: '2026-05-01', kg: 71.5 },
      { date: '2026-05-02', kg: 71 },
    ];
    expect(mergeEntries(existing, incoming)).toEqual([
      { date: '2026-05-01', kg: 71.5 },
      { date: '2026-05-02', kg: 71 },
      { date: '2026-05-03', kg: 72 },
    ]);
  });

  it('sniffFormat distinguishes JSON from CSV', () => {
    expect(sniffFormat('  {"entries":[]}')).toBe('json');
    expect(sniffFormat('[]')).toBe('json');
    expect(sniffFormat('date,kg\n2026-05-01,72')).toBe('csv');
  });
});
