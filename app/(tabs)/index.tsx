import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SproutMascot } from '@/components/sprout-mascot';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WeightEntryForm } from '@/components/weight-entry-form';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addDays, compareKey, formatLong, todayKey } from '@/lib/dates';
import { useActiveDate, useEntries, useSettings } from '@/lib/hooks';
import { formatWeight } from '@/lib/units';

export default function TodayScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { entries, upsert } = useEntries();
  const { settings } = useSettings();

  const [activeDate, setActiveDate] = useActiveDate();
  const isToday = activeDate === todayKey();

  const activeEntry = entries.find((e) => e.date === activeDate);
  const previousEntry = [...entries].reverse().find((e) => compareKey(e.date, activeDate) < 0);

  const greeting = activeEntry
    ? isToday
      ? "Today's weight"
      : "That day's weight"
    : isToday
      ? 'How are you today?'
      : 'No entry for this day';
  const subtitle = activeEntry
    ? formatWeight(activeEntry.kg, settings.unit)
    : isToday
      ? 'Log a weight to keep your trend going.'
      : 'Tap below to add one for this day.';

  let delta: string | null = null;
  if (activeEntry && previousEntry) {
    const diff = activeEntry.kg - previousEntry.kg;
    if (Math.abs(diff) >= 0.05) {
      const arrow = diff > 0 ? '▲' : '▼';
      delta = `${arrow} ${formatWeight(Math.abs(diff), settings.unit)} since ${previousEntry.date}`;
    } else {
      delta = 'Steady from the previous entry.';
    }
  }

  const goBack = () => setActiveDate(addDays(activeDate, -1));
  const goForward = () => {
    if (isToday) return;
    const next = addDays(activeDate, 1);
    setActiveDate(compareKey(next, todayKey()) > 0 ? todayKey() : next);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.mascotWrap}>
            <SproutMascot size={150} mood={activeEntry ? 'happy' : 'idle'} />
          </View>

          <View style={styles.dateRow}>
            <Pressable
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel="Previous day"
              hitSlop={12}
              style={({ pressed }) => [
                styles.dateButton,
                { backgroundColor: palette.cardSoft, borderColor: palette.border, opacity: pressed ? 0.7 : 1 },
              ]}>
              <IconSymbol name="chevron.right" size={18} color={palette.text} style={styles.flip} />
            </Pressable>
            <ThemedText style={styles.date}>{formatLong(activeDate)}</ThemedText>
            <Pressable
              onPress={goForward}
              disabled={isToday}
              accessibilityRole="button"
              accessibilityLabel="Next day"
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

          <ThemedText type="title" style={styles.greeting}>
            {greeting}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: palette.muted }]}>{subtitle}</ThemedText>

          <View style={styles.formWrap}>
            <WeightEntryForm
              date={activeDate}
              unit={settings.unit}
              initialKg={activeEntry?.kg}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 8,
  },
  mascotWrap: { alignItems: 'center', marginBottom: 8 },
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
  flip: { transform: [{ scaleX: -1 }] },
  date: { fontSize: 14, opacity: 0.8, textAlign: 'center', flex: 1 },
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
