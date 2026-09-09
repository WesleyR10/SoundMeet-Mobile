import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { MultiSelectChip } from '@/shared/components/MultiSelectChip';
import { extractApiMessage, isEmailNotVerifiedError } from '@/shared/services/http/types';
import { resendVerificationEmail } from '@/shared/services/auth/verify-email.api';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { Wallet } from '../../domain/tip.types';
import {
  getWithdrawAvailability,
  parseWithdrawAmount,
  type AmountRejection,
} from '../../domain/withdraw.rules';
import { useWithdraw } from '../../application/useWithdraw';

type Props = {
  visible: boolean;
  onClose: () => void;
  wallet: Wallet;
  musicianId: string | null;
};

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Máscara da chave PIX exibida como destino.
 *
 * 🔴 O músico precisa **reconhecer** o destino antes de confirmar — é a última
 * chance de perceber uma chave trocada —, mas a chave inteira na tela é PII
 * (e-mail, CPF ou telefone) exposta a quem estiver olhando por cima do ombro
 * num bar. Guarda o suficiente para reconhecer, não para copiar.
 */
function maskPixKey(key: string): string {
  if (key.includes('@')) {
    const [user, domain] = key.split('@');
    const head = user.slice(0, 2);
    return `${head}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`;
  }
  const visible = key.slice(-4);
  return `${'*'.repeat(Math.max(3, key.length - 4))}${visible}`;
}

const REJECTION_HINT: Record<Exclude<AmountRejection, 'empty'>, (a: { minAmount: number; maxAmount: number }) => string> = {
  'not-a-number': () => 'Digite um valor em reais.',
  'too-many-decimals': () => 'Use no máximo dois centavos (ex.: 120,50).',
  'below-minimum': (a) => `O mínimo do seu plano é ${formatBRL(a.minAmount)}.`,
  'above-balance': (a) => `Você tem ${formatBRL(a.maxAmount)} disponíveis.`,
};

/**
 * Pedir saque do saldo liberado.
 *
 * Molde de `InviteMemberSheet` (`BottomSheetModal` + backdrop `pressBehavior`
 * + `enableDynamicSizing`), com uma diferença que é a razão de existir desta
 * tela: aqui o botão move dinheiro para fora, então o destino é exibido antes
 * da confirmação e o sheet **não fecha sozinho no erro** — fica aberto com o
 * valor digitado para o músico tentar de novo sem redigitar.
 */
const useStyles = makeStyles((colors) => ({
  sheetBg: { backgroundColor: colors.bg.elevated },
  handle: { backgroundColor: colors.border.strong, width: 44 },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  available: {
    ...typography.body,
    color: colors.text.secondary,
  },
  availableValue: {
    fontFamily: 'Inter-SemiBold',
    color: colors.text.primary,
  },
  destination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.brand,
    backgroundColor: colors.brand.muted,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  destinationText: {
    ...typography.bodySm,
    color: colors.text.primary,
    flex: 1,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: spacing.md,
  },
  amountBoxInvalid: { borderColor: `${colors.status.error}80` },
  amountPrefix: {
    ...typography.bodyLg,
    fontFamily: 'Inter-SemiBold',
    color: colors.text.secondary,
  },
  amountInput: {
    flex: 1,
    ...typography.bodyLg,
    fontFamily: 'Inter-Medium',
    color: colors.text.primary,
  },
  hint: {
    ...typography.bodySm,
    color: colors.status.error,
  },
  error: { marginTop: spacing.xs },
  resendBtn: {
    marginTop:       spacing.sm,
    height:          44,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.brand.primary,
    alignItems:      'center',
    justifyContent: 'center',
  },
  resendLabel: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.brand,
  },
  submit: { marginTop: spacing.sm },
  cancel: {
    alignSelf: 'center',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  cancelText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  doneBox: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  doneTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  doneText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
}));

export function WithdrawSheet({ visible, onClose, wallet, musicianId }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [amountText, setAmountText] = useState('');
  const [done, setDone] = useState<{ amount: number; days: number } | null>(null);

  const withdraw = useWithdraw(musicianId);

  // Gate de e-mail confirmado: o saque é a única ação que tira dinheiro do
  // sistema em definitivo, e o backend o recusa com 403/EMAIL_NOT_VERIFIED até
  // o endereço ser confirmado. "Tentar novamente" nunca resolveria isso — a
  // saída é reenviar o link, e é ela que a UI precisa oferecer.
  const userEmail = useAuthStore((state) => state.user?.email ?? null);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const needsEmailVerification = withdraw.isError && isEmailNotVerifiedError(withdraw.error);

  const handleResendVerification = async () => {
    if (!userEmail || resendState !== 'idle') return;
    setResendState('sending');
    try {
      await resendVerificationEmail(userEmail);
    } finally {
      // Sucesso e falha levam ao mesmo estado de propósito: a resposta do
      // backend é genérica por desenho, então não há o que confirmar aqui além
      // de "pedimos o reenvio".
      setResendState('sent');
    }
  };
  const availability = getWithdrawAvailability(wallet);
  const parsed = parseWithdrawAmount(amountText, availability);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const handleDismiss = () => {
    setAmountText('');
    setDone(null);
    withdraw.reset();
    onClose();
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  const handleSubmit = async () => {
    if (!parsed.ok) return;
    try {
      const result = await withdraw.mutateAsync(parsed.value);
      setDone({ amount: parsed.value, days: result.withdrawal_days });
    } catch {
      // Fica visível no ErrorBanner abaixo; o sheet segue aberto de propósito,
      // com o valor preservado — redigitar um valor em reais depois de uma
      // queda de rede é onde o usuário desiste.
    }
  };

  // Atalhos de valor: metade e tudo. Sacar o saldo inteiro é o caso comum, e
  // digitar "1.247,30" à mão num teclado numérico é onde nasce erro de dedo.
  const presets = [
    { label: 'Metade', value: Math.floor((availability.maxAmount / 2) * 100) / 100 },
    { label: 'Tudo', value: availability.maxAmount },
  ].filter((p) => p.value >= availability.minAmount);

  const hint =
    parsed.ok || parsed.reason === 'empty'
      ? null
      : REJECTION_HINT[parsed.reason](availability);

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      enableDynamicSizing
    >
      <BottomSheetView style={s.content}>
        {done ? (
          <View style={s.doneBox}>
            <CheckCircle2 size={40} color={colors.status.success} strokeWidth={2} />
            <Text style={s.doneTitle}>Saque solicitado</Text>
            {/*
              "Solicitado", nunca "recebido": quem confirma a transferência é o
              provedor, e o webhook pode levar minutos. Anunciar como concluído
              aqui repetiria, na carteira, o erro que `boostStatusLabel` existe
              para impedir no card do pedido.
            */}
            <Text style={s.doneText}>
              {formatBRL(done.amount)} a caminho da sua chave PIX. O prazo é de até{' '}
              {done.days} {done.days === 1 ? 'dia útil' : 'dias úteis'}.
            </Text>
            <PrimaryButton label="Fechar" onPress={handleDismiss} style={s.submit} />
          </View>
        ) : (
          <>
            <Text style={s.title}>Sacar para o PIX</Text>
            <Text style={s.available}>
              Disponível: <Text style={s.availableValue}>{formatBRL(availability.maxAmount)}</Text>
            </Text>

            {wallet.pix_key && (
              <View style={s.destination}>
                <ShieldCheck size={16} color={colors.brand.primary} strokeWidth={2} />
                <Text style={s.destinationText} numberOfLines={1}>
                  Para {maskPixKey(wallet.pix_key)}
                </Text>
              </View>
            )}

            {presets.length > 0 && (
              <View style={s.presetsRow}>
                {presets.map((preset) => (
                  <MultiSelectChip
                    key={preset.label}
                    label={`${preset.label} · ${formatBRL(preset.value)}`}
                    selected={parsed.ok && parsed.value === preset.value}
                    accentColor={colors.brand.primary}
                    onPress={() => setAmountText(String(preset.value).replace('.', ','))}
                  />
                ))}
              </View>
            )}

            <View style={[s.amountBox, hint ? s.amountBoxInvalid : null]}>
              <Text style={s.amountPrefix}>R$</Text>
              <TextInput
                value={amountText}
                onChangeText={setAmountText}
                placeholder="0,00"
                placeholderTextColor={colors.text.muted}
                keyboardType="decimal-pad"
                style={s.amountInput}
                cursorColor={colors.brand.primary}
                selectionColor={`${colors.brand.primary}66`}
                accessibilityLabel="Valor do saque em reais"
                accessibilityHint={`Entre ${formatBRL(availability.minAmount)} e ${formatBRL(availability.maxAmount)}`}
              />
            </View>

            {!!hint && <Text style={s.hint}>{hint}</Text>}

            {withdraw.isError && (
              <ErrorBanner message={extractApiMessage(withdraw.error)} style={s.error} />
            )}

            {needsEmailVerification && !!userEmail && (
              <Pressable
                onPress={handleResendVerification}
                disabled={resendState !== 'idle'}
                style={s.resendBtn}
                accessibilityRole="button"
                accessibilityLabel="Reenviar e-mail de confirmação"
              >
                <Text style={s.resendLabel}>
                  {resendState === 'idle'
                    ? 'Reenviar e-mail de confirmação'
                    : resendState === 'sending'
                      ? 'Enviando…'
                      : `Link enviado para ${userEmail}`}
                </Text>
              </Pressable>
            )}

            <PrimaryButton
              label="Solicitar saque"
              onPress={handleSubmit}
              loading={withdraw.isPending}
              disabled={!parsed.ok || withdraw.isPending}
              style={s.submit}
            />

            <Pressable
              onPress={handleDismiss}
              disabled={withdraw.isPending}
              hitSlop={8}
              style={s.cancel}
              accessibilityRole="button"
              accessibilityLabel="Cancelar saque"
            >
              <Text style={s.cancelText}>Cancelar</Text>
            </Pressable>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
