import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { CheckCircle2 } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { WithdrawEligibility } from '../../domain/tip.types';

type Props = {
  eligibility: WithdrawEligibility;
};

const NEAR_THRESHOLD = 0.85;

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Item 5.5 do roadmap — diferente do precedente estático de BadgeGrid.progressTrack
// (width calculado direto no JSX): aqui a barra anima de verdade via
// useSharedValue + withTiming quando os dados chegam, e ganha glow pulsante
// (mesmo idioma de BadgeGrid.shadowOpacity) quando perto de 100%.
export function WithdrawProgressBar({ eligibility }: Props) {
  const { isEligible, missingAmount, minWithdrawalAmount, withdrawalDays } = eligibility;
  const currentAmount = Math.max(0, minWithdrawalAmount - missingAmount);
  const percentage = minWithdrawalAmount > 0
    ? Math.min(100, (currentAmount / minWithdrawalAmount) * 100)
    : 100;

  const progress = useSharedValue(0);
  const glow = useSharedValue(0.3);

  useEffect(() => {
    progress.value = withTiming(percentage, { duration: 600, easing: Easing.out(Easing.cubic) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentage]);

  useEffect(() => {
    if (percentage / 100 < NEAR_THRESHOLD || isEligible) return;
    glow.value = withDelay(200, withRepeat(withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentage, isEligible]);

  const fillStyle = useAnimatedStyle(() => ({
    width:         `${progress.value}%`,
    shadowOpacity: glow.value,
  }));

  if (isEligible) {
    return (
      <View style={[s.card, s.eligibleCard]}>
        <CheckCircle2 size={20} color={colors.status.success} />
        <Text style={s.eligibleText}>Você já pode sacar! Prazo de até {withdrawalDays} {withdrawalDays === 1 ? 'dia' : 'dias'}.</Text>
      </View>
    );
  }

  return (
    <View style={s.card}>
      <Text style={s.title}>
        Você está a <Text style={s.highlight}>{formatBRL(missingAmount)}</Text> de poder sacar
      </Text>

      <View style={s.track}>
        <Animated.View style={[s.fill, fillStyle]} />
      </View>

      <Text style={s.hint}>Saque em até {withdrawalDays} {withdrawalDays === 1 ? 'dia' : 'dias'} após liberado</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius:    radius.lg,
    borderWidth:      1,
    borderColor:     `${colors.accent.coral}30`,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding:          spacing.lg,
    gap:              spacing.sm,
  },
  eligibleCard: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             spacing.sm,
    borderColor:    `${colors.status.success}40`,
  },
  eligibleText: {
    ...typography.body,
    color: colors.text.primary,
    flex:  1,
  },
  title: {
    ...typography.body,
    color: colors.text.secondary,
  },
  highlight: {
    fontFamily: 'Inter-SemiBold',
    color:      colors.accent.coral,
  },
  track: {
    height:           8,
    borderRadius:     radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow:         'hidden',
  },
  fill: {
    height:           '100%',
    borderRadius:     radius.full,
    backgroundColor: colors.accent.coral,
    shadowColor:      colors.accent.coral,
    shadowOffset:     { width: 0, height: 0 },
    shadowRadius:      10,
    elevation:          4,
  },
  hint: {
    ...typography.caption,
    color: colors.text.muted,
  },
});
