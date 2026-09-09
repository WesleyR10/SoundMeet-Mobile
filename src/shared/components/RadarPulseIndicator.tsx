import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/hooks/useTheme';
import Animated, { useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

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
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active && !reducedMotion) {
      progress.value = withRepeat(withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) }), -1, false);
      return;
    }
    // 🔴 Com reduce motion o anel para num raio INTERMEDIÁRIO, não em 0.
    // `progress = 0` é o estado de "inativo" (sem sinal): congelar ali faria
    // o selo de "aberto a shows" dizer o oposto do que o dado diz. O ponto
    // central continua aceso pelo `active`, e o anel fica como halo estático.
    progress.value = active ? 0.5 : 0;
  }, [active, reducedMotion, progress]);

  const center = size / 2;
  const maxRadius = center - 2;

  /*
   * Os dois `useAnimatedProps` são chamados DIRETO no corpo do componente, e
   * não por uma função `ringProps(phase)` que os embrulhava.
   *
   * Aquela versão funcionava — as duas chamadas aconteciam na mesma ordem em
   * todo render —, mas violava as regras dos hooks: `ringProps` é uma função
   * comum, não um componente nem um hook, e o React não tem como garantir a
   * ordem se alguém a tornasse condicional ou a chamasse num laço. Era um
   * defeito latente, do tipo que só aparece na edição seguinte.
   *
   * Duplicar quatro linhas é mais barato que um hook customizado só para dois
   * call sites com uma constante de diferença.
   */
  const ringAProps = useAnimatedProps(() => {
    const t = progress.value % 1;
    return { r: 2 + t * maxRadius, opacity: active ? (1 - t) * 0.7 : 0 };
  });

  const ringBProps = useAnimatedProps(() => {
    // Meia fase à frente — é o que dá a sensação de varredura contínua.
    const t = (progress.value + 0.5) % 1;
    return { r: 2 + t * maxRadius, opacity: active ? (1 - t) * 0.7 : 0 };
  });

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
