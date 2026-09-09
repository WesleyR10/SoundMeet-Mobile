import { useEffect, useRef, useState } from 'react';
import { Dimensions, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
} from 'react-native-reanimated';
import { spacing, radius, shadows, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { OnboardingBackground } from '../components/OnboardingBackground';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { OnboardingHero }       from '../components/OnboardingHero';
import { SlideCarousel, SLIDE_COUNT } from '../components/SlideCarousel';
import type { AuthScreenProps } from '@/navigation/types';

const SLIDE_INTERVAL_MS = 4500;
const SW = Dimensions.get('window').width;

type Props = AuthScreenProps<'Onboarding'>;

const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  wordmarkBlock: {
    alignItems:        'center',
    paddingHorizontal:  spacing.xl,
    marginBottom:       spacing.xl,
  },
  wordmark: {
    ...typography.displayMd,
    fontFamily:    'SpaceGrotesk-Bold',
    color:          colors.text.primary,
    letterSpacing:  1,
    marginBottom:   spacing.xs,
  },
  wordmarkTeal: {
    color: colors.brand.primary,
  },
  tagline: {
    ...typography.caption,
    fontFamily:    'Inter-SemiBold',
    letterSpacing: 2,
    color:         'rgba(0,224,184,0.85)',
    textTransform: 'uppercase',
  },
  ctaBlock: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
    gap:               spacing.lg,
    marginTop:         'auto',
  },
  ctaBtn: {
    height:          60,
    borderRadius:    radius.xl,
    backgroundColor: colors.brand.primary,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:              spacing.sm,
    overflow:        'hidden',
    ...shadows.brand,
  },
  ctaBtnPressed: {
    backgroundColor: colors.brand.dark,
    transform:       [{ scale: 0.98 }],
  },
  shimmer: {
    position:        'absolute',
    top:              0,
    bottom:           0,
    width:            56,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  ctaText: {
    ...typography.bodyLg,
    fontFamily:    'SpaceGrotesk-Bold',
    letterSpacing:  1.5,
    color:          colors.text.inverse,
  },
  loginRow: {
    ...typography.body,
    color:     'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  loginLink: {
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
}));

export function OnboardingScreen({ navigation }: Props) {
  const s = useStyles();
  const [slide, setSlide] = useState(0);
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null);

  const reducedMotion = useReducedMotion();
  // Entrance animations
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkY       = useSharedValue(14);
  const ctaOpacity      = useSharedValue(0);
  const ctaY            = useSharedValue(20);
  const shimmerX        = useSharedValue(-(SW * 0.6));

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setSlide(n => (n + 1) % SLIDE_COUNT),
      SLIDE_INTERVAL_MS,
    );
  };

  useEffect(() => {
    resetTimer();
    wordmarkOpacity.value = withDelay(350, withTiming(1,  { duration: 500 }));
    wordmarkY.value       = withDelay(350, withTiming(0,  { duration: 500 }));
    ctaOpacity.value      = withDelay(700, withTiming(1,  { duration: 500 }));
    ctaY.value            = withDelay(700, withTiming(0,  { duration: 500 }));
    // Só o SHIMMER para. As entradas acima (wordmark, CTA) continuam: são
    // transições únicas e curtas de chegada de conteúdo, não movimento
    // ambiente — desligá-las faria a tela aparecer estalada, sem ganho para
    // quem pediu menos movimento.
    if (!reducedMotion) {
      shimmerX.value = withRepeat(withTiming(SW * 0.9, { duration: 3200 }), -1, false);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (n: number) => { setSlide(n); resetTimer(); };

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity:   wordmarkOpacity.value,
    transform: [{ translateY: wordmarkY.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity:   ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      <OnboardingBackground />
      <OnboardingHero />

      <Animated.View style={[s.wordmarkBlock, wordmarkStyle]}>
        <Text style={s.wordmark}>
          Sound<Text style={s.wordmarkTeal}>Meet</Text>
        </Text>
        <Text style={s.tagline}>Onde o som encontra pessoas</Text>
      </Animated.View>

      <SlideCarousel slide={slide} onGoto={goTo} />

      <Animated.View style={[s.ctaBlock, ctaStyle]}>
        <Pressable
          onPress={() => navigation.navigate('RoleSelection')}
          style={({ pressed }) => [s.ctaBtn, pressed && s.ctaBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Começar no SoundMeet"
        >
          <Animated.View style={[s.shimmer, shimmerStyle]} />
          <Text style={s.ctaText}>COMEÇAR</Text>
        </Pressable>

        <Text style={s.loginRow}>
          Já tenho conta ·{' '}
          <Text
            style={s.loginLink}
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="link"
          >
            Entrar
          </Text>
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}
