export type DateKey = string;

export type Unit = 'kg' | 'lb';

export type WeightEntry = {
  date: DateKey;
  kg: number;
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
