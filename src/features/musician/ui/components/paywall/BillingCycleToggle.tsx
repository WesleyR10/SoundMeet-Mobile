import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { BillingCycle } from '../../../domain/plans.config';

type Props = {
  cycle:    BillingCycle;
  onChange: (cycle: BillingCycle) => void;
};

const TOGGLE_HEIGHT = 48;

// Segmented control Mensal | Anual com pílula deslizante (withSpring).
// Largura por flex 1/2 — o indicador anima translateX de 0 → 50% via
// percentual do container medido, sem Dimensions.
export function BillingCycleToggle({ cycle, onChange }: Props) {
  const progress = useSharedValue(cycle === 'annual' ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(cycle === 'annual' ? 1 : 0, { damping: 18, stiffness: 180 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 50}%`,
  }));

  return (
    <View style={s.root} accessibilityRole="tablist">
      <Animated.View style={[s.indicator, indicatorStyle]} />

      <Segment
        label="Mensal"
        active={cycle === 'monthly'}
        onPress={() => onChange('monthly')}
      />
      <Segment
        label="Anual"
        badge="−28%"
        active={cycle === 'annual'}
        onPress={() => onChange('annual')}
      />
    </View>
  );
}

function Segment({ label, badge, active, onPress }: {
  label:   string;
  badge?:  string;
  active:  boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={s.segment}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={badge ? `${label}, economize ${badge}` : label}
    >
      <Text style={[s.segmentLabel, active && s.segmentLabelActive]}>{label}</Text>
      {badge ? (
        <View style={s.badge}>
          <Text style={s.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection:   'row',
    height:           TOGGLE_HEIGHT,
    borderRadius:     radius.full,
    backgroundColor: colors.bg.elevated,
    borderWidth:       1,
    borderColor:      colors.border.default,
    padding:           spacing.xs,
  },
  indicator: {
    position:        'absolute',
    top:              spacing.xs,
    bottom:           spacing.xs,
    width:           '50%',
    borderRadius:     radius.full,
    backgroundColor: colors.accent.violet,
  },
  segment: {
    flex:            1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.xs,
  },
  segmentLabel: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
  segmentLabelActive: {
    color: colors.text.primary,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical:    1,
    borderRadius:       radius.sm,
    backgroundColor:   colors.accent.coral,
  },
  badgeText: {
    ...typography.caption,
    color: colors.text.primary,
  },
});
