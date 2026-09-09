import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/shared/hooks/useTheme';
import Animated, { useAnimatedStyle, interpolateColor, type SharedValue } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

import { Particle } from '@/shared/components/Particle';

const SW = Dimensions.get('window').width;
const SH = Dimensions.get('window').height;

type Props = {
  // 0 (step 1, teal) → 1 (step 5, violeta) — mesmo SharedValue que dirige o
  // WizardProgress, garantindo que os dois fiquem sincronizados sem duplicar timing.
  progress: SharedValue<number>;
  step:     1 | 2 | 3 | 4 | 5;
};

// Diferente do AuthGlowBackground (Register/RoleSelection): aqui o glow migra de
// teal para violeta ao longo dos steps — a "narrativa" de progressão até o reveal
// premium do QR — e ganha uma grade holográfica sutil em SVG, algo que nenhuma
// outra tela do fluxo de auth usa.
export function WizardBackground({ progress, step }: Props) {
  const { colors } = useTheme();
  const topGlowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 0.5, 1],
      [colors.brand.glow, 'rgba(77,156,255,0.16)', 'rgba(124,58,237,0.22)'],
    ),
  }));

  const bottomGlowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 0.5, 1],
      ['rgba(0,224,184,0.10)', 'rgba(77,156,255,0.10)', 'rgba(124,58,237,0.14)'],
    ),
  }));

  // step é estado JS discreto (não SharedValue) — cor da grade e das partículas
  // acompanha o degrau atual, não a animação contínua do glow.
  const emphasizeViolet = step >= 2;
  const gridColor     = emphasizeViolet ? `${colors.accent.violet}0A` : `${colors.brand.primary}0A`;
  const particleColor = emphasizeViolet ? colors.accent.violet : colors.brand.primary;

  return (
    <View style={s.layer} pointerEvents="none">
      <Animated.View style={[s.glow, topGlowStyle, { top: -120, right: -90, width: 340, height: 340 }]} />
      <Animated.View style={[s.glow, bottomGlowStyle, { bottom: -100, left: -110, width: 300, height: 300 }]} />

      <ScanGrid color={gridColor} />

      <Particle top={110} left={26}        size={4} color={particleColor} duration={4600} delay={0} />
      <Particle top={SH * 0.30} right={20} size={5} color={particleColor} duration={5200} delay={500} />
      <Particle top={SH * 0.55} left={16}  size={4} color={particleColor} duration={4800} delay={900} />
    </View>
  );
}

// 6 linhas diagonais bem sutis (~4% opacidade) reforçando o tom "holográfico" do
// design system ("Matrix encontra show ao vivo") — distinto de qualquer outro
// background do app, que usam só glow + partículas.
function ScanGrid({ color }: { color: string }) {
  return (
    <Svg width={SW} height={SH} style={StyleSheet.absoluteFill}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Line
          key={i}
          x1={-100}
          y1={i * (SH / 5) - 60}
          x2={SW + 100}
          y2={i * (SH / 5) + 140}
          stroke={color}
          strokeWidth={1}
        />
      ))}
    </Svg>
  );
}

const s = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  glow: {
    position:     'absolute',
    borderRadius: 9999,
  },
});
