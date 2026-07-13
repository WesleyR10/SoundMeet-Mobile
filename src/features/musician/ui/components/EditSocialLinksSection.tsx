import { View, Text, StyleSheet } from 'react-native';
import { Controller, type Control } from 'react-hook-form';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { FormField } from '@/shared/components/FormField';
import type { EditProfileFormValues } from '../../domain/musician.validation';

type Props = {
  control: Control<EditProfileFormValues>;
};

export function EditSocialLinksSection({ control }: Props) {
  return (
    <View style={s.root}>
      <Text style={s.label}>Links sociais</Text>

      <Controller
        control={control}
        name="instagram"
        render={({ field, fieldState }) => (
          <FormField
            label="Instagram"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="@seu.instagram"
            autoCapitalize="none"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="youtube"
        render={({ field, fieldState }) => (
          <FormField
            label="YouTube"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="youtube.com/@canal"
            autoCapitalize="none"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="spotify"
        render={({ field, fieldState }) => (
          <FormField
            label="Spotify"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="open.spotify.com/artist/..."
            autoCapitalize="none"
            error={fieldState.error?.message}
          />
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.6,
    color:          'rgba(255,255,255,0.55)',
    textTransform:  'uppercase',
  },
});
