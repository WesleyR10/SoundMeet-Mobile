import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { CalendarClock } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import {
  getSubscriptionErrorMessage,
  useActiveSubscription,
  useCancelSubscription,
} from '../../../application/useSubscription';

type Props = {
  musicianId: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Estado da assinatura em vigor, no topo do paywall.
 *
 * 🔴 **Some por inteiro no plano gratuito.** `effective_tier === "free"` com
 * `subscription === null` é o estado normal de quem nunca assinou — renderizar
 * um card de "sua assinatura" ali inventaria um contrato que não existe.
 *
 * ⚠️ **`effective_tier`, nunca `subscription?.plan_tier`.** Os dois existem de
 * propósito: o segundo é `undefined` no plano gratuito, que é um tier legítimo.
 */
const useStyles = makeStyles((colors) => ({
  card: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.accent.violet}40`,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color: colors.text.primary,
  },
  detail: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelText: {
    ...typography.bodySm,
    color: colors.text.muted,
    textDecorationLine: 'underline',
  },
  confirmHelp: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  keepBtn: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  keepText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color: colors.text.primary,
  },
  confirmBtn: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.status.error}55`,
  },
  confirmText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color: colors.status.error,
  },
}));

export function ActiveSubscriptionCard({ musicianId }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { data } = useActiveSubscription(musicianId);
  const cancel = useCancelSubscription(musicianId);
  const [confirming, setConfirming] = useState(false);

  const subscription = data?.subscription;
  if (!subscription || data?.effective_tier === 'free') return null;

  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <CalendarClock size={18} color={colors.accent.violetLight} />
        <Text style={s.title}>Assinatura ativa</Text>
      </View>

      <Text style={s.detail}>
        {subscription.billing_cycle === 'annual' ? 'Plano anual' : 'Plano mensal'}
        {subscription.expires_at ? ` · renova em ${formatDate(subscription.expires_at)}` : ''}
      </Text>

      {!confirming ? (
        <Pressable
          onPress={() => setConfirming(true)}
          style={s.cancelBtn}
          accessibilityRole="button"
          accessibilityLabel="Cancelar assinatura"
        >
          <Text style={s.cancelText}>Cancelar assinatura</Text>
        </Pressable>
      ) : (
        <>
          {/*
            O cancelamento não devolve dinheiro nem corta o acesso na hora — o
            plano vale até o fim do período pago. Dizer isso aqui evita que o
            músico ache que está perdendo dias que já pagou e desista por medo.
          */}
          <Text style={s.confirmHelp}>
            Você mantém o plano até o fim do período já pago. Depois disso, volta para o Free.
          </Text>
          <View style={s.confirmRow}>
            <Pressable
              onPress={() => setConfirming(false)}
              disabled={cancel.isPending}
              style={s.keepBtn}
              accessibilityRole="button"
              accessibilityLabel="Manter assinatura"
            >
              <Text style={s.keepText}>Manter</Text>
            </Pressable>

            <Pressable
              onPress={() => cancel.mutate(undefined, { onSuccess: () => setConfirming(false) })}
              disabled={cancel.isPending}
              style={s.confirmBtn}
              accessibilityRole="button"
              accessibilityLabel="Confirmar cancelamento"
            >
              {cancel.isPending ? (
                <ActivityIndicator color={colors.status.error} size="small" />
              ) : (
                <Text style={s.confirmText}>Confirmar cancelamento</Text>
              )}
            </Pressable>
          </View>
        </>
      )}

      {cancel.isError && <ErrorBanner message={getSubscriptionErrorMessage(cancel.error)} />}
    </View>
  );
}
