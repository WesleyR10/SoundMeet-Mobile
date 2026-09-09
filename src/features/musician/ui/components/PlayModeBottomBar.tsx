import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence } from 'react-native-reanimated';
import { SkipBack, SkipForward, Play, Pause, Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  isPlaying:      boolean;
  // true enquanto o layout das linhas ainda não terminou de medir (ver
  // usePlayModeAutoScroll.hasMeasured) — apertar play antes disso causaria
  // um pulo visual pro topo em linhas ainda não medidas.
  playDisabled:   boolean;
  onTogglePlay:   () => void;
  onPrev:         () => void;
  onNext:         () => void;
  hasPrev:        boolean;
  hasNext:        boolean;
  speedMultiplier: number;
  onDecreaseSpeed: () => void;
  onIncreaseSpeed: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Barra inferior mínima do Play Mode (7.8e): ← anterior | pausar/tocar |
// próxima →, mais controle de velocidade inline via ChordDiagramSheet-style
// bottom sheet só no acorde tocado (não aqui — velocidade é um stepper
// inline mesmo, decisão de manter simples). Botões ≥48x48px (regra de toque
// mínimo do CLAUDE.md). Micro-interações: bounce no texto de velocidade a
// cada mudança + escala no botão de play/pause ao pressionar — feedback
// tátil pro músico que provavelmente não está olhando pra barra enquanto
// toca.
const useStyles = makeStyles((colors) => ({
  root: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.lg,
    paddingTop:        spacing.sm,
    gap:                spacing.sm,
  },
  speedRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.md,
  },
  speedBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  speedText: {
    ...typography.bodySm,
    color: colors.text.secondary,
    width:  48,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.xxl,
  },
  sideBtn: {
    width:          56,
    height:         56,
    alignItems:     'center',
    justifyContent: 'center',
  },
  sideBtnDisabled: {
    opacity: 0.4,
  },
  playBtn: {
    width:           72,
    height:          72,
    borderRadius:    radius.full,
    backgroundColor: colors.brand.primary,
    alignItems:      'center',
    justifyContent:  'center',
    ...shadows.brand,
  },
  playBtnDisabled: {
    opacity:       0.5,
    shadowOpacity:  0,
    elevation:      0,
  },
}));

export function PlayModeBottomBar({
  isPlaying,
  playDisabled,
  onTogglePlay,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  speedMultiplier,
  onDecreaseSpeed,
  onIncreaseSpeed,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const speedScale = useSharedValue(1);
  useEffect(() => {
    speedScale.value = withSequence(
      withTiming(1.18, { duration: 90 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
  }, [speedMultiplier, speedScale]);
  const speedTextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: speedScale.value }],
  }));

  const playScale = useSharedValue(1);
  const playBtnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
  }));

  const handleDecreaseSpeed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDecreaseSpeed();
  };
  const handleIncreaseSpeed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onIncreaseSpeed();
  };

  return (
    <View style={s.root}>
      <View style={s.speedRow}>
        <Pressable onPress={handleDecreaseSpeed} style={s.speedBtn} accessibilityRole="button" accessibilityLabel="Diminuir velocidade" hitSlop={8}>
          <Minus size={16} color={colors.text.secondary} />
        </Pressable>
        <Animated.Text style={[s.speedText, speedTextStyle]}>{speedMultiplier.toFixed(2)}×</Animated.Text>
        <Pressable onPress={handleIncreaseSpeed} style={s.speedBtn} accessibilityRole="button" accessibilityLabel="Aumentar velocidade" hitSlop={8}>
          <Plus size={16} color={colors.text.secondary} />
        </Pressable>
      </View>

      <View style={s.controlsRow}>
        <Pressable
          onPress={onPrev}
          disabled={!hasPrev}
          style={[s.sideBtn, !hasPrev && s.sideBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Música anterior"
          hitSlop={8}
        >
          <SkipBack size={24} color={hasPrev ? colors.text.primary : colors.text.muted} />
        </Pressable>

        <AnimatedPressable
          onPress={onTogglePlay}
          onPressIn={() => { playScale.value = withTiming(0.9, { duration: 100 }); }}
          onPressOut={() => { playScale.value = withSpring(1, { damping: 12, stiffness: 220 }); }}
          disabled={playDisabled}
          style={[s.playBtn, playDisabled && s.playBtnDisabled, playBtnAnimatedStyle]}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pausar scroll' : 'Retomar scroll'}
        >
          {isPlaying ? (
            <Pause size={28} color={colors.text.inverse} />
          ) : (
            <Play size={28} color={colors.text.inverse} />
          )}
        </AnimatedPressable>

        <Pressable
          onPress={onNext}
          disabled={!hasNext}
          style={[s.sideBtn, !hasNext && s.sideBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Próxima música"
          hitSlop={8}
        >
          <SkipForward size={24} color={hasNext ? colors.text.primary : colors.text.muted} />
        </Pressable>
      </View>
    </View>
  );
}
