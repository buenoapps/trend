import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonForm } from '@/components/person-form';
import { PersonNotFound } from '@/components/person-not-found';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { confirm, notify } from '@/lib/alerts';
import { useEntriesForPerson, usePersons } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { exportPersonCsv } from '@/lib/share';

export default function PersonSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const palette = Colors[useColorScheme()];
  const t = useT();
  const router = useRouter();
  const { persons, loaded, upsert, remove } = usePersons();
  const person = persons.find((p) => p.id === id);
  const { entries } = useEntriesForPerson(id);
  const [busy, setBusy] = useState<string | null>(null);

  if (loaded && !person) return <PersonNotFound />;
  if (!person) return <View style={[styles.flex, { backgroundColor: palette.background }]} />;

  const handleExportCsv = async () => {
    if (entries.length === 0) {
      notify(t('alerts.nothingToExport'), t('alerts.nothingToExportBody'));
      return;
    }
    try {
      setBusy('csv');
      await exportPersonCsv(person.name, entries);
    } catch (e) {
      notify(t('alerts.exportFailed'), e instanceof Error ? e.message : t('alerts.unknownError'));
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm(
      t('person.deleteConfirmTitle', { name: person.name }),
      t('person.deleteConfirmBody', { name: person.name }),
      t('alerts.cancel'),
      t('person.delete'),
    );
    if (!ok) return;
    await remove(person.id);
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: palette.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PersonForm
          initial={{
            name: person.name,
            colorKey: person.colorKey,
            kind: person.kind,
            goal: person.goal,
            cardDisplay: person.cardDisplay,
          }}
          submitLabel={t('personForm.save')}
          onSubmit={async (draft) => {
            await upsert({ ...person, ...draft });
            router.back();
          }}
        />

        <Pressable
          disabled={busy === 'csv'}
          onPress={handleExportCsv}
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
          onPress={handleDelete}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.action,
            { borderColor: palette.danger, backgroundColor: palette.card, opacity: pressed ? 0.85 : 1 },
          ]}>
          <ThemedText style={[styles.actionText, { color: palette.danger }]}>
            {t('person.delete')}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 24, gap: 16, paddingBottom: 48 },
  action: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: { fontSize: 16, fontWeight: '600' },
  actionSub: { fontSize: 12, marginTop: 2 },
});
