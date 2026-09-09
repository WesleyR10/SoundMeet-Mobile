import { View, Text, Pressable } from 'react-native';
import { Pause, Play, RotateCcw, RotateCw } from 'lucide-react-native';
import { spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

const SKIP_SECONDS = 10;
const RATE_STEP = 0.25;
const MIN_RATE = 0.5;
const MAX_RATE = 1.5;

type Props = {
  isPlaying: boolean;
  position:  number;
  duration:  number;
  rate:      number;
  onToggle:  () => void;
  onSeek:    (seconds: number) => void;
  onRate:    (rate: number) => void;
};

/**
 * Transporte do ensaio.
 *
 * **Voltar 10s é o botão mais usado desta tela**, não o play: ensaiar é repetir
 * o mesmo trecho até sair. Por isso ele tem o mesmo peso visual do play, e não
 * fica escondido atrás de um menu.
 *
 * A velocidade é stepper, não slider — mesmo idioma da barra do Play Mode, e o
 * projeto não tem lib de slider. `shouldCorrectPitch` fica ligado no player:
 * meia-velocidade que abaixa o tom junto não serve para tirar de ouvido.
 */
const useStyles = makeStyles((colors) => ({
  root: {
    gap: spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  time: {
    ...typography.caption,
    color:     colors.text.secondary,
    minWidth:  38,
    textAlign: 'center',
  },
  track: {
    flex:            1,
    height:          4,
    borderRadius:    radius.full,
    backgroundColor: colors.border.default,
    overflow:       'hidden',
  },
  trackFill: {
    height:          '100%',
    borderRadius:    radius.full,
    backgroundColor: colors.brand.primary,
  },
  controls: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.xl,
  },
  secondaryBtn: {
    width:           56,
    height:          56,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:    radius.full,
    borderWidth:     1.5,
    borderColor:     colors.border.brand,
  },
  playBtn: {
    width:           68,
    height:          68,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:    radius.full,
    backgroundColor: colors.brand.primary,
  },
  rateRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.md,
  },
  rateBtn: {
    width:           48,
    height:          48,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border.default,
  },
  rateBtnDisabled: {
    opacity: 0.35,
  },
  rateBtnLabel: {
    ...typography.title,
    color: colors.brand.primary,
  },
  rateValueBox: {
    alignItems: 'center',
    minWidth:   96,
  },
  rateValue: {
    ...typography.liveBody,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color:      colors.text.primary,
  },
  rateHint: {
    ...typography.caption,
    color: colors.text.muted,
  },
}));

export function PracticeTransport({
  isPlaying,
  position,
  duration,
  rate,
  onToggle,
  onSeek,
  onRate,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const canSlower = rate > MIN_RATE + 0.001;
  const canFaster = rate < MAX_RATE - 0.001;

  return (
    <View style={s.root}>
      <View style={s.timeRow}>
        <Text style={s.time}>{formatTime(position)}</Text>
        <View style={s.track}>
          <View
            style={[
              s.trackFill,
              { width: `${duration > 0 ? Math.min(100, (position / duration) * 100) : 0}%` },
            ]}
          />
        </View>
        <Text style={s.time}>{formatTime(duration)}</Text>
      </View>

      <View style={s.controls}>
        <Pressable
          onPress={() => onSeek(Math.max(0, position - SKIP_SECONDS))}
          style={s.secondaryBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Voltar ${SKIP_SECONDS} segundos`}
        >
          <RotateCcw size={22} color={colors.brand.primary} />
        </Pressable>

        <Pressable
          onPress={onToggle}
          style={[s.playBtn, shadows.brand]}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pausar' : 'Tocar'}
        >
          {isPlaying ? (
            <Pause size={26} color={colors.text.inverse} />
          ) : (
            <Play size={26} color={colors.text.inverse} />
          )}
        </Pressable>

        <Pressable
          onPress={() => onSeek(Math.min(duration, position + SKIP_SECONDS))}
          style={s.secondaryBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Avançar ${SKIP_SECONDS} segundos`}
        >
          <RotateCw size={22} color={colors.brand.primary} />
        </Pressable>
      </View>

      <View style={s.rateRow}>
        <Pressable
          onPress={() => canSlower && onRate(round2(rate - RATE_STEP))}
          disabled={!canSlower}
          style={[s.rateBtn, !canSlower && s.rateBtnDisabled]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Diminuir a velocidade"
        >
          <Text style={s.rateBtnLabel}>−</Text>
        </Pressable>

        <View style={s.rateValueBox}>
          <Text style={s.rateValue}>{rate.toFixed(2).replace('.', ',')}×</Text>
          <Text style={s.rateHint}>tom preservado</Text>
        </View>

        <Pressable
          onPress={() => canFaster && onRate(round2(rate + RATE_STEP))}
          disabled={!canFaster}
          style={[s.rateBtn, !canFaster && s.rateBtnDisabled]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Aumentar a velocidade"
        >
          <Text style={s.rateBtnLabel}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
