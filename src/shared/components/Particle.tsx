import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

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
  const translateY = useSharedValue(0);
  const opacity    = useSharedValue(0.35);

  useEffect(() => {
    translateY.value = withDelay(delay, withRepeat(withTiming(-14, { duration }), -1, true));
    opacity.value    = withDelay(delay, withRepeat(withTiming(0.9,  { duration }), -1, true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
