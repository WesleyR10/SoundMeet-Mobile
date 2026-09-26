import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { MailCheck } from 'lucide-react-native';
import { radius, spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { FormField } from '@/shared/components/FormField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { forgotPasswordSchema } from '../../domain/auth.validation';
import { getPasswordResetErrorMessage, usePasswordReset } from '../../application/usePasswordReset';
import { useSheetModalVisibility } from '@/shared/hooks/useSheetModalVisibility';

type Props = {
  visible:      boolean;
  initialEmail: string;
  onClose:      () => void;
};

/**
 * "Esqueci a senha" sem sair do app.
 *
 * Zod-only (`safeParse`), sem react-hook-form: um campo e o botão no próprio
 * sheet — mesmo critério do `CreateBandSheet`.
 *
 * O texto de confirmação é o que o backend devolve, e ele é o mesmo exista ou
 * não conta para o e-mail. A tela não pode "saber" mais do que isso.
 */
const useStyles = makeStyles((colors) => ({
  sheetBg: { backgroundColor: colors.bg.elevated },
  handle:  { backgroundColor: colors.border.strong, width: 44 },
  content: {
    padding:       spacing.xl,
    paddingBottom: spacing.xxl,
    gap:           spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  form: { gap: spacing.md },
  centered: { textAlign: 'center' },
  subtitle: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  sentIcon: {
    alignSelf:       'center',
    width:           72,
    height:          72,
    borderRadius:    radius.full,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: colors.brand.muted,
    marginBottom:    spacing.sm,
  },
  sentText: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
}));

export function ForgotPasswordSheet({ visible, initialEmail, onClose }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { sheetRef, trackDismiss } = useSheetModalVisibility(visible);
  const [email, setEmail] = useState(initialEmail);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const reset = usePasswordReset();

  // O e-mail inicial entra pelo `useState` — a tela remonta o sheet a cada
  // abertura (`key`), então não há o que sincronizar aqui.
  const handleDismiss = () => {
    setFieldError(undefined);
    reset.reset();
    onClose();
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  const handleSubmit = () => {
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    reset.mutate(parsed.data.email);
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={trackDismiss(handleDismiss)}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      enableDynamicSizing
    >
      <BottomSheetView style={s.content}>
        {reset.isSuccess ? (
          <>
            <Animated.View entering={ZoomIn.springify()} style={s.sentIcon}>
              <MailCheck size={32} color={colors.brand.primary} />
            </Animated.View>
            <Text style={[s.title, s.centered]}>Confira seu e-mail</Text>
            <Text style={s.sentText}>{reset.data.message}</Text>
            <Text style={s.sentText}>O link vale por 30 minutos.</Text>
            <PrimaryButton label="Voltar para o login" onPress={() => sheetRef.current?.dismiss()} />
          </>
        ) : (
          <View style={s.form}>
            <Text style={s.title}>Esqueceu a senha?</Text>
            <Text style={s.subtitle}>
              Mandamos um link para você criar uma senha nova. Vale também para quem entrou com o Google e
              quer uma senha.
            </Text>
            <FormField
              label="E-mail"
              value={email}
              onChangeText={(v) => {
                setFieldError(undefined);
                setEmail(v);
              }}
              error={fieldError}
              placeholder="voce@email.com"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
            />
            {reset.isError && <ErrorBanner message={getPasswordResetErrorMessage(reset.error)} />}
            <PrimaryButton label="Enviar link" onPress={handleSubmit} loading={reset.isPending} />
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
