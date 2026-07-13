import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SkipBack, SkipForward, Play, Pause, Minus, Plus } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';

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

// Barra inferior mínima do Play Mode (7.8e): ← anterior | pausar/tocar |
// próxima →, mais controle de velocidade inline (sem bottom sheet — nenhuma
// lib de bottom sheet aprovada no projeto ainda, ver CLAUDE.md §libs).
// Botões ≥48x48px (regra de toque mínimo do CLAUDE.md).
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
  return (
    <View style={s.root}>
      <View style={s.speedRow}>
        <Pressable onPress={onDecreaseSpeed} style={s.speedBtn} accessibilityRole="button" accessibilityLabel="Diminuir velocidade" hitSlop={8}>
          <Minus size={16} color={colors.text.secondary} />
        </Pressable>
        <Text style={s.speedText}>{speedMultiplier.toFixed(2)}×</Text>
        <Pressable onPress={onIncreaseSpeed} style={s.speedBtn} accessibilityRole="button" accessibilityLabel="Aumentar velocidade" hitSlop={8}>
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

        <Pressable
          onPress={onTogglePlay}
          disabled={playDisabled}
          style={[s.playBtn, playDisabled && s.playBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pausar scroll' : 'Retomar scroll'}
        >
          {isPlaying ? (
            <Pause size={28} color={colors.text.inverse} />
          ) : (
            <Play size={28} color={colors.text.inverse} />
          )}
        </Pressable>

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

const s = StyleSheet.create({
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
});
