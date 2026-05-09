import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { WeightChart } from '@/components/weight-chart';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { compareKey, daysAgoKey } from '@/lib/dates';
import { useEntries, useSettings } from '@/lib/hooks';
import { useT, type TranslationKey } from '@/lib/i18n';
import { formatWeight } from '@/lib/units';

type Range = '7' | '30' | 'all';

const RANGES = [
  { key: '7', labelKey: 'history.range7', days: 7 },
  { key: '30', labelKey: 'history.range30', days: 30 },
  { key: 'all', labelKey: 'history.rangeAll', days: null },
] as const satisfies readonly { key: Range; labelKey: TranslationKey; days: number | null }[];

export default function HistoryScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const t = useT();
  const { entries, loaded } = useEntries();
  const { settings } = useSettings();
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<Range>('30');

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
    return { diff, min, max, first, last };
  }, [filtered]);

  if (loaded && entries.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
        <EmptyState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">{t('history.title')}</ThemedText>
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
                style={[
                  styles.toggleItem,
                  active && { backgroundColor: palette.leaf },
                ]}>
                <ThemedText
                  style={[
                    styles.toggleText,
                    { color: active ? '#FFFFFF' : palette.text },
                  ]}>
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
    </SafeAreaView>
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
  safe: { flex: 1 },
  content: { padding: 24, gap: 12 },
  subtitle: { fontSize: 14 },
  toggle: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginTop: 8,
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
