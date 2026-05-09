import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import { useMemo, useSyncExternalStore } from 'react';

import type { LocaleChoice } from '../types';

import de from './de';
import en, { type Translations } from './en';
import es from './es';
import fr from './fr';
import italian from './it';

export const SUPPORTED_LOCALES = ['en', 'de', 'es', 'fr', 'it'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

type Plural = { one: string; other: string };

type Leaves<T, P extends string = ''> = T extends Plural | string
  ? P
  : T extends object
    ? {
        [K in keyof T]: Leaves<
          T[K],
          P extends '' ? Extract<K, string> : `${P}.${Extract<K, string>}`
        >;
      }[keyof T]
    : never;

export type TranslationKey = Exclude<Leaves<Translations>, ''>;

export type TFunction = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

const i18n = new I18n({ en, de, es, fr, it: italian });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

function isSupported(code: string | undefined | null): code is SupportedLocale {
  return !!code && (SUPPORTED_LOCALES as readonly string[]).includes(code);
}

export function detectDeviceLocale(): SupportedLocale {
  const code = getLocales()[0]?.languageCode;
  return isSupported(code) ? code : 'en';
}

export function resolveLocale(choice: LocaleChoice): SupportedLocale {
  return choice === 'auto' ? detectDeviceLocale() : choice;
}

let currentLocale: SupportedLocale = detectDeviceLocale();
i18n.locale = currentLocale;

const listeners = new Set<() => void>();

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function setLocale(loc: SupportedLocale): void {
  if (currentLocale === loc) return;
  currentLocale = loc;
  i18n.locale = loc;
  listeners.forEach((l) => l());
}

export function getLocale(): SupportedLocale {
  return currentLocale;
}

export const t: TFunction = (key, params) => i18n.t(key, params);

// React Compiler memoizes the result of `t(key)` based on the identity of `t`
// and its arguments. Since `t` reads `i18n.locale` (a hidden mutable side-channel),
// the compiler cannot detect when the result should change. Returning a fresh
// closure per locale gives every downstream memoizer a new dependency to track,
// so locale switches propagate through every `t(...)` call site.
export function useT(): TFunction {
  const locale = useSyncExternalStore(subscribe, () => currentLocale, () => currentLocale);
  return useMemo<TFunction>(
    () => (key, params) => i18n.t(key, params),
    [locale],
  );
}

export function useLocale(): SupportedLocale {
  return useSyncExternalStore(subscribe, () => currentLocale, () => currentLocale);
}

export function __resetI18nForTest(): void {
  currentLocale = 'en';
  i18n.locale = 'en';
  listeners.clear();
}
