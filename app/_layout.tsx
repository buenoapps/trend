import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { todayKey } from '@/lib/dates';
import { setActiveDate, useSettings } from '@/lib/hooks';
import { resolveLocale, setLocale } from '@/lib/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { settings, loaded } = useSettings();

  useEffect(() => {
    if (loaded) setLocale(resolveLocale(settings.localeChoice));
  }, [loaded, settings.localeChoice]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handle = () => {
      setActiveDate(todayKey());
      router.navigate('/(tabs)');
    };
    Notifications.getLastNotificationResponseAsync().then((resp) => {
      if (resp) handle();
    });
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
