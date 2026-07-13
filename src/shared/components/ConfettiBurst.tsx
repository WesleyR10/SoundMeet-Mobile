import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '@/shared/design-system/tokens';

const PARTICLE_COUNT = 10;
const BURST_COLORS    = [colors.brand.primary, colors.accent.violet, '#4D9CFF', colors.accent.amber];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

type Props = {
  // dispara o burst (one-shot, não repete) quando passa de false → true
  trigger: boolean;
};

// Diferente do Particle (drift em loop infinito) — aqui é um único burst radial,
// consumido no momento do reveal do QR do Step 3.
export function ConfettiBurst({ trigger }: Props) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle    = (i / PARTICLE_COUNT) * Math.PI * 2 + randomBetween(-0.2, 0.2);
        const distance = randomBetween(70, 130);
        return {
          id:    i,
          x:     Math.cos(angle) * distance,
          y:     Math.sin(angle) * distance,
          size:  randomBetween(4, 8),
          color: BURST_COLORS[i % BURST_COLORS.length],
          delay: randomBetween(0, 40) * i * 0.3,
        };
      }),
    [],
  );

  return (
    <>
      {particles.map((p) => (
        <BurstDot key={p.id} {...p} trigger={trigger} />
      ))}
    </>
  );
}

function BurstDot({
  x, y, size, color, delay, trigger,
}: {
  x: number; y: number; size: number; color: string; delay: number; trigger: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!trigger) return;
    progress.value = withDelay(delay, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: progress.value * x },
      { translateY: progress.value * y },
      { scale: 1 - progress.value * 0.4 },
    ],
  }));

  return (
    <Animated.View
      style={[
        s.dot,
        style,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    />
  );
}

const s = StyleSheet.create({
  dot: {
    position: 'absolute',
    top:  '50%',
    left: '50%',
  },
});
