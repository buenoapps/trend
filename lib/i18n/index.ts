import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import { useSyncExternalStore } from 'react';

import type { LocaleChoice } from '../types';

import de from './de';
import en from './en';
import es from './es';
import fr from './fr';
import it from './it';

export const SUPPORTED_LOCALES = ['en', 'de', 'es', 'fr', 'it'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const i18n = new I18n({ en, de, es, fr, it });
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

export function t(key: string, params?: Record<string, string | number>): string {
  return i18n.t(key, params);
}

export function useT(): typeof t {
  useSyncExternalStore(subscribe, () => currentLocale, () => currentLocale);
  return t;
}

export function useLocale(): SupportedLocale {
  return useSyncExternalStore(subscribe, () => currentLocale, () => currentLocale);
}

export function __resetI18nForTest(): void {
  currentLocale = 'en';
  i18n.locale = 'en';
  listeners.clear();
}
