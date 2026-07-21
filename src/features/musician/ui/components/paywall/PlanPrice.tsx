import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { BillingCycle, MusicianPlan } from '../../../domain/plans.config';

type Props = {
  plan:  MusicianPlan;
  cycle: BillingCycle;
};

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Bloco de preço do card — crossfade sutil a cada troca de ciclo (o valor
// muda de conteúdo, então re-anima opacity/translateY em vez de layout).
export function PlanPrice({ plan, cycle }: Props) {
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 260 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity:   progress.value,
    transform: [{ translateY: (1 - progress.value) * 6 }],
  }));

  const isFree   = plan.monthlyPriceBrl === 0;
  const isAnnual = cycle === 'annual' && !isFree;
  // Anual: mostra o equivalente mensal como número-herói (comparável entre
  // ciclos) e o total cobrado por ano como apoio.
  const heroPrice = isFree
    ? 'R$ 0'
    : isAnnual
      ? formatBRL(plan.annualPriceBrl / 12)
      : formatBRL(plan.monthlyPriceBrl);

  return (
    <Animated.View style={animatedStyle}>
      <View style={s.priceRow}>
        <Text style={s.price}>{heroPrice}</Text>
        <Text style={s.per}>/mês</Text>
      </View>

      {isAnnual ? (
        <View style={s.annualRow}>
          <Text style={s.annualNote}>{formatBRL(plan.annualPriceBrl)} cobrado por ano</Text>
          <View style={s.savingsBadge}>
            <Text style={s.savingsText}>Economize {formatBRL(plan.annualSavingsBrl)}</Text>
          </View>
        </View>
      ) : isFree ? (
        <Text style={s.annualNote}>Para sempre, sem cartão</Text>
      ) : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  priceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:            spacing.xs,
  },
  price: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  per: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  annualRow: {
    flexDirection: 'row',
    alignItems:    'center',
    flexWrap:      'wrap',
    gap:            spacing.sm,
    marginTop:      spacing.xs,
  },
  annualNote: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  savingsBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical:    2,
    borderRadius:       radius.sm,
    backgroundColor:   colors.brand.muted,
  },
  savingsText: {
    ...typography.caption,
    color: colors.brand.primary,
  },
});
