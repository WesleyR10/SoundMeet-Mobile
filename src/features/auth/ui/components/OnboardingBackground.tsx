import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/shared/hooks/useTheme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { EqBar }    from '@/shared/components/EqBar';
import { Particle } from '@/shared/components/Particle';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

// App é portrait-only (app.json) — largura não muda
const SW = Dimensions.get('window').width;

export function OnboardingBackground() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const glowOpacity = useSharedValue(0.12);
  const glowScale   = useSharedValue(1);

  useEffect(() => {
    // Primeira tela do app inteiro. Parado no meio da faixa — o gradiente
    // segue compondo o fundo, sem respirar atrás do carrossel.
    if (reducedMotion) {
      glowOpacity.value = 0.18;
      glowScale.value   = 1;
      return;
    }
    glowOpacity.value = withRepeat(withTiming(0.24, { duration: 5000 }), -1, true);
    glowScale.value   = withRepeat(withTiming(1.08, { duration: 5000 }), -1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity:   glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <View style={s.layer} pointerEvents="none">
      {/* Ambient glows */}
      <Animated.View
        style={[
          s.glow,
          glowStyle,
          { top: -90, left: SW / 2 - 180, width: 360, height: 360, backgroundColor: 'rgba(0,224,184,0.22)' },
        ]}
      />
      <View style={[s.glow, { bottom: 100, right: -120, width: 300, height: 300, backgroundColor: 'rgba(124,58,237,0.18)' }]} />
      <View style={[s.glow, { bottom: -70, left: -90,   width: 260, height: 260, backgroundColor: 'rgba(0,224,184,0.11)' }]} />

      {/* Floating particles */}
      <Particle top={155} left={42}  size={7} color={colors.brand.primary} duration={4500} delay={0}    />
      <Particle top={235} right={48} size={5} color={colors.accent.coral}  duration={5500} delay={600}  />
      <Particle top={115} right={70} size={4} color={colors.brand.primary} duration={6000} delay={1200} />
      <Particle top={295} left={64}  size={5} color={colors.accent.amber}  duration={5000} delay={900}  />

      {/* Left eq bars — teal */}
      <View style={[s.eqSide, { left: 14 }]}>
        <EqBar color={colors.brand.primary} height={34} duration={1300} delay={0}   />
        <EqBar color={colors.brand.primary} height={54} duration={1700} delay={200} />
        <EqBar color={colors.brand.primary} height={40} duration={1100} delay={400} />
      </View>

      {/* Right eq bars — violet */}
      <View style={[s.eqSide, { right: 14 }]}>
        <EqBar color={colors.accent.violet} height={44} duration={1500} delay={300} />
        <EqBar color={colors.accent.violet} height={30} duration={1200} delay={100} />
        <EqBar color={colors.accent.violet} height={50} duration={1800} delay={500} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  glow: {
    position:    'absolute',
    borderRadius: 9999,
  },
  eqSide: {
    position:       'absolute',
    top:             0,
    bottom:          0,
    alignItems:     'center',
    justifyContent: 'center',
    gap:             6,
    opacity:         0.5,
  },
});
