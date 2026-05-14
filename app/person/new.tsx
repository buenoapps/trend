import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonForm } from '@/components/person-form';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePersons } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { newId } from '@/lib/ids';

export default function NewPersonScreen() {
  const palette = Colors[useColorScheme()];
  const t = useT();
  const router = useRouter();
  const { upsert } = usePersons();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: palette.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PersonForm
          submitLabel={t('personForm.create')}
          onSubmit={async (draft) => {
            await upsert({ id: newId(), createdAt: Date.now(), ...draft });
            router.back();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 24, gap: 16, paddingBottom: 48 },
});
