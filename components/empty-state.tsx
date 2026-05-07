import { StyleSheet, View } from 'react-native';

import { SproutMascot } from '@/components/sprout-mascot';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/lib/i18n';

type Props = {
  title?: string;
  subtitle?: string;
};

export function EmptyState({ title, subtitle }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const t = useT();
  const resolvedTitle = title ?? t('emptyState.title');
  const resolvedSubtitle = subtitle ?? t('emptyState.subtitle');
  return (
    <View style={styles.container}>
      <SproutMascot size={110} />
      <ThemedText type="subtitle" style={styles.title}>
        {resolvedTitle}
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: palette.muted }]}>{resolvedSubtitle}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, paddingVertical: 32, paddingHorizontal: 24 },
  title: { textAlign: 'center', marginTop: 8 },
  subtitle: { textAlign: 'center', fontSize: 14 },
});
