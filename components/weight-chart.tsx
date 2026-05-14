import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatShort } from '@/lib/dates';
import { useLocale } from '@/lib/i18n';
import type { DraftEntry, Unit } from '@/lib/types';
import { formatWeight, kgToLb } from '@/lib/units';

type Props = {
  entries: DraftEntry[];
  unit: Unit;
  width: number;
};

export function WeightChart({ entries, unit, width }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const locale = useLocale();

  const data = useMemo(() => {
    const stride = Math.max(1, Math.ceil(entries.length / 6));
    return entries.map((e, i) => ({
      value: unit === 'kg' ? e.kg : kgToLb(e.kg),
      label: i % stride === 0 ? formatShort(e.date, locale) : undefined,
      dataPointText: i === entries.length - 1 ? formatWeight(e.kg, unit, { withUnit: false }) : undefined,
    }));
  }, [entries, unit, locale]);

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.5, max - min);
  const yMin = Math.floor(min - span * 0.2);
  const yMax = Math.ceil(max + span * 0.2);

  if (entries.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <LineChart
        data={data}
        width={width - 24}
        height={220}
        curved
        areaChart
        thickness={3}
        color={palette.chartLine}
        startFillColor={palette.chartLine}
        endFillColor={palette.chartLine}
        startOpacity={0.35}
        endOpacity={0.04}
        dataPointsColor={palette.leaf}
        dataPointsRadius={4}
        textColor={palette.text}
        textFontSize={12}
        textShiftY={-8}
        textShiftX={-6}
        yAxisColor={palette.border}
        xAxisColor={palette.border}
        yAxisTextStyle={{ color: palette.muted, fontSize: 11 }}
        xAxisLabelTextStyle={{ color: palette.muted, fontSize: 11 }}
        rulesColor={palette.border}
        rulesType="solid"
        noOfSections={4}
        yAxisOffset={yMin}
        maxValue={yMax - yMin}
        initialSpacing={12}
        endSpacing={12}
        adjustToWidth
        hideRules={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 8 },
});
