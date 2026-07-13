import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Check, X, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { SwipeRevealBackground } from './SwipeRevealBackground';
import type { MusicRequest } from '../../domain/request.types';

type Props = {
  request:  MusicRequest;
  onAccept: () => void;
  onReject: () => void;
  disabled?: boolean;
  // true quando a última tentativa de accept/reject DESTE pedido falhou —
  // desfaz a animação otimista de saída (o pedido continua pendente de
  // verdade, então a UI precisa refletir isso, não só o toque do usuário).
  failed?: boolean;
};

const SWIPE_THRESHOLD = 96;
const SWIPE_VELOCITY   = 800;

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

// Primeiro card de lista com swipe do app — segue o mesmo idioma de gesto já
// provado em SlideCarousel.tsx (Gesture.Pan + threshold/velocity + runOnJS +
// snap-back), adaptado pra accept/reject de item de lista. Botões de toque
// explícitos sempre visíveis — não é swipe-only (acessibilidade + regra do
// CLAUDE.md de 48x48 mínimo).
export function RequestCard({ request, onAccept, onReject, disabled, failed }: Props) {
  const translateX = useSharedValue(0);
  const hapticFired = useSharedValue(false);

  // Mutation falhou pra este pedido (accept/reject não confirmado pelo
  // backend) — desfaz a animação de saída otimista disparada em onEnd, o
  // card volta a aparecer na lista em vez de ficar "sumido" fora da tela
  // enquanto o pedido continua pendente de verdade.
  useEffect(() => {
    if (failed) {
      translateX.value = withTiming(0, { duration: 250 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed]);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      const crossed = Math.abs(e.translationX) > SWIPE_THRESHOLD;
      if (crossed && !hapticFired.value) {
        hapticFired.value = true;
        runOnJS(triggerHaptic)();
      } else if (!crossed && hapticFired.value) {
        hapticFired.value = false;
      }
    })
    .onEnd((e) => {
      const tx = e.translationX;
      const vx = e.velocityX;
      // Velocidade só conta como sinal de "flick" quando concorda com o
      // sinal do deslocamento total — sem isso, um flick de reversão rápida
      // no fim do gesto (ex.: arrastou pra esquerda, corrigiu rápido pra
      // direita sem soltar) podia disparar a ação oposta à que o card
      // estava mostrando visualmente (fundo revelado) no momento da soltura.
      const isAccept = tx > SWIPE_THRESHOLD || (vx > SWIPE_VELOCITY && tx >= 0);
      const isReject = tx < -SWIPE_THRESHOLD || (vx < -SWIPE_VELOCITY && tx <= 0);

      if (isAccept) {
        translateX.value = withTiming(500, { duration: 200 });
        runOnJS(onAccept)();
      } else if (isReject) {
        translateX.value = withTiming(-500, { duration: 200 });
        runOnJS(onReject)();
      } else {
        translateX.value = withTiming(0, { duration: 250 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const acceptBgStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 10 ? Math.min(translateX.value / SWIPE_THRESHOLD, 1) : 0,
  }));
  const rejectBgStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -10 ? Math.min(-translateX.value / SWIPE_THRESHOLD, 1) : 0,
  }));

  return (
    <View style={s.root}>
      <SwipeRevealBackground acceptStyle={acceptBgStyle} rejectStyle={rejectBgStyle} />

      <GestureDetector gesture={pan}>
        <Animated.View style={[s.card, cardStyle, disabled && s.cardDisabled]}>
          <View style={s.header}>
            <Text style={s.songTitle} numberOfLines={2}>{request.display_title || request.song_title}</Text>
            {request.is_urgent && (
              <View style={s.urgentBadge}>
                <Clock size={12} color={colors.status.error} />
                <Text style={s.urgentText}>Urgente</Text>
              </View>
            )}
          </View>

          {!!request.artist && <Text style={s.artist}>{request.artist}</Text>}
          {request.has_message && !!request.message && (
            <Text style={s.message} numberOfLines={2}>&ldquo;{request.message}&rdquo;</Text>
          )}

          <View style={s.footer}>
            <Pressable
              onPress={onReject}
              disabled={disabled}
              style={s.rejectBtn}
              accessibilityRole="button"
              accessibilityLabel="Rejeitar pedido"
              hitSlop={8}
            >
              <X size={22} color={colors.accent.coral} />
            </Pressable>
            <Pressable
              onPress={onAccept}
              disabled={disabled}
              style={s.acceptBtn}
              accessibilityRole="button"
              accessibilityLabel="Aceitar pedido"
              hitSlop={8}
            >
              <Check size={22} color={colors.text.inverse} />
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor:   colors.bg.surface,
    borderRadius:      radius.lg,
    borderWidth:       1,
    borderColor:       colors.border.default,
    padding:           spacing.lg,
    gap:               spacing.xs,
    ...shadows.sm,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    gap:             spacing.sm,
  },
  songTitle: {
    ...typography.title,
    color: colors.text.primary,
    flex:  1,
  },
  urgentBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.xs,
    borderRadius:      radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical:   spacing.xs,
    backgroundColor:  `${colors.status.error}1F`,
  },
  urgentText: {
    ...typography.caption,
    color: colors.status.error,
  },
  artist: {
    ...typography.liveBody,
    color: colors.text.secondary,
  },
  message: {
    ...typography.liveBody,
    color:      colors.text.muted,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    gap:            spacing.md,
    marginTop:      spacing.sm,
  },
  rejectBtn: {
    width:           48,
    height:          48,
    borderRadius:    radius.md,
    borderWidth:     1.5,
    borderColor:     colors.accent.coral,
    alignItems:      'center',
    justifyContent:  'center',
  },
  acceptBtn: {
    flex:              1,
    height:            48,
    borderRadius:      radius.md,
    backgroundColor:  colors.brand.primary,
    alignItems:        'center',
    justifyContent:    'center',
    ...shadows.brand,
  },
});
