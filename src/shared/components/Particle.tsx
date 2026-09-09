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
  top?:     number;
  left?:    number;
  right?:   number;
  size:     number;
  color:    string;
  duration: number;
  delay:    number;
};

export function Particle({ top, left, right, size, color, duration, delay }: Props) {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  const opacity    = useSharedValue(0.35);

  useEffect(() => {
    // Partícula flutuante é movimento periférico contínuo — o caso que mais
    // provoca enjoo em quem liga a preferência. Fica parada e visível, não
    // some: ela compõe o fundo, e apagá-la mudaria a composição da tela.
    if (reducedMotion) {
      translateY.value = 0;
      opacity.value    = 0.6;
      return;
    }
    translateY.value = withDelay(delay, withRepeat(withTiming(-14, { duration }), -1, true));
    opacity.value    = withDelay(delay, withRepeat(withTiming(0.9,  { duration }), -1, true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        s.particle,
        animStyle,
        {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color, shadowOpacity: 0.85, shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
          top, left, right,
        },
      ]}
    />
  );
}

const s = StyleSheet.create({
  particle: { position: 'absolute' },
});
