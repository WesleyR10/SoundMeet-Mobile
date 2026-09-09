import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';

export type ExploreMode = 'places' | 'musicians';

type Props = {
  mode:     ExploreMode;
  onChange: (mode: ExploreMode) => void;
};

// Alternador Locais | Músicos do FanExplore (7.13c) — pílula deslizante com
// withSpring, mesmo padrão visual do BillingCycleToggle do paywall.
const useStyles = makeStyles((colors) => ({
  root: {
    flexDirection:   'row',
    height:           40,
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
    backgroundColor: colors.brand.muted,
    borderWidth:       1,
    borderColor:      colors.border.brand,
  },
  segment: {
    flex:            1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
  labelActive: {
    color: colors.brand.primary,
  },
}));

export function ExploreModeToggle({ mode, onChange }: Props) {
  const s = useStyles();
  const progress = useSharedValue(mode === 'musicians' ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(mode === 'musicians' ? 1 : 0, { damping: 18, stiffness: 180 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 50}%`,
  }));

  return (
    <View style={s.root} accessibilityRole="tablist">
      <Animated.View style={[s.indicator, indicatorStyle]} />
      {(['places', 'musicians'] as const).map((value) => (
        <Pressable
          key={value}
          style={s.segment}
          onPress={() => onChange(value)}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === value }}
          accessibilityLabel={value === 'places' ? 'Buscar locais' : 'Buscar músicos'}
        >
          <Text style={[s.label, mode === value && s.labelActive]}>
            {value === 'places' ? 'Locais' : 'Músicos'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
