import { View, Text, StyleSheet } from 'react-native';
import { Controller, type Control } from 'react-hook-form';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { FormField } from '@/shared/components/FormField';
import { AvatarPicker } from '@/shared/components/AvatarPicker';
import { STAGE_NAME_SOFT_MAX, BIO_SOFT_MAX, type EditProfileFormValues } from '../../domain/musician.validation';

type Props = {
  control:            Control<EditProfileFormValues>;
  avatarUri:          string | null;
  onChangeAvatarUri:  (uri: string) => void;
};

export function EditIdentitySection({ control, avatarUri, onChangeAvatarUri }: Props) {
  return (
    <View style={s.root}>
      <AvatarPicker uri={avatarUri} onChange={onChangeAvatarUri} />

      <Controller
        control={control}
        name="stageName"
        render={({ field, fieldState }) => (
          <View style={s.field}>
            <FormField
              label="Nome artístico"
              value={field.value}
              onChangeText={(v) => field.onChange(v.slice(0, STAGE_NAME_SOFT_MAX))}
              onBlur={field.onBlur}
              placeholder="Ex.: Lua Cordeiro"
              autoCapitalize="words"
              error={fieldState.error?.message}
            />
            <Text style={s.counter}>{field.value.length}/{STAGE_NAME_SOFT_MAX}</Text>
          </View>
        )}
      />

      <Controller
        control={control}
        name="bio"
        render={({ field, fieldState }) => (
          <View style={s.field}>
            <FormField
              label="Bio / descrição"
              value={field.value ?? ''}
              onChangeText={(v) => field.onChange(v.slice(0, BIO_SOFT_MAX))}
              onBlur={field.onBlur}
              placeholder="Conte sua história, seu estilo, o que você toca ao vivo..."
              autoCapitalize="sentences"
              multiline
              error={fieldState.error?.message}
            />
            <Text style={s.counter}>{(field.value ?? '').length}/{BIO_SOFT_MAX}</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  counter: {
    ...typography.caption,
    color:     colors.text.muted,
    textAlign: 'right',
  },
});
