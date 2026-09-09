import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/hooks/useTheme';
import type { ThemeColors } from '@/shared/services/ThemeContext';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

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
// Constante virou FUNÇÃO do tema: como array de módulo ela era avaliada no
// carregamento e congelava a paleta dark — as partículas continuariam
// neon sobre um fundo claro.
const defaultGlows = (colors: ThemeColors): GlowSpec[] => ([
  { color: colors.brand.glow,          size: 320, top: -120, left: -80, duration: 7000 },
  { color: 'rgba(124,58,237,0.16)',    size: 300, bottom: -100, right: -90, duration: 9000 },
]);

// Mesma técnica do glow de WizardBackground/QRFrame (círculo translúcido +
// pulso de opacity/scale via Reanimated) — RN não tem blur/radial-gradient
// nativo barato, então a cor já vem semi-transparente da paleta.
function Glow({ spec }: { spec: GlowSpec }) {
  // `Glow` é helper NÃO exportado, e por isso chama o hook por conta própria —
  // mesmo padrão registrado no CLAUDE.md para QRFrame/ResultList: o hook do
  // componente exportado não alcança este escopo.
  const reducedMotion = useReducedMotion();
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    // Este é o fundo de MUITAS telas (é o `AmbientGlowBackground`), então o
    // pulso lento fica no canto do olho o tempo todo — o caso clássico de
    // desconforto vestibular. Parado no meio da faixa: o gradiente continua
    // compondo a tela, sem respirar.
    if (reducedMotion) {
      scale.value   = 1;
      opacity.value = 0.65;
      return;
    }
    const duration = spec.duration ?? 8000;
    scale.value   = withRepeat(withTiming(1.08, { duration, easing: Easing.inOut(Easing.ease) }), -1, true);
    opacity.value = withRepeat(withTiming(0.85, { duration, easing: Easing.inOut(Easing.ease) }), -1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

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
export function AmbientGlowBackground({ glows }: Props) {
  const { colors } = useTheme();
  // Default no CORPO, não na assinatura: ali o `colors` do hook não existe.
  const specs = glows ?? defaultGlows(colors);
  return (
    <View style={s.layer} pointerEvents="none">
      {specs.map((spec, i) => (
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
