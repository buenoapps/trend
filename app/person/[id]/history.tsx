import { useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PersonNotFound } from '@/components/person-not-found';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WeightEntryForm } from '@/components/weight-entry-form';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addDays, compareKey, formatLong, todayKey } from '@/lib/dates';
import { useActiveDate, useEntriesForPerson, usePersons, useSettings } from '@/lib/hooks';
import { useLocale, useT } from '@/lib/i18n';
import { formatWeight } from '@/lib/units';

export default function PersonHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const palette = Colors[useColorScheme()];
  const t = useT();
  const locale = useLocale();
  const { persons, loaded } = usePersons();
  const person = persons.find((p) => p.id === id);
  const { entries, upsert } = useEntriesForPerson(id);
  const { settings } = useSettings();
  const [activeDate, setActiveDate] = useActiveDate();

  const isToday = activeDate === todayKey();
  const isYesterday = activeDate === addDays(todayKey(), -1);
  const dateLabel = isToday
    ? t('today.todayLabel')
    : isYesterday
      ? t('today.yesterdayLabel')
      : formatLong(activeDate, locale);

  const activeEntry = entries.find((e) => e.date === activeDate);
  const previousEntry = [...entries].reverse().find((e) => compareKey(e.date, activeDate) < 0);

  let delta: string | null = null;
  if (activeEntry && previousEntry) {
    const diff = activeEntry.kg - previousEntry.kg;
    if (Math.abs(diff) >= 0.05) {
      delta = t(diff > 0 ? 'today.deltaUp' : 'today.deltaDown', {
        weight: formatWeight(Math.abs(diff), settings.unit),
        date: formatLong(previousEntry.date, locale),
      });
    } else {
      delta = t('today.deltaSteady');
    }
  }

  const goBack = () => setActiveDate(addDays(activeDate, -1));
  const goForward = () => {
    if (isToday) return;
    const next = addDays(activeDate, 1);
    setActiveDate(compareKey(next, todayKey()) > 0 ? todayKey() : next);
  };

  if (loaded && !person) return <PersonNotFound />;
  if (!person) return <View style={[styles.flex, { backgroundColor: palette.background }]} />;

  const newestFirst = [...entries].reverse();

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.dateRow}>
            <Pressable
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel={t('today.previousDay')}
              hitSlop={12}
              style={({ pressed }) => [
                styles.dateButton,
                { backgroundColor: palette.cardSoft, borderColor: palette.border, opacity: pressed ? 0.7 : 1 },
              ]}>
              <IconSymbol name="chevron.left" size={18} color={palette.text} />
            </Pressable>
            <ThemedText type="title" style={styles.date}>
              {dateLabel}
            </ThemedText>
            <Pressable
              onPress={goForward}
              disabled={isToday}
              accessibilityRole="button"
              accessibilityLabel={t('today.nextDay')}
              accessibilityState={{ disabled: isToday }}
              hitSlop={12}
              style={({ pressed }) => [
                styles.dateButton,
                {
                  backgroundColor: palette.cardSoft,
                  borderColor: palette.border,
                  opacity: isToday ? 0.3 : pressed ? 0.7 : 1,
                },
              ]}>
              <IconSymbol name="chevron.right" size={18} color={palette.text} />
            </Pressable>
          </View>

          <WeightEntryForm
            date={activeDate}
            unit={settings.unit}
            initialKg={activeEntry?.kg}
            onSave={async (draft) => {
              await upsert({ ...draft, personId: id });
            }}
          />

          {delta ? (
            <View
              style={[styles.deltaCard, { backgroundColor: palette.cardSoft, borderColor: palette.border }]}>
              <ThemedText style={{ color: palette.muted }}>{delta}</ThemedText>
            </View>
          ) : null}

          {newestFirst.length > 0 ? (
            <View style={styles.list}>
              {newestFirst.map((e) => {
                const selected = e.date === activeDate;
                return (
                  <Pressable
                    key={e.date}
                    onPress={() => setActiveDate(e.date)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.entryRow,
                      {
                        backgroundColor: selected ? palette.cardSoft : palette.card,
                        borderColor: palette.border,
                      },
                    ]}>
                    <ThemedText style={styles.entryDate}>{formatLong(e.date, locale)}</ThemedText>
                    <ThemedText style={[styles.entryWeight, { color: palette.muted }]}>
                      {formatWeight(e.kg, settings.unit)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48, gap: 12 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: { textAlign: 'center', flex: 1 },
  deltaCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  list: { gap: 8, marginTop: 12 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  entryDate: { fontSize: 15 },
  entryWeight: { fontSize: 15, fontWeight: '600' },
});
