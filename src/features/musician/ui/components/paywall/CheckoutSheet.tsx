import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { ShieldCheck } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { FormField } from '@/shared/components/FormField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { formatCpf, stripDigits } from '@/shared/utils/cpf';
import { formatCnpj } from '@/shared/utils/cnpj';
import type { BillingCycle, MusicianPlan } from '../../../domain/plans.config';
import { checkoutPayerSchema } from '../../../domain/subscription.validation';
import {
  getSubscriptionErrorMessage,
  useCreateCheckout,
} from '../../../application/useSubscription';

type Props = {
  visible: boolean;
  onClose: () => void;
  musicianId: string | null;
  plan: MusicianPlan;
  cycle: BillingCycle;
  /** Pré-preenchimento vindo do perfil — o CPF nunca vem daqui (ver validation). */
  defaultName: string;
  defaultEmail: string;
  defaultDocument: string | null;
};

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Máscara conforme o comprimento — o campo aceita CPF e CNPJ. */
function maskDocument(value: string): string {
  const digits = stripDigits(value).slice(0, 14);
  return digits.length > 11 ? formatCnpj(digits) : formatCpf(digits);
}

/**
 * Coleta do pagador antes de abrir a fatura hospedada.
 *
 * 🔴 **Nenhum dado de cartão passa por aqui.** O backend cria a assinatura
 * recorrente no Asaas e devolve a URL da fatura; o app abre num Chrome Custom
 * Tab. Coletar cartão dentro do binário traria PCI DSS para dentro do app sem
 * nenhum ganho de conversão.
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
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  amount: {
    ...typography.displayMd,
    color: colors.accent.violetLight,
  },
  amountCycle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  help: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.brand,
    backgroundColor: colors.brand.muted,
    padding: spacing.md,
  },
  noticeText: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex: 1,
  },
  doneBox: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
}));

export function CheckoutSheet({
  visible,
  onClose,
  musicianId,
  plan,
  cycle,
  defaultName,
  defaultEmail,
  defaultDocument,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [document, setDocument] = useState(defaultDocument ? maskDocument(defaultDocument) : '');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const checkout = useCreateCheckout(musicianId);
  const amount = cycle === 'annual' ? plan.annualPriceBrl : plan.monthlyPriceBrl;

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const handleDismiss = () => {
    setFieldError(null);
    setAwaitingConfirmation(false);
    checkout.reset();
    onClose();
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  const handleSubmit = async () => {
    /*
     * O `PaywallFooter` já desabilita o CTA no tier gratuito, então isto não
     * deveria ser alcançável — mas o `plan_tier` viaja num cast, e um cast que
     * mente manda `"free"` para uma rota que só conhece tiers pagos. Barrar
     * aqui custa uma linha; descobrir pelo 422 custaria uma sessão.
     */
    if (plan.tier === 'free') return;

    const parsed = checkoutPayerSchema.safeParse({
      payer_name: name,
      payer_email: email,
      payer_cpf_cnpj: document,
    });

    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Confira os dados do pagamento');
      return;
    }

    setFieldError(null);
    try {
      const result = await checkout.mutateAsync({
        plan_tier: plan.tier as 'essential' | 'pro',
        billing_cycle: cycle,
        ...parsed.data,
      });

      /*
       * 🔴 `checkout_url` é NULLABLE. Sem URL não houve para onde navegar — a
       * assinatura foi criada no gateway e a cobrança chega por outro canal.
       * Fechar o sheet aqui anunciaria um pagamento que o usuário não fez.
       */
      if (!result.checkout_url) {
        setAwaitingConfirmation(true);
        return;
      }

      handleDismiss();
    } catch {
      // Visível no ErrorBanner — 409 ("assinatura já ativa neste plano") é o
      // caso mais provável e a mensagem do backend já é acionável.
    }
  };

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
      <BottomSheetScrollView contentContainerStyle={s.content}>
        {awaitingConfirmation ? (
          <View style={s.doneBox}>
            <ShieldCheck size={36} color={colors.accent.violet} />
            <Text style={s.title}>Assinatura registrada</Text>
            <Text style={s.help}>
              A cobrança do plano {plan.name} foi criada. Assim que o pagamento for confirmado, o
              plano é liberado automaticamente aqui no app.
            </Text>
            <PrimaryButton label="Entendi" onPress={handleDismiss} />
          </View>
        ) : (
          <>
            <Text style={s.title}>Assinar {plan.name}</Text>
            <View style={s.amountRow}>
              <Text style={s.amount}>{formatBRL(amount)}</Text>
              <Text style={s.amountCycle}>{cycle === 'annual' ? '/ano' : '/mês'}</Text>
            </View>

            <FormField
              label="Nome do pagador"
              value={name}
              onChangeText={(v) => { setFieldError(null); setName(v); }}
              placeholder="Como está no documento"
              autoCapitalize="words"
            />

            <FormField
              label="E-mail para a cobrança"
              value={email}
              onChangeText={(v) => { setFieldError(null); setEmail(v); }}
              placeholder="voce@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <FormField
              label="CPF ou CNPJ"
              value={document}
              onChangeText={(v) => { setFieldError(null); setDocument(maskDocument(v)); }}
              placeholder="000.000.000-00"
              keyboardType="number-pad"
            />

            {!!fieldError && <ErrorBanner message={fieldError} />}
            {checkout.isError && (
              <ErrorBanner message={getSubscriptionErrorMessage(checkout.error)} />
            )}

            <View style={s.notice}>
              <ShieldCheck size={16} color={colors.brand.primary} />
              <Text style={s.noticeText}>
                O pagamento é concluído na página segura do Asaas. O app não guarda dados do seu
                cartão.
              </Text>
            </View>

            <PrimaryButton
              label="Continuar para o pagamento"
              onPress={handleSubmit}
              loading={checkout.isPending}
              disabled={checkout.isPending}
            />
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
