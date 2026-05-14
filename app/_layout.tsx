import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { todayKey } from '@/lib/dates';
import { setActiveDate, useSettings } from '@/lib/hooks';
import { resolveLocale, setLocale, useT } from '@/lib/i18n';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const t = useT();
  const { settings, loaded } = useSettings();

  useEffect(() => {
    if (loaded) setLocale(resolveLocale(settings.localeChoice));
  }, [loaded, settings.localeChoice]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handle = () => {
      setActiveDate(todayKey());
      router.navigate('/');
    };
    Notifications.getLastNotificationResponseAsync().then((resp) => {
      if (resp) handle();
    });
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text,
          headerShadowVisible: false,
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
        <Stack.Screen name="person/new" options={{ title: t('personForm.create') }} />
        <Stack.Screen name="person/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
