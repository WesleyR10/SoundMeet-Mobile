import { useEffect, useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { radius, shadows, spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { FormField } from '@/shared/components/FormField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { loginSchema, type LoginFormValues } from '../../domain/auth.validation';

type Props = {
  loading:      boolean;
  errorMessage: string | null;
  /** Muda a cada recusa — dispara o tremor do cartão. */
  shakeSignal:  number;
  onSubmit:     (values: LoginFormValues) => void;
  /** Cada tecla, nos dois campos — é o que faz a logo "ouvir". */
  onKeystroke:  () => void;
  onForgotPassword: (typedEmail: string) => void;
};

const useStyles = makeStyles((colors) => ({
  card: {
    gap:             spacing.lg,
    padding:         spacing.xl,
    borderRadius:    radius.xl,
    backgroundColor: colors.bg.surface,
    borderWidth:     1,
    borderColor:     colors.border.default,
  },
  forgot: {
    alignSelf:       'flex-end',
    minHeight:       48,
    justifyContent:  'center',
    marginTop:       -spacing.sm,
    marginBottom:    -spacing.sm,
  },
  forgotText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.brand,
  },
}));

export function LoginForm({
  loading,
  errorMessage,
  shakeSignal,
  onSubmit,
  onKeystroke,
  onForgotPassword,
}: Props) {
  const s = useStyles();
  const reducedMotion = useReducedMotion();
  const passwordRef = useRef<TextInput>(null);
  const shake = useSharedValue(0);

  const { control, handleSubmit, getValues } = useForm<LoginFormValues>({
    resolver:      zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (shakeSignal === 0 || reducedMotion) return;
    shake.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 70 }),
      withTiming(-8, { duration: 60 }),
      withSpring(0, { damping: 5, stiffness: 240 }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shakeSignal]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const submit = handleSubmit(onSubmit);

  return (
    <Animated.View style={[s.card, shadows.lg, cardStyle]}>
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <FormField
            label="E-mail"
            value={field.value}
            onChangeText={(v) => {
              field.onChange(v);
              onKeystroke();
            }}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
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
            onChangeText={(v) => {
              field.onChange(v);
              onKeystroke();
            }}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            placeholder="Sua senha"
            secureTextEntry
            showToggle
            autoComplete="current-password"
            inputRef={passwordRef}
            returnKeyType="go"
            onSubmitEditing={submit}
          />
        )}
      />

      <Pressable
        onPress={() => onForgotPassword(getValues('email').trim())}
        style={s.forgot}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Esqueci a senha"
      >
        <Text style={s.forgotText}>Esqueci a senha</Text>
      </Pressable>

      {!!errorMessage && <ErrorBanner message={errorMessage} />}

      <PrimaryButton label="Entrar" onPress={submit} loading={loading} />
    </Animated.View>
  );
}
