import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/lib/i18n';

type Props = {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (hhmm: string) => void;
};

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

function hhmmToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

function dateToHHmm(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function TimePickerRow({ label, value, disabled, onChange }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const t = useT();
  const [showPicker, setShowPicker] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.row, { borderColor: palette.border, backgroundColor: palette.card }]}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        {React.createElement('input', {
          type: 'time',
          value,
          disabled,
          onChange: (e: { target: { value: string } }) => onChange(e.target.value),
          style: {
            fontSize: 16,
            padding: 8,
            borderRadius: 8,
            border: `1px solid ${palette.border}`,
            background: palette.cardSoft,
            color: palette.text,
            opacity: disabled ? 0.5 : 1,
          },
        })}
      </View>
    );
  }

  const handleNativeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && date) onChange(dateToHHmm(date));
  };

  return (
    <View style={[styles.row, { borderColor: palette.border, backgroundColor: palette.card }]}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={hhmmToDate(value)}
          mode="time"
          disabled={disabled}
          onChange={handleNativeChange}
          display="compact"
          accentColor={palette.leaf}
        />
      ) : (
        <>
          <Pressable
            onPress={() => !disabled && setShowPicker(true)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={t('timePicker.changeLabel', { label: label.toLowerCase() })}
            style={[styles.androidValue, { borderColor: palette.border, opacity: disabled ? 0.5 : 1 }]}>
            <ThemedText style={styles.valueText}>{value}</ThemedText>
          </Pressable>
          {showPicker ? (
            <DateTimePicker
              value={hhmmToDate(value)}
              mode="time"
              is24Hour
              onChange={handleNativeChange}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: { fontSize: 16 },
  androidValue: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  valueText: { fontSize: 16, fontWeight: '600' },
});
