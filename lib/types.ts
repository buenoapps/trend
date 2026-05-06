export type DateKey = string;

export type Unit = 'kg' | 'lb';

export type WeightEntry = {
  date: DateKey;
  kg: number;
};

export type Settings = {
  unit: Unit;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderNotificationId?: string;
};

export const DEFAULT_SETTINGS: Settings = {
  unit: 'kg',
  reminderEnabled: false,
  reminderTime: '09:00',
};
