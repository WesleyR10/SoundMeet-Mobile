import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/shared/hooks/useTheme';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, interpolateColor, interpolate, Extrapolation,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SW = Dimensions.get('window').width; // módulo level — portrait-only, seguro (regra NativeWind, CLAUDE.md)

const SIZE = Math.min(SW * 0.7, 280);
const STROKE = 8;
const RADIUS = SIZE / 2 - STROKE;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Arco radial com glow (Bloco 8.3 — referência visual em Docs/refs-front.md,
// decisão do usuário) em vez de agulha reta: cobre só a faixa útil de cents
// (-50..+50), mapeada num arco de 120° centrado no topo (0 cents = 12h).
// Mesma técnica de WizardProgress.tsx (strokeDasharray/strokeDashoffset
// animados via useAnimatedProps), adaptada de barra linear pra círculo.
const ARC_SPAN_DEG = 120;
const SEGMENT_DEG = 14; // largura do segmento "aceso" que se move pelo arco
const MAX_CENTS = 50;
// Meio-ângulo utilizável pro CENTRO do segmento — reduzido pela metade da
// largura do segmento, senão em ±MAX_CENTS a ponta do segmento (que tem
// largura própria) ultrapassaria visualmente o trilho de fundo de 120°.
const USABLE_HALF_SPAN_DEG = ARC_SPAN_DEG / 2 - SEGMENT_DEG / 2;

// <Circle> do SVG começa o traço às 3h (ângulo 0) e desenha em sentido
// horário — 12h (topo) fica a 270° desse referencial. `d` abaixo é medido em
// graus a partir do topo, sentido horário positivo (direita = agudo).
function pathFractionAtTopRelativeDeg(d: number): number {
  'worklet';
  const normalized = ((270 + d) % 360 + 360) % 360;
  return normalized / 360;
}

function arcDashOffset(startDeg: number): number {
  'worklet';
  return -pathFractionAtTopRelativeDeg(startDeg) * CIRCUMFERENCE;
}

const BG_DASHARRAY = `${(ARC_SPAN_DEG / 360) * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
const BG_DASHOFFSET = arcDashOffset(-ARC_SPAN_DEG / 2);
const SEGMENT_DASHARRAY = `${(SEGMENT_DEG / 360) * CIRCUMFERENCE} ${CIRCUMFERENCE}`;

type Props = {
  // `null` = ainda sem leitura confirmada (ver useTunerPitch.ts) — tratado
  // como "sem sinal" aqui, nunca como 0 cents (que pareceria "afinado").
  cents:     number | null;
  hasSignal: boolean;
};

export function TunerCentsMeter({ cents, hasSignal }: Props) {
  const { colors } = useTheme();
  const animatedCents = useSharedValue(0);
  const active = hasSignal && cents !== null;

  useEffect(() => {
    animatedCents.value = withTiming(active ? cents! : 0, { duration: 120 });
  }, [cents, active, animatedCents]);

  const segmentProps = useAnimatedProps(() => {
    const clamped = Math.max(-MAX_CENTS, Math.min(MAX_CENTS, animatedCents.value));
    const angleDeg = (clamped / MAX_CENTS) * USABLE_HALF_SPAN_DEG;
    const abs = Math.abs(clamped);

    return {
      strokeDashoffset: arcDashOffset(angleDeg - SEGMENT_DEG / 2),
      stroke: interpolateColor(abs, [0, 15, MAX_CENTS], [colors.status.success, colors.status.warning, colors.accent.coral]),
      strokeWidth: interpolate(abs, [0, MAX_CENTS], [STROKE + 2, STROKE - 3], Extrapolation.CLAMP),
      opacity: active ? 1 : 0.25,
    };
  });

  return (
    <View style={s.root}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.border.default}
          strokeWidth={4}
          fill="none"
          strokeDasharray={BG_DASHARRAY}
          strokeDashoffset={BG_DASHOFFSET}
          strokeLinecap="round"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeDasharray={SEGMENT_DASHARRAY}
          strokeLinecap="round"
          animatedProps={segmentProps}
        />
        {/* marca central (topo) — referência "afinado" */}
        <Circle cx={SIZE / 2} cy={SIZE / 2 - RADIUS} r={3} fill={colors.text.secondary} />
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
