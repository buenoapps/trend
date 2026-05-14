import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { PersonCard } from '@/components/person-card';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEntries, usePersons, useSettings } from '@/lib/hooks';
import { useT } from '@/lib/i18n';

export default function HomeScreen() {
  const palette = Colors[useColorScheme()];
  const t = useT();
  const router = useRouter();
  const { persons, loaded } = usePersons();
  const { entries, upsert } = useEntries();
  const { settings } = useSettings();

  const visible = persons.filter((p) => p.cardDisplay !== 'hidden');
  const isEmpty = loaded && persons.length === 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <ThemedText type="title">{t('home.title')}</ThemedText>
            <Pressable
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel={t('home.settingsA11y')}
              hitSlop={8}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: palette.cardSoft, borderColor: palette.border, opacity: pressed ? 0.7 : 1 },
              ]}>
              <IconSymbol name="gearshape.fill" size={20} color={palette.text} />
            </Pressable>
          </View>

          {isEmpty ? (
            <View style={styles.emptyWrap}>
              <EmptyState title={t('home.emptyTitle')} subtitle={t('home.emptySubtitle')} />
              <Pressable
                onPress={() => router.push('/person/new')}
                accessibilityRole="button"
                accessibilityLabel={t('home.addMember')}
                style={({ pressed }) => [
                  styles.addTile,
                  { borderColor: palette.border, opacity: pressed ? 0.7 : 1 },
                ]}>
                <IconSymbol name="plus" size={20} color={palette.muted} />
                <ThemedText style={{ color: palette.muted }}>{t('home.addMember')}</ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.list}>
              {visible.map((p) => (
                <PersonCard
                  key={p.id}
                  person={p}
                  entries={entries.filter((e) => e.personId === p.id)}
                  unit={settings.unit}
                  onSave={async (draft) => {
                    await upsert({ ...draft, personId: p.id });
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: { gap: 16 },
  list: { gap: 16 },
  addTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
