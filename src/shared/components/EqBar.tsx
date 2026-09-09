import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

type Props = {
  color:    string;
  height:   number;
  duration: number;
  delay:    number;
};

export function EqBar({ color, height, duration, delay }: Props) {
  const reducedMotion = useReducedMotion();
  const scaleY = useSharedValue(0.3);

  useEffect(() => {
    // Barra parada em 0.3 lê como equalizador QUEBRADO, não como decoração —
    // por isso o estado estático é a altura média, não o valor inicial.
    // Mesma decisão do Skeleton: reduce motion desliga o pulso, não o encurta.
    if (reducedMotion) {
      scaleY.value = 0.65;
      return;
    }
    scaleY.value = withDelay(delay, withRepeat(withTiming(1, { duration }), -1, true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return <Animated.View style={[s.bar, animStyle, { height, backgroundColor: color }]} />;
}

const s = StyleSheet.create({
  bar: { width: 3, borderRadius: 3 },
});
