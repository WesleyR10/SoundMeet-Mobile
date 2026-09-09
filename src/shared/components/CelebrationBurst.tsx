import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from '@/shared/hooks/useTheme';
import type { ThemeColors } from '@/shared/services/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const PARTICLE_COUNT = 56;
const DURATION_MS    = 1_800;

/*
 * Constante virou FUNÇÃO do tema. Como array de módulo ela era avaliada no
 * carregamento e congelava a paleta dark — as partículas continuariam neon
 * sobre um fundo claro, sem nada quebrar.
 */
const burstColors = (colors: ThemeColors) => [
  colors.accent.coral,
  colors.accent.coralDeep,
  colors.brand.primary,
  colors.accent.amber,
  '#FFFFFF',
];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

type Props = {
  /** One-shot: dispara na transição false → true. */
  trigger: boolean;
  /** Reduce motion ligado — nada é renderizado. */
  disabled?: boolean;
};

/**
 * Explosão de partículas com gravidade — a comemoração de gorjeta confirmada.
 *
 * ## Por que não reusa o `ConfettiBurst`
 *
 * Aquele é um burst radial de 10 partículas com trajetória retilínea,
 * calibrado para o reveal do QR no wizard: discreto de propósito, e continua
 * servindo ali. Este é outro efeito — 56 partículas, velocidade inicial
 * aleatória, **gravidade** e rotação própria por partícula. Trocar o
 * `ConfettiBurst` por este mudaria um momento calmo do produto; são dois
 * efeitos, não duas versões do mesmo.
 *
 * ## Física, e não `translateY` linear
 *
 * A trajetória é `y = v0*t + g*t²`: as partículas sobem, desaceleram e caem.
 * Uma interpolação linear em direção a um ponto final parece animação de
 * carregamento; a parábola é o que o olho lê como "explosão".
 */
export function CelebrationBurst({ trigger, disabled }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const particles = useMemo(
    () => {
      // Resolvida UMA vez por tema, não por partícula.
      const palette = burstColors(colors);
      return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = randomBetween(-Math.PI * 0.95, -Math.PI * 0.05);
        const speed = randomBetween(width * 0.45, width * 1.05);
        return {
          id: i,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: randomBetween(5, 12),
          color: palette[i % palette.length]!,
          delay: randomBetween(0, 220),
          spin: randomBetween(-900, 900),
          // Retângulos e quadrados misturados leem como papel picado; só
          // círculos leem como "bolinhas", que é outro efeito.
          rounded: i % 3 === 0,
        };
      });
    },
    // `colors` na lista: trocar de tema recolore o burst seguinte.
    [width, colors],
  );

  if (disabled) return null;

  return (
    <>
      {particles.map((p) => (
        <Particle key={p.id} {...p} trigger={trigger} />
      ))}
    </>
  );
}

type ParticleProps = {
  vx: number;
  vy: number;
  size: number;
  color: string;
  delay: number;
  spin: number;
  rounded: boolean;
  trigger: boolean;
};

function Particle({ vx, vy, size, color, delay, spin, rounded, trigger }: ParticleProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (!trigger) return;
    t.value = withDelay(
      delay,
      // Linear de propósito: a curva da trajetória vem da FÍSICA no
      // `useAnimatedStyle`, não do easing. Um easing por cima somaria duas
      // desacelerações e a queda ficaria em câmera lenta.
      withTiming(1, { duration: DURATION_MS, easing: Easing.linear }),
    );
  }, [trigger, delay, t]);

  const style = useAnimatedStyle(() => {
    const time = t.value;
    // Gravidade em px/s². Positivo = para baixo (eixo Y da tela).
    const gravity = 2_200;
    const seconds = time * (DURATION_MS / 1_000);

    return {
      opacity: interpolate(time, [0, 0.12, 0.75, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: vx * seconds },
        { translateY: vy * seconds + 0.5 * gravity * seconds * seconds },
        { rotate: `${spin * time}deg` },
        { scale: interpolate(time, [0, 0.15, 1], [0.4, 1, 0.85]) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.particle,
        {
          width: size,
          height: rounded ? size : size * 1.6,
          borderRadius: rounded ? size / 2 : 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

const s = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
});
