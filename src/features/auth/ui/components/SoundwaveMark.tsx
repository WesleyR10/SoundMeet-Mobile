import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/shared/hooks/useTheme';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

/*
 * A logo, viva. Geometria medida em `assets/logo/logo-verde.png`: cinco barras
 * por lado crescendo até o centro e o ponto do "encontro" entre as duas mais
 * altas — "Frequência • Conexão" (design-system.md). A onda nasce no ponto e
 * se propaga para fora: o som sai de onde as pessoas se encontram.
 *
 * Reage ao que acontece na tela, sem virar enfeite solto:
 *  - `energy` (0..1, empurrado a cada tecla) abre a onda — a tela "escuta";
 *  - `busy` acelera, como um medidor de nível enquanto o login vai e volta;
 *  - `alarmSignal` (muda a cada recusa) clipa em coral e treme.
 *
 * Não há animação de sucesso de propósito: quando a sessão abre, o
 * `RootNavigator` troca de stack no mesmo instante e ela nunca seria vista.
 */
const PROFILE = [1, 0.72, 0.48, 0.3, 0.16] as const; // do centro para fora
const MAX_HEIGHT = 112;
const BAR_WIDTH = 7;
const BAR_GAP = 13;
const CORE_SIZE = 34;
const DOT_SIZE = 14;
const IDLE_AMPLITUDE = 0.2;
const BUSY_AMPLITUDE = 0.5;
const BUSY_SPEED = 3.4;

type Props = {
  energy:      SharedValue<number>;
  busy:        boolean;
  alarmSignal: number;
};

type BarProps = {
  distance: number;
  clock:    SharedValue<number>;
  amp:      SharedValue<number>;
  intro:    SharedValue<number>;
  energy:   SharedValue<number>;
  alarm:    SharedValue<number>;
};

function WaveBar({ distance, clock, amp, intro, energy, alarm }: BarProps) {
  const { colors } = useTheme();
  const profile = PROFILE[distance];

  const style = useAnimatedStyle(() => {
    // Cada barra entra um pouco depois da vizinha de dentro (0..1 → por barra).
    const reveal = Math.min(Math.max(intro.value * 5 - distance, 0), 1);
    const wave = 0.5 + 0.5 * Math.sin(clock.value * 2.4 - distance * 0.9);
    const breathing = 1 - amp.value + amp.value * wave;
    // As barras curtas crescem mais com a energia: a onda "abre" a partir das bordas.
    const lift = energy.value * (1 - profile) * 0.8;
    const level = Math.min(profile * breathing + lift, 1) * (1 - alarm.value * 0.45);
    const height = MAX_HEIGHT * level * reveal;

    return {
      height:          Math.max(height, BAR_WIDTH * reveal),
      backgroundColor: interpolateColor(alarm.value, [0, 1], [colors.brand.primary, colors.accent.coral]),
    };
  });

  return <Animated.View style={[s.bar, style]} />;
}

function WaveCore({ intro, energy, alarm }: Pick<BarProps, 'intro' | 'energy' | 'alarm'>) {
  const { colors } = useTheme();

  const dotStyle = useAnimatedStyle(() => ({
    transform:       [{ scale: Math.min(intro.value * 1.4, 1) * (1 + energy.value * 0.35) }],
    backgroundColor: interpolateColor(alarm.value, [0, 1], [colors.brand.primary, colors.accent.coral]),
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity:     intro.value * (0.35 + energy.value * 0.5),
    transform:   [{ scale: 0.7 + intro.value * 0.3 + energy.value * 0.25 }],
    borderColor: interpolateColor(alarm.value, [0, 1], [colors.brand.primary, colors.accent.coral]),
  }));

  return (
    <View style={s.core}>
      <Animated.View style={[s.ring, ringStyle]} />
      <Animated.View style={[s.dot, dotStyle]} />
    </View>
  );
}

export function SoundwaveMark({ energy, busy, alarmSignal }: Props) {
  const reducedMotion = useReducedMotion();
  const clock = useSharedValue(0);
  const speed = useSharedValue(1);
  const amp = useSharedValue(IDLE_AMPLITUDE);
  const intro = useSharedValue(0);
  const alarm = useSharedValue(0);
  const shake = useSharedValue(0);

  // Relógio próprio em vez de `withRepeat`: a velocidade muda no meio do
  // caminho (busy) sem a onda dar salto de fase.
  const ticker = useFrameCallback((frame) => {
    clock.value += ((frame.timeSincePreviousFrame ?? 16) / 1000) * speed.value;
  }, false);

  useEffect(() => {
    // Reduzir movimento: a logo aparece inteira e parada — é marca, não enfeite.
    ticker.setActive(!reducedMotion);
    intro.value = reducedMotion
      ? 1
      : withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  useEffect(() => {
    speed.value = withTiming(busy ? BUSY_SPEED : 1, { duration: 400 });
    amp.value = withTiming(busy ? BUSY_AMPLITUDE : IDLE_AMPLITUDE, { duration: 400 });
  }, [busy, speed, amp]);

  useEffect(() => {
    if (alarmSignal === 0) return;
    // A cor muda mesmo com "reduzir movimento": é informação, não movimento.
    alarm.value = withSequence(
      withTiming(1, { duration: 120 }),
      withDelay(900, withTiming(0, { duration: 600 })),
    );
    if (!reducedMotion) {
      shake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 70 }),
        withTiming(-6, { duration: 60 }),
        withSpring(0, { damping: 6, stiffness: 260 }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarmSignal]);

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const side = (mirrored: boolean) => {
    const order = mirrored ? [0, 1, 2, 3, 4] : [4, 3, 2, 1, 0];
    return order.map((distance) => (
      <WaveBar
        key={`${mirrored ? 'r' : 'l'}${distance}`}
        distance={distance}
        clock={clock}
        amp={amp}
        intro={intro}
        energy={energy}
        alarm={alarm}
      />
    ));
  };

  return (
    <Animated.View
      style={[s.row, rowStyle]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {side(false)}
      <WaveCore intro={intro} energy={energy} alarm={alarm} />
      {side(true)}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  row: {
    height:         MAX_HEIGHT,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            BAR_GAP,
  },
  bar: {
    width:        BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
  },
  core: {
    width:          CORE_SIZE,
    height:         CORE_SIZE,
    alignItems:     'center',
    justifyContent: 'center',
  },
  ring: {
    position:     'absolute',
    width:        CORE_SIZE,
    height:       CORE_SIZE,
    borderRadius: CORE_SIZE / 2,
    borderWidth:  2,
  },
  dot: {
    width:        DOT_SIZE,
    height:       DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
