import {
  decodeBackup,
  decodeCsv,
  encodeBackup,
  entriesToCsv,
  mergeEntries,
  sniffFormat,
} from '../serialize';
import type { Person, WeightEntry } from '../types';

const persons: Person[] = [
  { id: 'p1', name: 'Ada', colorKey: 'leaf', kind: 'adult', goal: 'lose', cardDisplay: 'big', createdAt: 1 },
  { id: 'p2', name: 'Bo', colorKey: 'sky', kind: 'kid', goal: 'none', cardDisplay: 'small', createdAt: 2 },
];

const entries: WeightEntry[] = [
  { personId: 'p1', date: '2026-05-01', kg: 72.5 },
  { personId: 'p1', date: '2026-05-02', kg: 72.05 },
  { personId: 'p2', date: '2026-05-01', kg: 30.2 },
];

describe('serialize — backup (v2)', () => {
  it('roundtrips persons + entries', () => {
    const r = decodeBackup(encodeBackup(persons, entries));
    expect(r.ok).toBe(true);
    if (r.ok && r.value.kind === 'full') {
      expect(r.value.persons).toEqual(persons);
      expect(r.value.entries).toEqual(entries);
    } else {
      throw new Error('expected a full backup');
    }
  });

  it('rejects a v2 entry referencing an unknown person', () => {
    const text = JSON.stringify({
      version: 2,
      persons,
      entries: [{ personId: 'ghost', date: '2026-05-01', kg: 70 }],
    });
    expect(decodeBackup(text).ok).toBe(false);
  });
});

describe('serialize — backup back-compat (v1)', () => {
  it('decodes a v1 `{ version: 1, entries }` payload as owner-less entries', () => {
    const text = JSON.stringify({ version: 1, entries: [{ date: '2026-05-01', kg: 70 }] });
    const r = decodeBackup(text);
    expect(r.ok).toBe(true);
    if (r.ok && r.value.kind === 'entries') {
      expect(r.value.entries).toEqual([{ date: '2026-05-01', kg: 70 }]);
    } else {
      throw new Error('expected owner-less entries');
    }
  });

  it('decodes a bare array as owner-less entries', () => {
    const r = decodeBackup(JSON.stringify([{ date: '2026-05-01', kg: 70 }]));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.kind).toBe('entries');
  });

  it('rejects bad shapes', () => {
    expect(decodeBackup('{}').ok).toBe(false);
    expect(decodeBackup('not json').ok).toBe(false);
    expect(decodeBackup(JSON.stringify([{ date: 'bad', kg: 1 }])).ok).toBe(false);
    expect(decodeBackup(JSON.stringify([{ date: '2026-05-01', kg: -1 }])).ok).toBe(false);
  });
});

describe('serialize — CSV (per-person, owner-less)', () => {
  it('roundtrips date,kg rows', () => {
    const text = entriesToCsv([
      { date: '2026-05-01', kg: 72.5 },
      { date: '2026-05-02', kg: 72.05 },
    ]);
    expect(text.startsWith('date,kg\n')).toBe(true);
    const r = decodeCsv(text);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toHaveLength(2);
  });

  it('tolerates CRLF, trailing newline, and a missing header', () => {
    expect(decodeCsv('date,kg\r\n2026-05-01,72.5\r\n\r\n').ok).toBe(true);
    expect(decodeCsv('2026-05-01,72.5\n2026-05-02,72.05\n').ok).toBe(true);
  });

  it('rejects malformed rows', () => {
    expect(decodeCsv('date,kg\n2026-05-01').ok).toBe(false);
    expect(decodeCsv('date,kg\n2026-05-01,abc').ok).toBe(false);
    expect(decodeCsv('date,kg\nbad-date,72').ok).toBe(false);
  });
});

describe('serialize — mergeEntries', () => {
  it('keys by (personId, date) — same date, different persons both survive', () => {
    const merged = mergeEntries(
      [{ personId: 'p1', date: '2026-05-01', kg: 70 }],
      [{ personId: 'p2', date: '2026-05-01', kg: 30 }],
    );
    expect(merged).toHaveLength(2);
  });

  it('incoming wins on a (personId, date) collision', () => {
    const merged = mergeEntries(
      [{ personId: 'p1', date: '2026-05-01', kg: 70 }],
      [{ personId: 'p1', date: '2026-05-01', kg: 71.5 }],
    );
    expect(merged).toEqual([{ personId: 'p1', date: '2026-05-01', kg: 71.5 }]);
  });
});

describe('serialize — sniffFormat', () => {
  it('distinguishes JSON from CSV', () => {
    expect(sniffFormat('  {"persons":[]}')).toBe('json');
    expect(sniffFormat('[]')).toBe('json');
    expect(sniffFormat('date,kg\n2026-05-01,72')).toBe('csv');
  });
});
