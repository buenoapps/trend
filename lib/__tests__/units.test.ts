import { formatWeight, kgToLb, lbToKg, parseWeightInput } from '../units';

describe('units', () => {
  it('kgToLb is reasonable', () => {
    expect(kgToLb(1)).toBeCloseTo(2.2046, 3);
    expect(kgToLb(0)).toBe(0);
  });

  it('lb -> kg -> lb roundtrips', () => {
    expect(lbToKg(kgToLb(75))).toBeCloseTo(75, 6);
    expect(kgToLb(lbToKg(165))).toBeCloseTo(165, 6);
  });

  it('parseWeightInput accepts comma decimals', () => {
    const r = parseWeightInput('72,5', 'kg');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.kg).toBe(72.5);
  });

  it('parseWeightInput converts lb input to kg', () => {
    const r = parseWeightInput('165', 'lb');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.kg).toBeCloseTo(74.84, 1);
  });

  it('parseWeightInput rejects bad input', () => {
    expect(parseWeightInput('', 'kg')).toEqual({ ok: false, reason: 'empty' });
    expect(parseWeightInput('abc', 'kg')).toEqual({ ok: false, reason: 'not-a-number' });
    expect(parseWeightInput('-3', 'kg')).toEqual({ ok: false, reason: 'negative' });
    expect(parseWeightInput('5000', 'kg')).toEqual({ ok: false, reason: 'too-large' });
  });

  it('formatWeight renders with one decimal', () => {
    expect(formatWeight(75, 'kg')).toBe('75.0 kg');
    expect(formatWeight(75, 'lb')).toBe('165.3 lb');
    expect(formatWeight(75, 'kg', { withUnit: false })).toBe('75.0');
  });
});
