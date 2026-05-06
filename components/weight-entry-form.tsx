import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { todayKey } from '@/lib/dates';
import { parseWeightInput, reasonToMessage } from '@/lib/units';
import type { Unit, WeightEntry } from '@/lib/types';

type Props = {
  unit: Unit;
  initialKg?: number;
  onSave: (entry: WeightEntry) => void | Promise<void>;
};

export function WeightEntryForm({ unit, initialKg, onSave }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const handleSave = async () => {
    const result = parseWeightInput(text, unit);
    if (!result.ok) {
      setError(reasonToMessage(result.reason));
      return;
    }
    setError(null);
    await onSave({ date: todayKey(), kg: result.kg });
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
          onChangeText={(t) => {
            setText(t);
            setError(null);
            setSavedAt(null);
          }}
          placeholder={initialKg != null ? `Today: tap to update` : 'Your weight'}
          placeholderTextColor={palette.muted}
          keyboardType="decimal-pad"
          inputMode="decimal"
          returnKeyType="done"
          onSubmitEditing={handleSave}
          accessibilityLabel="Weight input"
        />
        <ThemedText style={[styles.unit, { color: palette.muted }]}>{unit}</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save today's weight"
          onPress={handleSave}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: palette.leaf, opacity: pressed ? 0.85 : 1 },
          ]}>
          <ThemedText style={styles.buttonText} lightColor="#FFFFFF" darkColor="#10140F">
            Save
          </ThemedText>
        </Pressable>
      </View>
      {error ? (
        <ThemedText style={[styles.hint, { color: palette.danger }]}>{error}</ThemedText>
      ) : savedAt ? (
        <ThemedText style={[styles.hint, { color: palette.muted }]}>Saved — nice work.</ThemedText>
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
