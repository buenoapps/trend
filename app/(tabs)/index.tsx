import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SproutMascot } from '@/components/sprout-mascot';
import { ThemedText } from '@/components/themed-text';
import { WeightEntryForm } from '@/components/weight-entry-form';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatLong, todayKey } from '@/lib/dates';
import { useEntries, useSettings } from '@/lib/hooks';
import { formatWeight } from '@/lib/units';

export default function TodayScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { entries, upsert } = useEntries();
  const { settings } = useSettings();

  const today = todayKey();
  const todayEntry = entries.find((e) => e.date === today);
  const previousEntry = [...entries].reverse().find((e) => e.date < today);

  const greeting = todayEntry ? "Today's weight" : 'How are you today?';
  const subtitle = todayEntry
    ? formatWeight(todayEntry.kg, settings.unit)
    : 'Log a weight to keep your trend going.';

  let delta: string | null = null;
  if (todayEntry && previousEntry) {
    const diff = todayEntry.kg - previousEntry.kg;
    if (Math.abs(diff) >= 0.05) {
      const arrow = diff > 0 ? '▲' : '▼';
      delta = `${arrow} ${formatWeight(Math.abs(diff), settings.unit)} since ${previousEntry.date}`;
    } else {
      delta = 'Steady from your last entry.';
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.mascotWrap}>
          <SproutMascot size={150} mood={todayEntry ? 'happy' : 'idle'} />
        </View>

        <ThemedText style={styles.date}>{formatLong(today)}</ThemedText>
        <ThemedText type="title" style={styles.greeting}>
          {greeting}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: palette.muted }]}>{subtitle}</ThemedText>

        <View style={styles.formWrap}>
          <WeightEntryForm
            unit={settings.unit}
            initialKg={todayEntry?.kg}
            onSave={async (entry) => {
              await upsert(entry);
            }}
          />
        </View>

        {delta ? (
          <View
            style={[
              styles.deltaCard,
              { backgroundColor: palette.cardSoft, borderColor: palette.border },
            ]}>
            <ThemedText style={{ color: palette.muted }}>{delta}</ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 8,
  },
  mascotWrap: { alignItems: 'center', marginBottom: 8 },
  date: { fontSize: 13, opacity: 0.7, textAlign: 'center' },
  greeting: { textAlign: 'center', marginTop: 4 },
  subtitle: { textAlign: 'center', marginTop: 4, marginBottom: 24, fontSize: 16 },
  formWrap: { marginTop: 8 },
  deltaCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
});
