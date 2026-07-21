import { View, StyleSheet } from 'react-native';
import { Controller, type Control } from 'react-hook-form';
import { spacing } from '@/shared/design-system/tokens';
import { FormField } from '@/shared/components/FormField';
import { formatCpf } from '@/shared/utils/cpf';
import { formatPhoneBr } from '@/shared/utils/phone';
import { PasswordStrengthHint } from './PasswordStrengthHint';
import type { RegisterRole } from '@/features/auth/domain/auth.types';
import type { RegisterFormValues } from '@/features/auth/domain/auth.validation';

type Props = {
  control: Control<RegisterFormValues>;
  role:    RegisterRole;
};

export function RegisterFormFields({ control, role }: Props) {
  return (
    <View style={s.form}>
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <FormField
            label="Nome"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="Como podemos te chamar?"
            autoCapitalize="words"
            autoComplete="name"
            error={fieldState.error?.message}
          />
        )}
      />
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

      {role === 'musician' && (
        <>
          <Controller
            control={control}
            name="cpf"
            render={({ field, fieldState }) => (
              <FormField
                label="CPF"
                value={field.value}
                onChangeText={(v) => field.onChange(formatCpf(v))}
                onBlur={field.onBlur}
                placeholder="000.000.000-00"
                keyboardType="number-pad"
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field, fieldState }) => (
              <FormField
                label="Celular"
                value={field.value}
                onChangeText={(v) => field.onChange(formatPhoneBr(v))}
                onBlur={field.onBlur}
                placeholder="(00) 00000-0000"
                keyboardType="number-pad"
                autoComplete="tel"
                error={fieldState.error?.message}
              />
            )}
          />
        </>
      )}

      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <View style={s.passwordGroup}>
            <FormField
              label="Senha"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="••••••••"
              secureTextEntry
              showToggle
              autoComplete="password-new"
              error={fieldState.error?.message}
            />
            <PasswordStrengthHint password={field.value} />
          </View>
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
  passwordGroup: {
    gap: spacing.sm,
  },
});
