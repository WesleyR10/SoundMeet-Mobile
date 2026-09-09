import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { AudioLines, GripVertical, Trash2, StickyNote, PlayCircle, FileX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import type { RepertoireSong } from '../../domain/repertoire.types';

type Props = {
  song:      RepertoireSong;
  index:     number;
  onPress:   () => void;
  /**
   * Modo Ensaio. Opcional: só aparece onde a música tem cifra, porque sem ela
   * o ensaio perde metade do valor (stems sem cifra é um player, não um
   * ensaio).
   */
  onPractice?: () => void;
  onRemove:  () => void;
  drag:      () => void;
  isActive:  boolean;
};

const SWIPE_THRESHOLD = 96;
const SWIPE_VELOCITY   = 800;

function formatDuration(seconds: number | null): string | null {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

// Handle de drag (GripVertical) é um alvo de toque separado do resto do row
// pra não conflitar com o swipe horizontal de remover — onLongPress no handle
// aciona `drag()` do DraggableFlatList; Gesture.Pan cobre só o corpo do card.
// Mesmo idioma de swipe de RequestCard.tsx, mas 1 direção só (remover).
const useStyles = makeStyles((colors) => ({
  root: {
    marginBottom: spacing.sm,
  },
  removeBg: {
    position:       'absolute',
    top:             0,
    bottom:          0,
    right:           0,
    width:          '30%',
    borderRadius:    radius.lg,
    backgroundColor: colors.accent.coral,
    alignItems:      'center',
    justifyContent:  'center',
  },
  card: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:               spacing.sm,
    backgroundColor: colors.bg.surface,
    borderRadius:     radius.lg,
    borderWidth:       1,
    borderColor:      colors.border.default,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  cardActive: {
    borderColor: colors.border.brand,
    ...shadows.brand,
  },
  position: {
    ...typography.bodySm,
    color:    colors.text.muted,
    width:    20,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    gap:   2,
  },
  title: {
    ...typography.liveBody,
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
  },
  artist: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  duration: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.xs,
    marginTop:      4,
  },
  customBadge: {
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 4,
    alignSelf:          'flex-start',
    borderRadius:       radius.sm,
    paddingHorizontal:  spacing.xs,
    paddingVertical:    2,
    backgroundColor:   `${colors.accent.amber}1F`,
  },
  customBadgeText: {
    ...typography.caption,
    color: colors.accent.amber,
  },
  noSheetBadge: {
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 4,
    alignSelf:          'flex-start',
    borderRadius:       radius.sm,
    paddingHorizontal:  spacing.xs,
    paddingVertical:    2,
    backgroundColor:   'rgba(255,255,255,0.06)',
  },
  noSheetBadgeText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  handle: {
    width:           44,
    height:          44,
    alignItems:      'center',
    justifyContent:  'center',
  },
}));

export function SongCard({ song, index, onPress, onPractice, onRemove, drag, isActive }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const translateX = useSharedValue(0);
  const hapticFired = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(!isActive)
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = Math.min(0, e.translationX);
      const crossed = translateX.value < -SWIPE_THRESHOLD;
      if (crossed && !hapticFired.value) {
        hapticFired.value = true;
        runOnJS(triggerHaptic)();
      } else if (!crossed && hapticFired.value) {
        hapticFired.value = false;
      }
    })
    .onEnd((e) => {
      const isRemove = e.translationX < -SWIPE_THRESHOLD || (e.velocityX < -SWIPE_VELOCITY && e.translationX <= 0);
      if (isRemove) {
        translateX.value = withTiming(-500, { duration: 200 });
        runOnJS(onRemove)();
      } else {
        translateX.value = withTiming(0, { duration: 250 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const removeBgStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -10 ? Math.min(-translateX.value / SWIPE_THRESHOLD, 1) : 0,
  }));

  const duration = formatDuration(song.effective_duration_seconds);

  return (
    <View style={s.root}>
      <Animated.View style={[s.removeBg, removeBgStyle]}>
        <Trash2 size={22} color={colors.text.inverse} />
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[s.card, cardStyle, isActive && s.cardActive]}>
          <Text style={s.position}>{index + 1}</Text>

          <Pressable onPress={onPress} style={s.body} accessibilityRole="button" accessibilityLabel={`Tocar ${song.title}`}>
            <Text style={s.title} numberOfLines={1}>{song.title}</Text>
            <View style={s.metaRow}>
              <Text style={s.artist} numberOfLines={1}>{song.artist}</Text>
              {!!duration && <Text style={s.duration}> · {duration}</Text>}
            </View>
            <View style={s.badgeRow}>
              {!!song.custom_notes && (
                <View style={s.customBadge}>
                  <StickyNote size={11} color={colors.accent.amber} />
                  <Text style={s.customBadgeText}>Customizada</Text>
                </View>
              )}
              {/* A música continua abrível de propósito (a análise pode ter
                  concluído desde o último fetch) — o badge só evita a surpresa
                  de cair numa tela vazia sem aviso. */}
              {!song.has_chord_sheet && (
                <View style={s.noSheetBadge}>
                  <FileX size={11} color={colors.text.muted} />
                  <Text style={s.noSheetBadgeText}>Sem cifra</Text>
                </View>
              )}
            </View>
          </Pressable>

          <Pressable
            onPress={onPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={song.has_chord_sheet ? 'Abrir no Play Mode' : 'Abrir no Play Mode (sem cifra disponível)'}
          >
            <PlayCircle size={26} color={song.has_chord_sheet ? colors.brand.primary : colors.text.muted} />
          </Pressable>

          {!!onPractice && song.has_chord_sheet && (
            <Pressable
              onPress={onPractice}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Ensaiar ${song.title} com as faixas separadas`}
            >
              <AudioLines size={24} color={colors.accent.violet} />
            </Pressable>
          )}

          <Pressable
            onLongPress={drag}
            disabled={isActive}
            style={s.handle}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Arrastar pra reordenar"
          >
            <GripVertical size={20} color={colors.text.muted} />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
