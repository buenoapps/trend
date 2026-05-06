import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export function isSupported(): boolean {
  return Platform.OS !== 'web';
}

export async function requestPermission(): Promise<boolean> {
  if (!isSupported()) return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.status === 'granted';
}

function parseHHmm(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return {
    hour: Math.max(0, Math.min(23, Number.isFinite(h) ? h : 9)),
    minute: Math.max(0, Math.min(59, Number.isFinite(m) ? m : 0)),
  };
}

export async function scheduleDailyReminder(hhmm: string): Promise<string | undefined> {
  if (!isSupported()) return undefined;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('trend-reminder', {
      name: 'Daily reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { hour, minute } = parseHHmm(hhmm);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to log your weight',
      body: 'A quick tap keeps your trend honest.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'trend-reminder',
    },
  });
  return id;
}

export async function cancelReminder(id?: string): Promise<void> {
  if (!isSupported() || !id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // already gone, ignore
  }
}
