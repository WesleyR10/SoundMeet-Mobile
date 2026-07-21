import { View, StyleSheet } from 'react-native';
import { Controller, type Control } from 'react-hook-form';
import { spacing } from '@/shared/design-system/tokens';
import { FormField } from '@/shared/components/FormField';
import type { LoginFormValues } from '@/features/auth/domain/auth.validation';

type Props = {
  control: Control<LoginFormValues>;
};

export function LoginFormFields({ control }: Props) {
  return (
    <View style={s.form}>
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <FormField
            label="E-mail"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="seuemail@email.com"
            keyboardType="email-address"
            autoComplete="email"
            importantForAutofill="no"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <FormField
            label="Senha"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="••••••••"
            secureTextEntry
            showToggle
            autoComplete="password"
            error={fieldState.error?.message}
          />
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  form: {
    gap:       spacing.lg,
    marginTop: spacing.lg,
  },
});
