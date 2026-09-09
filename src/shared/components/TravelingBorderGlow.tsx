import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type Props = {
  width:        number;
  height:       number;
  radius:       number;
  color:        string;
  active:       boolean;
  strokeWidth?: number;
};

// Segmento de luz que percorre o perímetro do input enquanto ele está em foco —
// efeito "LED de carro" sobre a borda estática já existente (FormField).
export function TravelingBorderGlow({ width, height, radius, color, active, strokeWidth = 2 }: Props) {
  const perimeter = 2 * (width + height - 2 * radius) + 2 * Math.PI * radius;
  const segment    = perimeter * 0.22;

  const reducedMotion = useReducedMotion();
  const dashOffset = useSharedValue(0);
  const opacity     = useSharedValue(0);

  useEffect(() => {
    if (active && perimeter > 0) {
      // 🔴 Este é um indicador de FOCO, não decoração: sob reduce motion ele
      // para de percorrer a borda mas CONTINUA aceso. Apagá-lo junto com o
      // movimento tiraria do usuário a única marca de qual campo está em foco
      // — trocaria desconforto por navegação quebrada.
      if (!reducedMotion) {
        dashOffset.value = withRepeat(
          withTiming(-perimeter, { duration: 3600, easing: Easing.linear }),
          -1,
          false,
        );
      }
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      opacity.value = withTiming(0, { duration: 180 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, perimeter, reducedMotion]);

  const layerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  if (width <= 0 || height <= 0) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, layerStyle]} pointerEvents="none">
      <Svg width={width} height={height}>
        <AnimatedRect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={width - strokeWidth}
          height={height - strokeWidth}
          rx={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${segment} ${perimeter - segment}`}
          animatedProps={animatedProps}
        />
      </Svg>
    </Animated.View>
  );
}
