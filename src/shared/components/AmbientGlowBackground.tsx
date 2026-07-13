import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '@/shared/design-system/tokens';

type GlowSpec = {
  color:     string;
  size:      number;
  top?:      number;
  bottom?:   number;
  left?:     number;
  right?:    number;
  duration?: number;
};

type Props = {
  glows?: GlowSpec[];
};

// Padrão teal (topo-esquerda) + violeta (baixo-direita) dos mockups de
// referência (Home do Músico / Perfil do Músico — Claude Design/project/).
const DEFAULT_GLOWS: GlowSpec[] = [
  { color: colors.brand.glow,          size: 320, top: -120, left: -80, duration: 7000 },
  { color: 'rgba(124,58,237,0.16)',    size: 300, bottom: -100, right: -90, duration: 9000 },
];

// Mesma técnica do glow de WizardBackground/QRFrame (círculo translúcido +
// pulso de opacity/scale via Reanimated) — RN não tem blur/radial-gradient
// nativo barato, então a cor já vem semi-transparente da paleta.
function Glow({ spec }: { spec: GlowSpec }) {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    const duration = spec.duration ?? 8000;
    scale.value   = withRepeat(withTiming(1.08, { duration, easing: Easing.inOut(Easing.ease) }), -1, true);
    opacity.value = withRepeat(withTiming(0.85, { duration, easing: Easing.inOut(Easing.ease) }), -1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        s.glow,
        style,
        {
          width:            spec.size,
          height:           spec.size,
          borderRadius:     spec.size,
          backgroundColor: spec.color,
          top:    spec.top,
          bottom: spec.bottom,
          left:   spec.left,
          right:  spec.right,
        },
      ]}
    />
  );
}

// Background ambiente reutilizável (ViewProfileScreen/EditProfileScreen, Bloco 2)
// — distinto do WizardBackground, que é acoplado ao SharedValue de progresso do
// wizard e migra de cor conforme o step.
export function AmbientGlowBackground({ glows = DEFAULT_GLOWS }: Props) {
  return (
    <View style={s.layer} pointerEvents="none">
      {glows.map((spec, i) => (
        <Glow key={i} spec={spec} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  glow: {
    position: 'absolute',
  },
});
