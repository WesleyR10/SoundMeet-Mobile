import { useEffect } from 'react';
import { Dimensions, Text, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  cents:     number | null;
  hasSignal: boolean;
};

const SW = Dimensions.get('window').width;
// Deslocamento máximo da pílula (±50 cents mapeados na largura útil).
const MAX_SHIFT = SW * 0.28;
const CLAMP_CENTS = 50;

// Pílula de desvio (referência Pinterest 654781233368977952): mostra o valor
// em cents e desliza horizontalmente proporcional ao desvio, com a linha
// vertical descendo até o headstock. Verde→âmbar→coral com os mesmos
// limiares do arco cromático (TunerCentsMeter) — 120ms de timing, idem.
export function TunerCentsPill({ cents, hasSignal }: Props) {
  const shift    = useSharedValue(0);
  const absCents = useSharedValue(0);
  const active   = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.max(-CLAMP_CENTS, Math.min(CLAMP_CENTS, cents ?? 0));
    shift.value    = withTiming((clamped / CLAMP_CENTS) * MAX_SHIFT, { duration: 120 });
    absCents.value = withTiming(Math.abs(cents ?? 0), { duration: 120 });
    active.value   = withTiming(hasSignal && cents !== null ? 1 : 0.35, { duration: 160 });
  }, [cents, hasSignal]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity:   active.value,
    transform: [{ translateX: shift.value }],
    backgroundColor: interpolateColor(
      Math.min(absCents.value, CLAMP_CENTS),
      [0, 15, CLAMP_CENTS],
      [colors.status.success, colors.status.warning, colors.accent.coral],
    ),
  }));

  const lineStyle = useAnimatedStyle(() => ({
    opacity:   active.value,
    transform: [{ translateX: shift.value }],
    backgroundColor: interpolateColor(
      Math.min(absCents.value, CLAMP_CENTS),
      [0, 15, CLAMP_CENTS],
      [colors.status.success, colors.status.warning, colors.accent.coral],
    ),
  }));

  const label =
    !hasSignal || cents === null ? '--' : cents > 0 ? `+${cents}` : `${cents}`;

  return (
    <View style={s.root}>
      <Animated.View style={[s.pill, pillStyle]}>
        <Text style={s.pillText}>{label}</Text>
      </Animated.View>
      <Animated.View style={[s.line, lineStyle]} />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  pill: {
    minWidth:          52,
    paddingVertical:    spacing.xs,
    paddingHorizontal:  spacing.md,
    borderRadius:       radius.full,
    alignItems:        'center',
  },
  pillText: {
    ...typography.body,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color:      colors.text.inverse,
  },
  line: {
    width:      2,
    height:     36,
    marginTop:  spacing.xs,
    borderRadius: 1,
  },
});
