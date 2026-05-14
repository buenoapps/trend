import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { PersonNotFound } from '@/components/person-not-found';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WeightChart } from '@/components/weight-chart';
import { WeightEntryForm } from '@/components/weight-entry-form';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addDays, compareKey, daysAgoKey, formatLong, todayKey } from '@/lib/dates';
import { useActiveDate, useEntriesForPerson, usePersons, useSettings } from '@/lib/hooks';
import { useLocale, useT, type TranslationKey } from '@/lib/i18n';
import { formatWeight } from '@/lib/units';

type Range = '7' | '30' | 'all';

const RANGES = [
  { key: '7', labelKey: 'history.range7', days: 7 },
  { key: '30', labelKey: 'history.range30', days: 30 },
  { key: 'all', labelKey: 'history.rangeAll', days: null },
] as const satisfies readonly { key: Range; labelKey: TranslationKey; days: number | null }[];

export default function PersonChartScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const palette = Colors[useColorScheme()];
  const t = useT();
  const locale = useLocale();
  const { persons, loaded } = usePersons();
  const person = persons.find((p) => p.id === id);
  const { entries, upsert } = useEntriesForPerson(id);
  const { settings } = useSettings();
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<Range>('30');
  const [activeDate, setActiveDate] = useActiveDate();

  // --- Day stepper + inline entry ---
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

  // --- Chart window ---
  const filtered = useMemo(() => {
    const cfg = RANGES.find((r) => r.key === range)!;
    if (cfg.days == null) return entries;
    const cutoff = daysAgoKey(cfg.days - 1);
    return entries.filter((e) => compareKey(e.date, cutoff) >= 0);
  }, [entries, range]);

  const stats = useMemo(() => {
    if (filtered.length < 2) return null;
    const first = filtered[0];
    const last = filtered[filtered.length - 1];
    const diff = last.kg - first.kg;
    const min = filtered.reduce((acc, e) => (e.kg < acc.kg ? e : acc), filtered[0]);
    const max = filtered.reduce((acc, e) => (e.kg > acc.kg ? e : acc), filtered[0]);
    return { diff, min, max };
  }, [filtered]);

  if (loaded && !person) return <PersonNotFound />;
  if (!person) return <View style={[styles.flex, { backgroundColor: palette.background }]} />;

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

          <ThemedText style={[styles.subtitle, { color: palette.muted }]}>
            {t('history.entriesInWindow', { count: filtered.length })}
          </ThemedText>

          <View style={[styles.toggle, { backgroundColor: palette.cardSoft, borderColor: palette.border }]}>
            {RANGES.map((r) => {
              const active = r.key === range;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setRange(r.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.toggleItem, active && { backgroundColor: palette.leaf }]}>
                  <ThemedText style={[styles.toggleText, { color: active ? '#FFFFFF' : palette.text }]}>
                    {t(r.labelKey)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.chartWrap}>
            {filtered.length === 0 ? (
              <ThemedText style={{ color: palette.muted, textAlign: 'center', padding: 24 }}>
                {t('history.empty')}
              </ThemedText>
            ) : (
              <WeightChart entries={filtered} unit={settings.unit} width={width - 48} />
            )}
          </View>

          {stats ? (
            <View style={styles.statsRow}>
              <StatCard
                label={t('history.statChange')}
                value={`${stats.diff > 0 ? '+' : stats.diff < 0 ? '-' : ''}${formatWeight(Math.abs(stats.diff), settings.unit)}`}
                palette={palette}
              />
              <StatCard label={t('history.statLow')} value={formatWeight(stats.min.kg, settings.unit)} palette={palette} />
              <StatCard label={t('history.statHigh')} value={formatWeight(stats.max.kg, settings.unit)} palette={palette} />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function StatCard({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: typeof Colors.light;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <ThemedText style={[styles.statLabel, { color: palette.muted }]}>{label}</ThemedText>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
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
    marginBottom: 4,
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
  subtitle: { fontSize: 14, marginTop: 8 },
  toggle: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  toggleItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleText: { fontSize: 14, fontWeight: '600' },
  chartWrap: { marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  stat: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statLabel: { fontSize: 12, marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '700' },
});
