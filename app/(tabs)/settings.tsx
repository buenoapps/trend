import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { TimePickerRow } from '@/components/time-picker-row';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEntries, useSettings } from '@/lib/hooks';
import {
  resolveLocale,
  setLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  useT,
} from '@/lib/i18n';
import {
  cancelReminder,
  isSupported as notificationsSupported,
  requestPermission,
  scheduleDailyReminder,
} from '@/lib/notifications';
import { mergeEntries } from '@/lib/serialize';
import { decodePayload, exportEntries, importFromPicker } from '@/lib/share';
import type { LocaleChoice, Unit } from '@/lib/types';

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
};

function confirm(
  title: string,
  message: string,
  cancelLabel: string,
  confirmLabel: string,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, onPress: () => resolve(true) },
    ]);
  });
}

function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const t = useT();
  const { settings, update } = useSettings();
  const { entries, replaceAll } = useEntries();
  const [busy, setBusy] = useState<string | null>(null);

  const supportsReminders = notificationsSupported();

  const setUnit = (unit: Unit) => update({ unit });

  const setLocaleChoice = (localeChoice: LocaleChoice) => {
    setLocale(resolveLocale(localeChoice));
    update({ localeChoice });
  };

  const setReminderEnabled = async (enabled: boolean) => {
    if (!supportsReminders) return;
    if (enabled) {
      const granted = await requestPermission();
      if (!granted) {
        notify(t('alerts.permissionRequired'), t('alerts.permissionBody'));
        return;
      }
      await cancelReminder(settings.reminderNotificationId);
      const id = await scheduleDailyReminder(settings.reminderTime);
      await update({ reminderEnabled: true, reminderNotificationId: id });
    } else {
      await cancelReminder(settings.reminderNotificationId);
      await update({ reminderEnabled: false, reminderNotificationId: undefined });
    }
  };

  const setReminderTime = async (hhmm: string) => {
    await update({ reminderTime: hhmm });
    if (settings.reminderEnabled && supportsReminders) {
      await cancelReminder(settings.reminderNotificationId);
      const id = await scheduleDailyReminder(hhmm);
      await update({ reminderNotificationId: id });
    }
  };

  const handleExport = async (kind: 'json' | 'csv') => {
    if (entries.length === 0) {
      notify(t('alerts.nothingToExport'), t('alerts.nothingToExportBody'));
      return;
    }
    try {
      setBusy(`export-${kind}`);
      await exportEntries(entries, kind);
    } catch (e) {
      notify(t('alerts.exportFailed'), e instanceof Error ? e.message : t('alerts.unknownError'));
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    try {
      setBusy('import');
      const payload = await importFromPicker();
      if (!payload) return;
      const decoded = decodePayload(payload);
      if (!decoded.ok) {
        notify(t('alerts.importFailed'), decoded.reason);
        return;
      }
      const proceed = await confirm(
        t('alerts.importTitle'),
        t('alerts.importConfirm', { count: decoded.value.length, filename: payload.filename }),
        t('alerts.cancel'),
        t('alerts.import'),
      );
      if (!proceed) return;
      const merged = mergeEntries(entries, decoded.value);
      await replaceAll(merged);
      notify(
        t('alerts.importComplete'),
        t('alerts.importCompleteBody', { count: decoded.value.length }),
      );
    } catch (e) {
      notify(t('alerts.importFailed'), e instanceof Error ? e.message : t('alerts.unknownError'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">{t('settings.title')}</ThemedText>

        <Section title={t('settings.units')} palette={palette}>
          <View style={[styles.toggle, { backgroundColor: palette.cardSoft, borderColor: palette.border }]}>
            {(['kg', 'lb'] as Unit[]).map((u) => {
              const active = settings.unit === u;
              return (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.toggleItem, active && { backgroundColor: palette.leaf }]}>
                  <ThemedText
                    style={[styles.toggleText, { color: active ? '#FFFFFF' : palette.text }]}>
                    {u}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <ThemedText style={[styles.note, { color: palette.muted }]}>
            {t('settings.unitsNote')}
          </ThemedText>
        </Section>

        <Section title={t('settings.reminder')} palette={palette}>
          <View style={[styles.row, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <ThemedText style={styles.rowLabel}>{t('settings.reminderSwitch')}</ThemedText>
            <Switch
              value={settings.reminderEnabled && supportsReminders}
              disabled={!supportsReminders}
              onValueChange={setReminderEnabled}
              trackColor={{ true: palette.leaf, false: palette.border }}
            />
          </View>
          <TimePickerRow
            label={t('settings.time')}
            value={settings.reminderTime}
            disabled={!supportsReminders || !settings.reminderEnabled}
            onChange={setReminderTime}
          />
          {!supportsReminders ? (
            <ThemedText style={[styles.note, { color: palette.muted }]}>
              {t('settings.reminderWebNote')}
            </ThemedText>
          ) : null}
        </Section>

        <Section title={t('settings.language')} palette={palette}>
          <View style={styles.languageList}>
            {(['auto', ...SUPPORTED_LOCALES] as LocaleChoice[]).map((choice) => {
              const active = settings.localeChoice === choice;
              const label = choice === 'auto' ? t('settings.languageAuto') : LOCALE_LABELS[choice];
              return (
                <Pressable
                  key={choice}
                  onPress={() => setLocaleChoice(choice)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.languageItem,
                    {
                      borderColor: palette.border,
                      backgroundColor: active ? palette.leaf : palette.card,
                    },
                  ]}>
                  <ThemedText
                    style={[
                      styles.languageText,
                      { color: active ? '#FFFFFF' : palette.text },
                    ]}>
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title={t('settings.yourData')} palette={palette}>
          <Pressable
            disabled={busy === 'export-json'}
            onPress={() => handleExport('json')}
            style={({ pressed }) => [
              styles.action,
              { borderColor: palette.border, backgroundColor: palette.card, opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText style={styles.actionText}>{t('settings.exportJson')}</ThemedText>
            <ThemedText style={[styles.actionSub, { color: palette.muted }]}>
              {t('settings.exportJsonCount', { count: entries.length })}
            </ThemedText>
          </Pressable>
          <Pressable
            disabled={busy === 'export-csv'}
            onPress={() => handleExport('csv')}
            style={({ pressed }) => [
              styles.action,
              { borderColor: palette.border, backgroundColor: palette.card, opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText style={styles.actionText}>{t('settings.exportCsv')}</ThemedText>
            <ThemedText style={[styles.actionSub, { color: palette.muted }]}>
              {t('settings.exportCsvSubtitle')}
            </ThemedText>
          </Pressable>
          <Pressable
            disabled={busy === 'import'}
            onPress={handleImport}
            style={({ pressed }) => [
              styles.action,
              { borderColor: palette.border, backgroundColor: palette.card, opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText style={styles.actionText}>{t('settings.importData')}</ThemedText>
            <ThemedText style={[styles.actionSub, { color: palette.muted }]}>
              {t('settings.importSubtitle')}
            </ThemedText>
          </Pressable>
        </Section>

        <View style={styles.footer}>
          <ThemedText style={[styles.note, { color: palette.muted, textAlign: 'center' }]}>
            {t('settings.footer')}
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  palette,
  children,
}: {
  title: string;
  palette: typeof Colors.light;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={[styles.sectionTitle, { color: palette.muted }]}>
        {title}
      </ThemedText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 24, gap: 16 },
  section: { gap: 8, marginTop: 8 },
  sectionTitle: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  sectionBody: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowLabel: { fontSize: 16, flex: 1, marginRight: 12 },
  toggle: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  toggleItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleText: { fontSize: 15, fontWeight: '600' },
  note: { fontSize: 13, marginTop: 4 },
  languageList: { gap: 8 },
  languageItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  languageText: { fontSize: 16, fontWeight: '600' },
  action: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: { fontSize: 16, fontWeight: '600' },
  actionSub: { fontSize: 12, marginTop: 2 },
  footer: { marginTop: 24, paddingBottom: 16 },
});
