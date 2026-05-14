import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PersonNotFound } from '@/components/person-not-found';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatLong } from '@/lib/dates';
import { useEntriesForPerson, usePersons, useSettings } from '@/lib/hooks';
import { useLocale, useT } from '@/lib/i18n';
import { formatWeight } from '@/lib/units';

export default function PersonHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const palette = Colors[useColorScheme()];
  const t = useT();
  const locale = useLocale();
  const { persons, loaded } = usePersons();
  const person = persons.find((p) => p.id === id);
  const { entries } = useEntriesForPerson(id);
  const { settings } = useSettings();

  if (loaded && !person) return <PersonNotFound />;
  if (!person) return <View style={[styles.flex, { backgroundColor: palette.background }]} />;

  // The full record, newest entry first.
  const newestFirst = [...entries].reverse();

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {newestFirst.length === 0 ? (
          <ThemedText style={[styles.empty, { color: palette.muted }]}>
            {t('person.historyEmpty')}
          </ThemedText>
        ) : (
          newestFirst.map((e) => (
            <View
              key={e.date}
              style={[styles.row, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <ThemedText style={styles.date}>{formatLong(e.date, locale)}</ThemedText>
              <ThemedText style={[styles.weight, { color: palette.muted }]}>
                {formatWeight(e.kg, settings.unit)}
              </ThemedText>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 24, gap: 8, paddingBottom: 48 },
  empty: { textAlign: 'center', fontSize: 14, paddingVertical: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  date: { fontSize: 15 },
  weight: { fontSize: 15, fontWeight: '600' },
});
