import type { Unit } from './types';

export const KG_PER_LB = 0.45359237;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function formatWeight(kg: number, unit: Unit, opts?: { withUnit?: boolean }): string {
  const value = unit === 'kg' ? kg : kgToLb(kg);
  const rounded = (Math.round(value * 10) / 10).toFixed(1);
  return opts?.withUnit === false ? rounded : `${rounded} ${unit}`;
}

export type ParseResult =
  | { ok: true; kg: number }
  | { ok: false; reason: 'empty' | 'not-a-number' | 'negative' | 'too-large' };

export function parseWeightInput(text: string, unit: Unit): ParseResult {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed.length === 0) return { ok: false, reason: 'empty' };
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return { ok: false, reason: 'not-a-number' };
  if (n <= 0) return { ok: false, reason: 'negative' };
  const kg = unit === 'kg' ? n : lbToKg(n);
  if (kg > 1000) return { ok: false, reason: 'too-large' };
  return { ok: true, kg };
}

export type FormErrorKey =
  | 'form.errorEmpty'
  | 'form.errorNotANumber'
  | 'form.errorNegative'
  | 'form.errorTooLarge';

export function reasonToKey(reason: Exclude<ParseResult, { ok: true }>['reason']): FormErrorKey {
  switch (reason) {
    case 'empty':
      return 'form.errorEmpty';
    case 'not-a-number':
      return 'form.errorNotANumber';
    case 'negative':
      return 'form.errorNegative';
    case 'too-large':
      return 'form.errorTooLarge';
  }
}
