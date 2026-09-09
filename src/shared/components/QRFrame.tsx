import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { spacing, radius, gradients, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  value:  string;
  size?:  number;
  // Pausa o sweep/pulse quando fora de tela (ex.: reutilização futura no Bloco 3.1) —
  // default true porque aqui no wizard o frame nasce sempre visível.
  active?: boolean;
  // Customização PRO (Bloco 2, EditQRCodeSection) — opcional, sem afetar
  // nenhum call site existente (frame decorativo + cores default permanecem
  // o fallback quando omitidas).
  foregroundColor?: string;
  backgroundColor?: string;
  logoUrl?:          string;
};

const BEZEL_PADDING = 3;
const BRACKET       = 18;

// Cantos estilo "viewfinder" reforçando a identidade "escaneável" do frame.
function CornerBrackets({ size, stroke }: { size: number; stroke: string }) {
  const o = spacing.md; // offset a partir da borda do frame
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Path d={`M${o} ${o + BRACKET} V${o} H${o + BRACKET}`} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d={`M${size - o - BRACKET} ${o} H${size - o} V${o + BRACKET}`} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d={`M${o} ${size - o - BRACKET} V${size - o} H${o + BRACKET}`} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d={`M${size - o - BRACKET} ${size - o} H${size - o} V${size - o - BRACKET}`} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  glow: {
    position:        'absolute',
    backgroundColor: colors.accent.violet,
  },
  bezel: {
    borderRadius:   radius.xl,
    alignItems:     'center',
    justifyContent: 'center',
  },
  inner: {
    backgroundColor: colors.bg.surface,
    borderRadius:    radius.xl - BEZEL_PADDING,
    alignItems:      'center',
    justifyContent:  'center',
  },
  qrWrap: {
    backgroundColor: colors.text.primary,
    padding:          spacing.md,
    borderRadius:     radius.md,
  },
  sweepClip: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  sweepLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 24,
  },
  sweepGradient: {
    flex: 1,
  },
}));

export function QRFrame({
  value, size = 200, active = true,
  foregroundColor, backgroundColor, logoUrl,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const frameSize = size + spacing.xl * 2;

  const glowScale   = useSharedValue(1);
  const glowOpacity = useSharedValue(0.18);
  const sweepY      = useSharedValue(0);

  useEffect(() => {
    // Reduce motion reusa o MESMO caminho de repouso do `!active`, e não um
    // ramo novo: aquele já resolve para uma pose neutra em vez de congelar no
    // meio do ciclo (ver o comentário abaixo). Um ramo próprio reintroduziria
    // exatamente o artefato de faixa cortando o QR.
    if (!active || reducedMotion) {
      // cancelAnimation por si só não move o valor de volta a uma pose neutra — sem
      // isso o sweep/glow simplesmente "congela" no meio do ciclo em que estava,
      // o que produz um artefato visual (faixa de brilho cortando o QR) em capturas
      // estáticas (ex.: react-native-view-shot no Bloco 3.1). Por isso resolvemos
      // explicitamente para fora de vista antes de parar.
      cancelAnimation(glowScale);
      cancelAnimation(glowOpacity);
      cancelAnimation(sweepY);
      glowScale.value   = withTiming(1, { duration: 150 });
      glowOpacity.value = withTiming(0.18, { duration: 150 });
      sweepY.value       = withTiming(-100, { duration: 150 }); // fora da área visível do sweepClip
      return;
    }
    glowScale.value   = withRepeat(withTiming(1.08, { duration: 2600, easing: Easing.inOut(Easing.ease) }), -1, true);
    glowOpacity.value = withRepeat(withTiming(0.32,  { duration: 2600, easing: Easing.inOut(Easing.ease) }), -1, true);
    sweepY.value       = withDelay(400, withRepeat(withTiming(size, { duration: 2200, easing: Easing.linear }), -1, false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reducedMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity:   glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweepY.value }],
  }));

  return (
    <View style={[s.root, { width: frameSize, height: frameSize }]}>
      <Animated.View
        style={[s.glow, glowStyle, { width: frameSize * 1.3, height: frameSize * 1.3, borderRadius: frameSize }]}
      />

      <LinearGradient
        colors={gradients.premium}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.bezel, { width: frameSize, height: frameSize }, shadows.violet]}
      >
        <View style={[s.inner, { width: frameSize - BEZEL_PADDING * 2, height: frameSize - BEZEL_PADDING * 2 }]}>
          <CornerBrackets stroke={colors.brand.primary} size={frameSize - BEZEL_PADDING * 2} />

          <View style={s.qrWrap}>
            <QRCode
              value={value}
              size={size}
              color={foregroundColor ?? colors.text.inverse}
              backgroundColor={backgroundColor ?? 'transparent'}
              logo={logoUrl ? { uri: logoUrl } : undefined}
              logoBackgroundColor={backgroundColor ?? 'transparent'}
            />
          </View>

          <View style={[s.sweepClip, { width: size, height: size }]} pointerEvents="none">
            <Animated.View style={[s.sweepLine, sweepStyle]}>
              <LinearGradient
                colors={['rgba(0,224,184,0)', 'rgba(0,224,184,0.55)', 'rgba(0,224,184,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.sweepGradient}
              />
            </Animated.View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

