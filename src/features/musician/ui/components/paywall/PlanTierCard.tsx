import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { gradients, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import type { BillingCycle, MusicianPlan } from '../../../domain/plans.config';
import { PlanFeatureRow } from './PlanFeatureRow';
import { PlanPrice } from './PlanPrice';

type Props = {
  plan:      MusicianPlan;
  cycle:     BillingCycle;
  index:     number;
  selected:  boolean;
  isCurrent: boolean;
  onSelect:  () => void;
};

// Card de um tier — entrada em stagger (opacity+translateY com withDelay por
// index, padrão hand-rolled do projeto) e seleção animada via interpolateColor
// na borda. O card Pro ganha moldura gradiente premium + badge "MAIS POPULAR".
const useStyles = makeStyles((colors) => ({
  popularFrame: {
    borderRadius: radius.lg + 2,
    padding:       2,
  },
  popularBadge: {
    position:          'absolute',
    top:               -10,
    alignSelf:         'center',
    paddingHorizontal:  spacing.md,
    paddingVertical:     3,
    borderRadius:       radius.full,
    backgroundColor:   colors.accent.violet,
  },
  popularBadgeText: {
    ...typography.caption,
    color:         colors.text.primary,
    letterSpacing:  1,
  },
  card: {
    borderRadius:     radius.lg,
    borderWidth:       1,
    backgroundColor:  colors.bg.surface,
    padding:           spacing.lg,
    gap:               spacing.md,
  },
  cardPopular: {
    // Moldura gradiente já faz o contorno — borda interna some.
    borderWidth: 0,
  },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  name: {
    ...typography.title,
    color: colors.text.primary,
  },
  currentChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical:    2,
    borderRadius:       radius.full,
    backgroundColor:   colors.brand.muted,
    borderWidth:         1,
    borderColor:        colors.border.brand,
  },
  currentChipText: {
    ...typography.caption,
    color: colors.brand.primary,
  },
  tagline: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection:    'row',
    borderRadius:      radius.md,
    backgroundColor:  colors.bg.elevated,
    paddingVertical:   spacing.md,
  },
  stat: {
    flex:       1,
    alignItems: 'center',
    gap:         2,
  },
  statValue: {
    ...typography.body,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color:      colors.brand.primary,
  },
  statLabel: {
    ...typography.caption,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  features: {
    gap: spacing.sm,
  },
}));

export function PlanTierCard({ plan, cycle, index, selected, isCurrent, onSelect }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const entrance  = useSharedValue(0);
  const selection = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    entrance.value = withDelay(
      140 * index,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    selection.value = withTiming(selected ? 1 : 0, { duration: 200 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity:   entrance.value,
    transform: [{ translateY: (1 - entrance.value) * 24 }],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      selection.value,
      [0, 1],
      [colors.border.default, colors.accent.violetLight],
    ),
  }));

  const inner = (
    <Animated.View style={[s.card, borderStyle, plan.popular && s.cardPopular]}>
      <View style={s.headerRow}>
        <Text style={s.name}>{plan.name}</Text>
        {isCurrent ? (
          <View style={s.currentChip}>
            <Text style={s.currentChipText}>Seu plano</Text>
          </View>
        ) : null}
      </View>
      <Text style={s.tagline}>{plan.tagline}</Text>

      <PlanPrice plan={plan} cycle={cycle} />

      <View style={s.statsRow}>
        {plan.keyStats.map((stat) => (
          <View key={stat.label} style={s.stat}>
            <Text style={s.statValue}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.features}>
        {plan.features.map((feature) => (
          <PlanFeatureRow key={feature.label} label={feature.label} included={feature.included} />
        ))}
      </View>
    </Animated.View>
  );

  return (
    <Animated.View style={entranceStyle}>
      <Pressable
        onPress={onSelect}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`Plano ${plan.name}`}
      >
        {plan.popular ? (
          <View style={shadows.violet}>
            <LinearGradient
              colors={gradients.premium}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.popularFrame}
            >
              {inner}
            </LinearGradient>
            <View style={s.popularBadge}>
              <Text style={s.popularBadgeText}>MAIS POPULAR</Text>
            </View>
          </View>
        ) : (
          inner
        )}
      </Pressable>
    </Animated.View>
  );
}
