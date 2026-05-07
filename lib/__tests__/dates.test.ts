import { addDays, compareKey, dateToKey, daysAgoKey, formatLong, formatShort, isValidKey, todayKey } from '../dates';

describe('dates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('todayKey returns local YYYY-MM-DD', () => {
    jest.setSystemTime(new Date(2026, 4, 5, 14, 30, 0));
    expect(todayKey()).toBe('2026-05-05');
  });

  it('todayKey zero-pads single-digit month and day', () => {
    jest.setSystemTime(new Date(2026, 0, 3, 8, 0, 0));
    expect(todayKey()).toBe('2026-01-03');
  });

  it('daysAgoKey returns earlier date', () => {
    jest.setSystemTime(new Date(2026, 4, 5, 12, 0, 0));
    expect(daysAgoKey(7)).toBe('2026-04-28');
  });

  it('compareKey orders chronologically', () => {
    expect(compareKey('2025-12-31', '2026-01-01')).toBeLessThan(0);
    expect(compareKey('2026-01-01', '2026-01-01')).toBe(0);
    expect(compareKey('2026-02-01', '2026-01-31')).toBeGreaterThan(0);
  });

  it('isValidKey validates format', () => {
    expect(isValidKey('2026-05-05')).toBe(true);
    expect(isValidKey('2026-5-5')).toBe(false);
    expect(isValidKey('not a date')).toBe(false);
  });

  it('formatShort renders the localized month + day', () => {
    expect(formatShort('2026-01-03', 'en-US')).toBe('Jan 3');
    expect(dateToKey(new Date(2026, 11, 25))).toBe('2026-12-25');
  });

  it('formatLong respects the requested locale', () => {
    const en = formatLong('2026-05-07', 'en-US');
    expect(en).toContain('May');
    expect(en).toContain('7');
    expect(en).toContain('2026');
    const de = formatLong('2026-05-07', 'de-DE');
    expect(de).toContain('Mai');
    expect(de).toContain('2026');
  });

  it('addDays moves forward and back across month boundaries', () => {
    expect(addDays('2026-05-05', 1)).toBe('2026-05-06');
    expect(addDays('2026-05-05', -1)).toBe('2026-05-04');
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });
});
