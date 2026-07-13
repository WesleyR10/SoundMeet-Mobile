import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '@/shared/design-system/tokens';
import { EqBar }    from '@/shared/components/EqBar';
import { Particle } from '@/shared/components/Particle';
import type { RegisterRole } from '@/features/auth/domain/auth.types';

// App é portrait-only (app.json) — largura não muda
const SW = Dimensions.get('window').width;

const ROLE_STEP: Record<'none' | RegisterRole, number> = {
  none:     0,
  musician: 1,
  audience: 2,
};

type Props = {
  // 'full' (RoleSelection — tela sem input) inclui eq bars; 'subtle' (Register —
  // tela com formulário) reduz decoração para não competir com o foco no teclado
  variant?: 'full' | 'subtle';
  // Recolore/intensifica o glow assim que um role é escolhido — reação instantânea
  // (puro Reanimated, sem vídeo/decode nativo) pro "muda o clima" do RoleSelectionScreen.
  role?: RegisterRole | null;
};

export function AuthGlowBackground({ variant = 'full', role = null }: Props) {
  const glowOpacity = useSharedValue(0.10);
  const glowScale   = useSharedValue(1);
  const roleStep    = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withRepeat(withTiming(0.22, { duration: 5500 }), -1, true);
    glowScale.value   = withRepeat(withTiming(1.07, { duration: 5500 }), -1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    roleStep.value = withTiming(ROLE_STEP[role ?? 'none'], { duration: 420 });
  }, [role, roleStep]);

  const glowStyle = useAnimatedStyle(() => {
    const boost = interpolate(roleStep.value, [0, 1, 2], [1, 1.6, 1.6]);
    return {
      opacity:   glowOpacity.value * boost,
      transform: [{ scale: glowScale.value * interpolate(roleStep.value, [0, 1, 2], [1, 1.08, 1.08]) }],
      backgroundColor: interpolateColor(
        roleStep.value,
        [0, 1, 2],
        [colors.brand.glow, colors.brand.glow, 'rgba(255,107,107,0.24)'],
      ),
    };
  });

  const violetGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(roleStep.value, [0, 1, 2], [1, 1, 1.3]),
  }));

  return (
    <View style={s.layer} pointerEvents="none">
      <Animated.View style={[s.glow, glowStyle, { top: -110, right: -80, width: 320, height: 320 }]} />
      <Animated.View
        style={[
          s.glow,
          violetGlowStyle,
          { bottom: -90, left: -100, width: 280, height: 280, backgroundColor: `${colors.accent.violet}26` },
        ]}
      />

      <Particle top={130} left={30}      size={5} color={colors.brand.primary} duration={5000} delay={0}   />
      <Particle top={220} right={SW - 300} size={4} color={colors.accent.coral} duration={5800} delay={700} />

      {variant === 'full' && (
        <View style={[s.eqSide, { right: 12 }]}>
          <EqBar color={colors.brand.primary} height={30} duration={1400} delay={0}   />
          <EqBar color={colors.accent.violet} height={46} duration={1700} delay={250} />
          <EqBar color={colors.brand.primary} height={36} duration={1200} delay={450} />
        </View>
      )}
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
    top:             '38%',
    alignItems:     'center',
    justifyContent: 'center',
    gap:             6,
    opacity:         0.35,
  },
});
