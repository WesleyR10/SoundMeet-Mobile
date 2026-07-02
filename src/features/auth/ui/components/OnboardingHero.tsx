import { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, shadows } from '@/shared/design-system/tokens';
import { EqBar } from '@/shared/components/EqBar';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOGO = require('../../../../../assets/logo/logo_verde-removebg-preview.png');

const RING_OUTER = 220;
const RING_INNER = 270;
const RING_BOX   = RING_INNER;

const MINI_EQ_BARS = [
  { h: 14, c: colors.brand.primary, dur: 1000, d: 0   },
  { h: 26, c: colors.brand.primary, dur: 1200, d: 150 },
  { h: 34, c: colors.brand.primary, dur: 900,  d: 50  },
  { h: 20, c: colors.accent.coral,  dur: 1300, d: 250 },
  { h: 30, c: colors.brand.primary, dur: 1100, d: 350 },
  { h: 16, c: colors.brand.primary, dur: 1000, d: 200 },
  { h: 28, c: colors.brand.primary, dur: 1250, d: 100 },
] as const;

export function OnboardingHero() {
  const rotOuter    = useSharedValue(0);
  const rotInner    = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale   = useSharedValue(0.72);

  useEffect(() => {
    rotOuter.value    = withRepeat(withTiming(360,  { duration: 7000  }), -1, false);
    rotInner.value    = withRepeat(withTiming(-360, { duration: 11000 }), -1, false);
    logoOpacity.value = withDelay(80, withTiming(1, { duration: 300 }));
    logoScale.value   = withDelay(80, withSpring(1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringOuterStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotOuter.value}deg` }],
  }));
  const ringInnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotInner.value}deg` }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity:   logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={s.hero}>
      <Animated.View style={[s.ringOuter, ringOuterStyle]} />
      <Animated.View style={[s.ringInner, ringInnerStyle]} />

      <Animated.View style={[s.logoBlock, logoStyle]}>
        <View style={s.logoWrapper}>
          {/* Logo levemente desfocada atrás — cria camada de profundidade */}
          <Image source={LOGO} style={[s.logoImg, s.logoBlur]} resizeMode="contain" blurRadius={3} />
          {/* Logo nítida em cima, levemente transparente para fundir com a camada desfocada */}
          <Image source={LOGO} style={[s.logoImg, s.logoSharp]} resizeMode="contain" />
        </View>
        <View style={s.miniEq}>
          {MINI_EQ_BARS.map((bar, i) => (
            <EqBar key={i} color={bar.c} height={bar.h} duration={bar.dur} delay={bar.d} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  hero: {
    height:         RING_BOX + spacing.xl,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      spacing.xl,
  },
  ringOuter: {
    position:          'absolute',
    width:              RING_OUTER,
    height:             RING_OUTER,
    borderRadius:       RING_OUTER / 2,
    borderWidth:        1,
    borderTopColor:    'rgba(0,224,184,0.60)',
    borderRightColor:  'rgba(0,224,184,0.18)',
    borderBottomColor: 'rgba(0,224,184,0.18)',
    borderLeftColor:   'rgba(0,224,184,0.18)',
  },
  ringInner: {
    position:          'absolute',
    width:              RING_INNER,
    height:             RING_INNER,
    borderRadius:       RING_INNER / 2,
    borderWidth:        1,
    borderTopColor:    'rgba(124,58,237,0.0)',
    borderRightColor:  'rgba(124,58,237,0.14)',
    borderBottomColor: 'rgba(124,58,237,0.45)',
    borderLeftColor:   'rgba(124,58,237,0.14)',
  },
  logoBlock: {
    alignItems: 'center',
    gap:         spacing.md,
  },
  logoWrapper: {
    width:  148,
    height:  88,
  },
  logoImg: {
    width:  148,
    height:  88,
    ...shadows.brand,
  },
  logoBlur: {
    position: 'absolute',
    opacity:  0.55,
  },
  logoSharp: {
    opacity: 0.97,
  },
  miniEq: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    gap:             4,
    height:          34,
  },
});
