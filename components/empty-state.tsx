import { StyleSheet, View } from 'react-native';

import { SproutMascot } from '@/components/sprout-mascot';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  title?: string;
  subtitle?: string;
};

export function EmptyState({
  title = 'Plant your first data point',
  subtitle = 'Log a weight on the Today tab and your trend will start here.',
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  return (
    <View style={styles.container}>
      <SproutMascot size={110} />
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: palette.muted }]}>{subtitle}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, paddingVertical: 32, paddingHorizontal: 24 },
  title: { textAlign: 'center', marginTop: 8 },
  subtitle: { textAlign: 'center', fontSize: 14 },
});
