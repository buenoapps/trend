import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ColorPicker } from '@/components/color-picker';
import { ThemedText } from '@/components/themed-text';
import { Colors, PERSON_COLORS, type PersonColorKey } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/lib/i18n';
import type { CardDisplay, Goal, PersonKind } from '@/lib/types';

/** The editable subset of a `Person` — what the form collects. */
export type PersonDraft = {
  name: string;
  colorKey: PersonColorKey;
  kind: PersonKind;
  goal: Goal;
  cardDisplay: CardDisplay;
};

type Props = {
  initial?: Partial<PersonDraft>;
  submitLabel: string;
  onSubmit: (draft: PersonDraft) => void | Promise<void>;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const palette = Colors[useColorScheme()];
  return (
    <View style={styles.field}>
      <ThemedText type="subtitle" style={[styles.fieldLabel, { color: palette.muted }]}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

function OptionList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const palette = Colors[useColorScheme()];
  return (
    <View style={styles.optionList}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.optionItem,
              { borderColor: palette.border, backgroundColor: active ? palette.leaf : palette.card },
            ]}>
            <ThemedText style={[styles.optionText, { color: active ? '#FFFFFF' : palette.text }]}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PersonForm({ initial, submitLabel, onSubmit }: Props) {
  const t = useT();
  const palette = Colors[useColorScheme()];
  const [name, setName] = useState(initial?.name ?? '');
  const [colorKey, setColorKey] = useState<PersonColorKey>(
    initial?.colorKey ?? PERSON_COLORS[0].key,
  );
  const [kind, setKind] = useState<PersonKind>(initial?.kind ?? 'adult');
  const [goal, setGoal] = useState<Goal>(initial?.goal ?? 'none');
  const [cardDisplay, setCardDisplay] = useState<CardDisplay>(initial?.cardDisplay ?? 'big');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('personForm.nameRequired'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      // A kid never carries a goal — collapse it on the way out.
      await onSubmit({ name: trimmed, colorKey, kind, goal: kind === 'kid' ? 'none' : goal, cardDisplay });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Field label={t('personForm.nameLabel')}>
        <TextInput
          style={[
            styles.input,
            {
              color: palette.text,
              backgroundColor: palette.card,
              borderColor: error ? palette.danger : palette.border,
            },
          ]}
          value={name}
          onChangeText={(v) => {
            setName(v);
            setError(null);
          }}
          placeholder={t('personForm.namePlaceholder')}
          placeholderTextColor={palette.muted}
          accessibilityLabel={t('personForm.nameLabel')}
        />
        {error ? (
          <ThemedText style={[styles.error, { color: palette.danger }]}>{error}</ThemedText>
        ) : null}
      </Field>

      <Field label={t('personForm.colorLabel')}>
        <ColorPicker value={colorKey} onChange={setColorKey} />
      </Field>

      <Field label={t('personForm.kindLabel')}>
        <OptionList
          options={[
            { value: 'adult', label: t('personForm.kindAdult') },
            { value: 'kid', label: t('personForm.kindKid') },
          ]}
          value={kind}
          onChange={setKind}
        />
      </Field>

      {kind === 'adult' ? (
        <Field label={t('personForm.goalLabel')}>
          <OptionList
            options={[
              { value: 'none', label: t('personForm.goalNone') },
              { value: 'lose', label: t('personForm.goalLose') },
              { value: 'gain', label: t('personForm.goalGain') },
            ]}
            value={goal}
            onChange={setGoal}
          />
        </Field>
      ) : null}

      <Field label={t('personForm.cardLabel')}>
        <OptionList
          options={[
            { value: 'big', label: t('personForm.cardBig') },
            { value: 'small', label: t('personForm.cardSmall') },
            { value: 'hidden', label: t('personForm.cardHidden') },
          ]}
          value={cardDisplay}
          onChange={setCardDisplay}
        />
      </Field>

      <Pressable
        onPress={handleSubmit}
        disabled={busy}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.submit,
          { backgroundColor: palette.leaf, opacity: pressed || busy ? 0.85 : 1 },
        ]}>
        <ThemedText style={styles.submitText} lightColor="#FFFFFF" darkColor="#10140F">
          {submitLabel}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  error: { fontSize: 13 },
  optionList: { gap: 8 },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: { fontSize: 16, fontWeight: '600' },
  submit: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: { fontSize: 17, fontWeight: '700' },
});
