import type { PersonColorKey } from '@/constants/theme';

export type DateKey = string;

export type Unit = 'kg' | 'lb';

export type PersonId = string;
export type PersonKind = 'adult' | 'kid';
export type Goal = 'none' | 'lose' | 'gain';
export type CardDisplay = 'big' | 'small' | 'hidden';

export type Person = {
  id: PersonId;
  name: string;
  colorKey: PersonColorKey;
  kind: PersonKind;
  goal: Goal;
  cardDisplay: CardDisplay;
  createdAt: number;
};

/** A weight reading without an owner — produced by the entry form / decoders. */
export type DraftEntry = {
  date: DateKey;
  kg: number;
};

export type WeightEntry = DraftEntry & {
  personId: PersonId;
};

export type LocaleChoice = 'auto' | 'en' | 'de' | 'es' | 'fr' | 'it';

export type Settings = {
  unit: Unit;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderNotificationId?: string;
  localeChoice: LocaleChoice;
};

export const DEFAULT_SETTINGS: Settings = {
  unit: 'kg',
  reminderEnabled: false,
  reminderTime: '09:00',
  localeChoice: 'auto',
};
