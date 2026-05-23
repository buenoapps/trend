import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { todayKey } from '@/lib/dates';
import { useT } from '@/lib/i18n';
import type { DateKey, DraftEntry, Unit } from '@/lib/types';
import { formatWeight, parseWeightInput, reasonToKey } from '@/lib/units';

type Props = {
  date: DateKey;
  unit: Unit;
  initialKg?: number;
  /** Receives an owner-less `{ date, kg }`; the caller stamps it with a personId. */
  onSave: (entry: DraftEntry) => void | Promise<void>;
};

function initialText(initialKg: number | undefined, unit: Unit): string {
  return initialKg != null ? formatWeight(initialKg, unit, { withUnit: false }) : '';
}

export function WeightEntryForm({ date, unit, initialKg, onSave }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const t = useT();
  const [text, setText] = useState(() => initialText(initialKg, unit));
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Reset local state when the form is being shown for a different entry —
  // documented React pattern for "store information from previous renders"
  // without a `useEffect` that calls `setState`.
  const [prevKey, setPrevKey] = useState({ date, initialKg, unit });
  if (
    prevKey.date !== date ||
    prevKey.initialKg !== initialKg ||
    prevKey.unit !== unit
  ) {
    setPrevKey({ date, initialKg, unit });
    setText(initialText(initialKg, unit));
    setError(null);
    setSavedAt(null);
  }

  const isToday = date === todayKey();
  const placeholder =
    initialKg != null
      ? isToday
        ? t('form.placeholderToday')
        : t('form.placeholderPast')
      : t('form.placeholderEmpty');

  const handleSave = async () => {
    const result = parseWeightInput(text, unit);
    if (!result.ok) {
      setError(t(reasonToKey(result.reason)));
      return;
    }
    setError(null);
    await onSave({ date, kg: result.kg });
    setText('');
    setSavedAt(Date.now());
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.row,
          { backgroundColor: palette.card, borderColor: error ? palette.danger : palette.border },
        ]}>
        <TextInput
          style={[styles.input, { color: palette.text }]}
          value={text}
          onChangeText={(next) => {
            setText(next);
            setError(null);
            setSavedAt(null);
          }}
          placeholder={placeholder}
          placeholderTextColor={palette.muted}
          keyboardType="decimal-pad"
          inputMode="decimal"
          returnKeyType="done"
          onSubmitEditing={handleSave}
          accessibilityLabel={t('form.a11yInput')}
        />
        <ThemedText style={[styles.unit, { color: palette.muted }]}>{unit}</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('form.a11ySave')}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: palette.leaf, opacity: pressed ? 0.85 : 1 },
          ]}>
          <ThemedText style={styles.buttonText} lightColor="#FFFFFF" darkColor="#10140F">
            {t('form.save')}
          </ThemedText>
        </Pressable>
      </View>
      {error ? (
        <ThemedText style={[styles.hint, { color: palette.danger }]}>{error}</ThemedText>
      ) : savedAt ? (
        <ThemedText style={[styles.hint, { color: palette.muted }]}>{t('form.saved')}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 22,
    paddingVertical: 12,
  },
  unit: {
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
  },
});
