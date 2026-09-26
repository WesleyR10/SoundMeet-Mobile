import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/shared/hooks/useTheme';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

// App é portrait-only (app.json) — dimensões constantes no nível do módulo.
const { width: SW, height: SH } = Dimensions.get('window');
const BEAM_WIDTH = SW * 0.42;
const BEAM_LENGTH = SH * 0.95;
const SWEEP_MS = 7000;

type BeamProps = {
  side:  'left' | 'right';
  color: string;
  delay: number;
};

/*
 * Um feixe de refletor preso no alto da tela, girando devagar em torno do
 * próprio ponto de fixação — como a luz de palco antes do show começar.
 * Opacidade baixa de propósito: o feixe é clima, e passa ATRÁS do formulário.
 */
function Beam({ side, color, delay }: BeamProps) {
  const reducedMotion = useReducedMotion();
  const sweep = useSharedValue(0.5);
  const direction = side === 'left' ? 1 : -1;

  useEffect(() => {
    // Reduzir movimento: o feixe fica parado no meio do arco.
    if (reducedMotion) {
      sweep.value = 0.5;
      return;
    }
    sweep.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: SWEEP_MS, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity:   0.55 + sweep.value * 0.3,
    transform: [{ rotate: `${direction * (10 + sweep.value * 14)}deg` }],
  }));

  return (
    <Animated.View
      style={[
        s.beam,
        side === 'left' ? { left: SW * 0.02 } : { right: SW * 0.02 },
        style,
      ]}
    >
      <LinearGradient colors={[color, 'transparent']} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

export function StageLightsBackground() {
  const { colors } = useTheme();

  return (
    <View style={s.layer} pointerEvents="none">
      <Beam side="left" color={colors.brand.glow} delay={0} />
      <Beam side="right" color={`${colors.accent.violet}33`} delay={1400} />
    </View>
  );
}

const s = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
  },
  beam: {
    position:                'absolute',
    top:                     -BEAM_LENGTH * 0.08,
    width:                   BEAM_WIDTH,
    height:                  BEAM_LENGTH,
    transformOrigin:         'top',
    borderBottomLeftRadius:  BEAM_WIDTH,
    borderBottomRightRadius: BEAM_WIDTH,
    overflow:                'hidden',
  },
});
