import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/lib/i18n';

/** Shown when a `person/[id]` route resolves to an unknown or deleted id. */
export function PersonNotFound() {
  const palette = Colors[useColorScheme()];
  const t = useT();
  const router = useRouter();
  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ThemedText type="subtitle" style={styles.title}>
        {t('person.notFoundTitle')}
      </ThemedText>
      <ThemedText style={[styles.body, { color: palette.muted }]}>
        {t('person.notFoundBody')}
      </ThemedText>
      <Pressable
        onPress={() => router.replace('/')}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: palette.leaf, opacity: pressed ? 0.85 : 1 },
        ]}>
        <ThemedText style={styles.buttonText} lightColor="#FFFFFF" darkColor="#10140F">
          {t('home.title')}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', fontSize: 14 },
  button: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
