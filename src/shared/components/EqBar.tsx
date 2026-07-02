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
  color:    string;
  height:   number;
  duration: number;
  delay:    number;
};

export function EqBar({ color, height, duration, delay }: Props) {
  const scaleY = useSharedValue(0.3);

  useEffect(() => {
    scaleY.value = withDelay(delay, withRepeat(withTiming(1, { duration }), -1, true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return <Animated.View style={[s.bar, animStyle, { height, backgroundColor: color }]} />;
}

const s = StyleSheet.create({
  bar: { width: 3, borderRadius: 3 },
});
