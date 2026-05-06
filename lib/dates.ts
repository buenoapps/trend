import type { DateKey } from './types';

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export function dateToKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayKey(): DateKey {
  return dateToKey(new Date());
}

export function daysAgoKey(n: number): DateKey {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateToKey(d);
}

export function addDays(key: DateKey, n: number): DateKey {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return dateToKey(d);
}

export function compareKey(a: DateKey, b: DateKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isValidKey(s: string): s is DateKey {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function keyToDate(k: DateKey): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatShort(k: DateKey): string {
  const d = keyToDate(k);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatLong(k: DateKey): string {
  const d = keyToDate(k);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
