import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, PERSON_COLORS, type PersonColorKey } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  value: PersonColorKey;
  onChange: (key: PersonColorKey) => void;
};

/** A row of tappable colour swatches over the shared `PERSON_COLORS` palette. */
export function ColorPicker({ value, onChange }: Props) {
  const scheme = useColorScheme();
  const palette = Colors[scheme];

  return (
    <View style={styles.row}>
      {PERSON_COLORS.map((c) => {
        const selected = c.key === value;
        return (
          <Pressable
            key={c.key}
            onPress={() => onChange(c.key)}
            accessibilityRole="button"
            accessibilityLabel={c.key}
            accessibilityState={{ selected }}
            style={[
              styles.swatch,
              {
                backgroundColor: c[scheme],
                borderColor: selected ? palette.text : 'transparent',
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
  },
});
