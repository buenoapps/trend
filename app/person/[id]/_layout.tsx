import { Tabs, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePerson } from '@/lib/hooks';
import { useT } from '@/lib/i18n';

export default function PersonLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const palette = Colors[useColorScheme()];
  const person = usePerson(id);

  return (
    <Tabs
      screenOptions={{
        headerTitle: person?.name ?? '',
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
        headerShadowVisible: false,
        tabBarActiveTintColor: palette.tabIconSelected,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarStyle: { backgroundColor: palette.background, borderTopColor: palette.border },
        headerLeft: () => (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('person.backA11y')}
            hitSlop={12}
            style={styles.headerButton}>
            <IconSymbol name="chevron.left" size={24} color={palette.text} />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={() => router.push({ pathname: '/person/[id]/settings', params: { id } })}
            accessibilityRole="button"
            accessibilityLabel={t('person.settingsA11y')}
            hitSlop={12}
            style={styles.headerButton}>
            <IconSymbol name="gearshape.fill" size={20} color={palette.text} />
          </Pressable>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: t('person.tabChart'),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarLabel: t('person.tabHistory'),
          tabBarIcon: ({ color }) => <IconSymbol name="clock.fill" size={24} color={color} />,
        }}
      />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerButton: { paddingHorizontal: 12 },
});
