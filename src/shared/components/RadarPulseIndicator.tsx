import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/shared/design-system/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  // Reflete open_to_gigs — só anima quando true (é o selo de "você está
  // visível pra estabelecimentos"). null/false renderiza só o ponto central
  // apagado, sem pulso — mesmo idioma de "sem sinal" do TunerCentsMeter.
  active: boolean;
  size?:  number;
};

const DURATION = 1800;

// Motivo "radar" reaproveitado em 3 lugares (seção Disponibilidade do
// músico, seção Disponibilidade da banda, OpenToGigsDecisionSheet) — mesma
// técnica de arco animado do TunerCentsMeter (AnimatedCircle +
// useAnimatedProps), sem precisar de Skia. Dois anéis concêntricos com fase
// deslocada (0 e 0.5) simulam uma varredura contínua de radar.
export function RadarPulseIndicator({ active, size = 40 }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withRepeat(withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) }), -1, false);
    } else {
      progress.value = 0;
    }
  }, [active, progress]);

  const center = size / 2;
  const maxRadius = center - 2;

  function ringProps(phase: number) {
    return useAnimatedProps(() => {
      const t = (progress.value + phase) % 1;
      return {
        r:       2 + t * maxRadius,
        opacity: active ? (1 - t) * 0.7 : 0,
      };
    });
  }

  const ringAProps = ringProps(0);
  const ringBProps = ringProps(0.5);

  return (
    <View style={[s.root, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <AnimatedCircle cx={center} cy={center} fill="none" stroke={colors.brand.primary} strokeWidth={1.5} animatedProps={ringAProps} />
        <AnimatedCircle cx={center} cy={center} fill="none" stroke={colors.brand.primary} strokeWidth={1.5} animatedProps={ringBProps} />
        <Circle cx={center} cy={center} r={3.5} fill={active ? colors.brand.primary : colors.text.muted} />
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    alignItems:     'center',
    justifyContent: 'center',
  },
});
