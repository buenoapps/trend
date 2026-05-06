import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { TimePickerRow } from '@/components/time-picker-row';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEntries, useSettings } from '@/lib/hooks';
import {
  cancelReminder,
  isSupported as notificationsSupported,
  requestPermission,
  scheduleDailyReminder,
} from '@/lib/notifications';
import { mergeEntries } from '@/lib/serialize';
import { decodePayload, exportEntries, importFromPicker } from '@/lib/share';
import type { Unit } from '@/lib/types';

function confirm(message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    Alert.alert('Import data', message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Import', onPress: () => resolve(true) },
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
  const { settings, update } = useSettings();
  const { entries, replaceAll } = useEntries();
  const [busy, setBusy] = useState<string | null>(null);

  const supportsReminders = notificationsSupported();

  const setUnit = (unit: Unit) => update({ unit });

  const setReminderEnabled = async (enabled: boolean) => {
    if (!supportsReminders) return;
    if (enabled) {
      const granted = await requestPermission();
      if (!granted) {
        notify('Permission required', 'Enable notifications in your device settings to use reminders.');
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
      notify('Nothing to export', 'Log a weight first, then come back.');
      return;
    }
    try {
      setBusy(`export-${kind}`);
      await exportEntries(entries, kind);
    } catch (e) {
      notify('Export failed', e instanceof Error ? e.message : 'Unknown error');
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
        notify('Import failed', decoded.reason);
        return;
      }
      const proceed = await confirm(
        `Import ${decoded.value.length} entries from ${payload.filename}? Existing entries on the same date will be replaced.`
      );
      if (!proceed) return;
      const merged = mergeEntries(entries, decoded.value);
      await replaceAll(merged);
      notify('Import complete', `${decoded.value.length} entries merged.`);
    } catch (e) {
      notify('Import failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Settings</ThemedText>

        <Section title="Units" palette={palette}>
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
            Stored internally in kilograms; switch any time without losing data.
          </ThemedText>
        </Section>

        <Section title="Daily reminder" palette={palette}>
          <View style={[styles.row, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <ThemedText style={styles.rowLabel}>Remind me to log my weight</ThemedText>
            <Switch
              value={settings.reminderEnabled && supportsReminders}
              disabled={!supportsReminders}
              onValueChange={setReminderEnabled}
              trackColor={{ true: palette.leaf, false: palette.border }}
            />
          </View>
          <TimePickerRow
            label="Time"
            value={settings.reminderTime}
            disabled={!supportsReminders || !settings.reminderEnabled}
            onChange={setReminderTime}
          />
          {!supportsReminders ? (
            <ThemedText style={[styles.note, { color: palette.muted }]}>
              Reminders aren&apos;t available on web yet — open Trend on iOS or Android to enable them.
            </ThemedText>
          ) : null}
        </Section>

        <Section title="Your data" palette={palette}>
          <Pressable
            disabled={busy === 'export-json'}
            onPress={() => handleExport('json')}
            style={({ pressed }) => [
              styles.action,
              { borderColor: palette.border, backgroundColor: palette.card, opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText style={styles.actionText}>Export as JSON</ThemedText>
            <ThemedText style={[styles.actionSub, { color: palette.muted }]}>
              {entries.length} entries
            </ThemedText>
          </Pressable>
          <Pressable
            disabled={busy === 'export-csv'}
            onPress={() => handleExport('csv')}
            style={({ pressed }) => [
              styles.action,
              { borderColor: palette.border, backgroundColor: palette.card, opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText style={styles.actionText}>Export as CSV</ThemedText>
            <ThemedText style={[styles.actionSub, { color: palette.muted }]}>
              Spreadsheet-friendly
            </ThemedText>
          </Pressable>
          <Pressable
            disabled={busy === 'import'}
            onPress={handleImport}
            style={({ pressed }) => [
              styles.action,
              { borderColor: palette.border, backgroundColor: palette.card, opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText style={styles.actionText}>Import data</ThemedText>
            <ThemedText style={[styles.actionSub, { color: palette.muted }]}>
              JSON or CSV — same-day entries are replaced
            </ThemedText>
          </Pressable>
        </Section>

        <View style={styles.footer}>
          <ThemedText style={[styles.note, { color: palette.muted, textAlign: 'center' }]}>
            Trend keeps everything on this device. Your sprout believes in you.
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
