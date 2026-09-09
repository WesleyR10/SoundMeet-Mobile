import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { spacing, radius } from '@/shared/design-system/tokens';
import { useTheme } from '@/shared/hooks/useTheme';
import type { ThemeColors } from '@/shared/services/ThemeContext';

/*
 * Função do tema, não constante de módulo: avaliada no carregamento, congelaria
 * a paleta escura.
 */
const slides = (colors: ThemeColors) => ([
  {
    badge:          'AO VIVO',
    badgeColor:     colors.brand.primary,
    badgeBg:        'rgba(0,224,184,0.06)',
    badgeBorder:    'rgba(0,224,184,0.30)',
    before:         'Escaneie o QR do músico no palco e entre no show. ',
    highlight:      'O som encontra você',
    highlightColor: colors.brand.primary,
    after:          ' em tempo real.',
  },
  {
    badge:          'INTERAJA',
    badgeColor:     colors.accent.coral,
    badgeBg:        'rgba(255,107,107,0.06)',
    badgeBorder:    'rgba(255,107,107,0.30)',
    before:         'Peça músicas, vote nos próximos hits e mande ',
    highlight:      'gorjeta via PIX',
    highlightColor: colors.accent.coral,
    after:          ' direto pro artista.',
  },
  {
    badge:          'CONQUISTE',
    badgeColor:     colors.accent.amber,
    badgeBg:        'rgba(245,158,11,0.06)',
    badgeBorder:    'rgba(245,158,11,0.30)',
    before:         'Acumule pontos a cada show, suba de nível e ',
    highlight:      'desbloqueie recompensas',
    highlightColor: colors.accent.amber,
    after:          ' da galera.',
  },
]) as const;

/*
 * Contagem, não cor: fica como constante de módulo de propósito. O
 * `OnboardingScreen` a consome fora de qualquer componente (num `setInterval`),
 * e o número de slides não muda com o tema.
 */
export const SLIDE_COUNT = 3;

const SW = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SW * 0.20; // 20% da tela para mudar slide

// ── Dot animado ───────────────────────────────────────────────────────────────

function AnimatedDot({ isActive }: { isActive: boolean }) {
  // Helper é componente: chama o hook por conta própria.
  const { colors } = useTheme();
  const progress = useSharedValue(isActive ? 1 : 0);
  const dotWidth = useSharedValue(isActive ? 26 : 8);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: 300 });
    dotWidth.value = withTiming(isActive ? 26 : 8, { duration: 300 });
  }, [isActive]);

  const dotStyle = useAnimatedStyle(() => ({
    width: dotWidth.value,
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.22)', colors.brand.primary],
    ),
  }));

  return <Animated.View style={[s.dot, dotStyle]} />;
}

// ── Carousel ──────────────────────────────────────────────────────────────────

type Props = {
  slide:  number;
  onGoto: (n: number) => void;
};

export function SlideCarousel({ slide, onGoto }: Props) {
  const { colors } = useTheme();
  // posição base do slide atual + offset do drag em andamento
  const baseX  = useSharedValue(-SW * slide);
  const dragX  = useSharedValue(0);

  // sincroniza baseX quando o slide muda (via timer ou tap nos dots)
  useEffect(() => {
    baseX.value = withTiming(-SW * slide, { duration: 400 });
  }, [slide]);

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])   // ignora movimentos verticais pequenos
    .onUpdate(e => {
      dragX.value = e.translationX;
    })
    .onEnd(e => {
      const tx = e.translationX;
      const vx = e.velocityX;

      // wrap circular: do último volta pro primeiro (e vice-versa),
      // mesmo comportamento do autoplay em OnboardingScreen
      if (tx < -SWIPE_THRESHOLD || vx < -600) {
        runOnJS(onGoto)((slide + 1) % SLIDE_COUNT);
      } else if (tx > SWIPE_THRESHOLD || vx > 600) {
        runOnJS(onGoto)((slide - 1 + SLIDE_COUNT) % SLIDE_COUNT);
      } else {
        // snap de volta ao slide atual
        dragX.value = withTiming(0, { duration: 250 });
      }
      // resetar dragX depois que onGoto atualizou o slide (useEffect acima cuidará do baseX)
      dragX.value = 0;
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: baseX.value + dragX.value }],
  }));

  return (
    <>
      <GestureDetector gesture={pan}>
        <Animated.View style={s.outer}>
          <Animated.View style={[s.track, trackStyle, { width: SW * SLIDE_COUNT }]}>
            {slides(colors).map((sl, i) => (
              <View key={i} style={[s.slide, { width: SW }]}>
                <View style={[s.badge, { backgroundColor: sl.badgeBg, borderColor: sl.badgeBorder }]}>
                  <Text style={[s.badgeText, { color: sl.badgeColor }]}>{sl.badge}</Text>
                </View>
                <Text style={s.slideText}>
                  {sl.before}
                  <Text style={{ color: sl.highlightColor }}>{sl.highlight}</Text>
                  {sl.after}
                </Text>
              </View>
            ))}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <View style={s.dots}>
        {slides(colors).map((_, i) => (
          <AnimatedDot key={i} isActive={i === slide} />
        ))}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  outer: {
    height:   150,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  track: {
    flexDirection: 'row',
    height:        '100%',
  },
  slide: {
    paddingHorizontal: 38,
    alignItems:        'center',
  },
  badge: {
    borderWidth:       1,
    borderRadius:      radius.full,
    paddingVertical:   5,
    paddingHorizontal: 12,
    marginBottom:      spacing.md,
  },
  badgeText: {
    fontFamily:    'Inter-Bold',
    fontSize:       11,
    letterSpacing:  1.5,
  },
  slideText: {
    fontFamily: 'Inter-Regular',
    fontSize:    17,
    lineHeight:  26,
    color:      'rgba(255,255,255,0.82)',
    textAlign:  'center',
  },
  dots: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    gap:             8,
    marginBottom:   spacing.xl,
  },
  dot: {
    height:       8,
    borderRadius: 5,
  },
});
