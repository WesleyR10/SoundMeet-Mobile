import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import type { BillingCycle, MusicianPlan } from '../../../domain/plans.config';

type Props = {
  plan:      MusicianPlan;
  cycle:     BillingCycle;
  isCurrent: boolean;
  onPress:   () => void;
};

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// CTA fixo do paywall — gradiente premium (violeta) com label que acompanha o
// tier selecionado + fine print de cancelamento.
export function PaywallFooter({ plan, cycle, isCurrent, onPress }: Props) {
  const isFree   = plan.monthlyPriceBrl === 0;
  const disabled = isCurrent || isFree;

  const label = isCurrent
    ? 'Este já é o seu plano'
    : isFree
      ? 'Continue no Free'
      : cycle === 'annual'
        ? `Assinar ${plan.name} — ${formatBRL(plan.annualPriceBrl)}/ano`
        : `Assinar ${plan.name} — ${formatBRL(plan.monthlyPriceBrl)}/mês`;

  return (
    <View style={s.root}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [pressed && !disabled && s.pressed, disabled && s.disabled]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
      >
        <LinearGradient
          colors={gradients.premium}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[s.cta, !disabled && shadows.violet]}
        >
          <Text style={s.ctaLabel}>{label}</Text>
        </LinearGradient>
      </Pressable>

      <Text style={s.finePrint}>Cancele quando quiser • Sem fidelidade</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap:               spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    backgroundColor:  colors.bg.primary,
  },
  cta: {
    height:          60,
    borderRadius:    radius.xl,
    alignItems:     'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
  ctaLabel: {
    ...typography.bodyLg,
    fontFamily:    'SpaceGrotesk-Bold',
    letterSpacing:  0.5,
    color:          colors.text.primary,
  },
  finePrint: {
    ...typography.caption,
    color:     colors.text.muted,
    textAlign: 'center',
  },
});
