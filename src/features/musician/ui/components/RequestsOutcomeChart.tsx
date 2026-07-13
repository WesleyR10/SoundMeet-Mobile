import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { GlowCard } from '@/shared/components/GlowCard';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 140;
const STROKE = 14;
const CENTER = SIZE / 2;
const R = CENTER - STROKE / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

type Props = {
  accepted: number;
  rejected: number;
};

// Donut aceito×rejeitado feito à mão com react-native-svg + Reanimated (sem
// lib de gráfico — nenhuma instalada, ver Docs/roadmap-mobile.md Bloco 6),
// mesma técnica de strokeDasharray/strokeDashoffset animado do WizardProgress
// (linhas do wizard, aqui aplicada a um círculo em vez de segmento reto).
// Paleta: teal+âmbar (design-system.md, "Analytics" na tabela de paleta por
// contexto), não teal+coral/vermelho como no resto do app.
export function RequestsOutcomeChart({ accepted, rejected }: Props) {
  const total = accepted + rejected;
  const acceptedFraction = total > 0 ? accepted / total : 0;
  const rejectedFraction = total > 0 ? rejected / total : 0;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accepted, rejected]);

  const acceptedProps = useAnimatedProps(() => {
    const len = CIRCUMFERENCE * acceptedFraction * progress.value;
    return { strokeDasharray: `${len} ${CIRCUMFERENCE}` };
  });

  const rejectedProps = useAnimatedProps(() => {
    const len = CIRCUMFERENCE * rejectedFraction * progress.value;
    const offset = -CIRCUMFERENCE * acceptedFraction * progress.value;
    return {
      strokeDasharray: `${len} ${CIRCUMFERENCE}`,
      strokeDashoffset: offset,
    };
  });

  return (
    <GlowCard accentColor={colors.brand.primary} style={s.card}>
      <Text style={s.title}>Pedidos</Text>

      <View style={s.body}>
        <Svg width={SIZE} height={SIZE}>
          <G transform={`rotate(-90, ${CENTER}, ${CENTER})`}>
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={R}
              stroke={colors.border.default}
              strokeWidth={STROKE}
              fill="none"
            />
            <AnimatedCircle
              cx={CENTER}
              cy={CENTER}
              r={R}
              stroke={colors.brand.primary}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              animatedProps={acceptedProps}
            />
            <AnimatedCircle
              cx={CENTER}
              cy={CENTER}
              r={R}
              stroke={colors.accent.amber}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              animatedProps={rejectedProps}
            />
          </G>
        </Svg>

        <View style={s.legend}>
          <LegendRow color={colors.brand.primary} label="Aceitos" value={accepted} />
          <LegendRow color={colors.accent.amber} label="Rejeitados" value={rejected} />
        </View>
      </View>
    </GlowCard>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={s.legendRow}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={s.legendLabel}>{label}</Text>
      <Text style={s.legendValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  title: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color: colors.text.primary,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  legend: {
    flex: 1,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
  legendLabel: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex: 1,
  },
  legendValue: {
    ...typography.mono,
    color: colors.text.primary,
  },
});
