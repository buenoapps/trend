import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WeightEntryForm } from '@/components/weight-entry-form';
import { Colors, personColor } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { compareKey, formatLong, todayKey } from '@/lib/dates';
import { useLocale, useT } from '@/lib/i18n';
import type { DraftEntry, Person, Unit, WeightEntry } from '@/lib/types';
import { formatWeight } from '@/lib/units';

type Props = {
  person: Person;
  /** This person's entries (already filtered). */
  entries: WeightEntry[];
  unit: Unit;
  /** Receives an owner-less `{ date, kg }`; the screen stamps the personId. */
  onSave: (draft: DraftEntry) => void | Promise<void>;
};

/**
 * A start-screen card for one family member. The header (colour dot + name +
 * chevron) navigates to the person's detail screen; the embedded
 * `WeightEntryForm` logs today's weight inline without navigating. Honours
 * `person.cardDisplay` for `big` vs `small`; `hidden` cards are filtered out
 * by the start screen before this renders.
 */
export function PersonCard({ person, entries, unit, onSave }: Props) {
  const scheme = useColorScheme();
  const palette = Colors[scheme];
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const accent = personColor(person.colorKey, scheme);
  const today = todayKey();
  const isBig = person.cardDisplay === 'big';

  const todayEntry = useMemo(() => entries.find((e) => e.date === today), [entries, today]);
  const previousEntry = useMemo(
    () => [...entries].reverse().find((e) => compareKey(e.date, today) < 0),
    [entries, today],
  );

  let delta: string | null = null;
  if (isBig && todayEntry && previousEntry) {
    const diff = todayEntry.kg - previousEntry.kg;
    if (Math.abs(diff) >= 0.05) {
      delta = t(diff > 0 ? 'today.deltaUp' : 'today.deltaDown', {
        weight: formatWeight(Math.abs(diff), unit),
        date: formatLong(previousEntry.date, locale),
      });
    } else {
      delta = t('today.deltaSteady');
    }
  }

  return (
    <View
      style={[
        styles.card,
        isBig ? styles.cardBig : styles.cardSmall,
        { backgroundColor: palette.card, borderColor: palette.border },
      ]}>
      <Pressable
        onPress={() => router.push({ pathname: '/person/[id]', params: { id: person.id } })}
        accessibilityRole="button"
        accessibilityLabel={person.name}
        style={styles.header}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <ThemedText type={isBig ? 'title' : 'subtitle'} style={styles.name} numberOfLines={1}>
          {person.name}
        </ThemedText>
        <IconSymbol name="chevron.right" size={20} color={palette.muted} />
      </Pressable>

      <WeightEntryForm date={today} unit={unit} initialKg={todayEntry?.kg} onSave={onSave} />

      {delta ? (
        <ThemedText style={[styles.delta, { color: palette.muted }]}>{delta}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
  },
  cardBig: { padding: 20, gap: 14 },
  cardSmall: { padding: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  name: { flex: 1 },
  delta: { fontSize: 13 },
});
