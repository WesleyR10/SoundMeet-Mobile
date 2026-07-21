import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Check, X, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { Avatar } from '@/shared/components/Avatar';
import type { Band, BandMember } from '../../domain/band.types';

type Props = {
  band:      Band;
  myMember:  BandMember;
  onAccept:  () => void;
  onReject:  () => void;
  disabled?: boolean;
  failed?:   boolean;
};

const SWIPE_THRESHOLD = 96;
const SWIPE_VELOCITY   = 800;

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

const ROLE_LABEL: Record<string, string> = {
  leader: 'líder',
  member: 'membro',
};

// Convite de banda pendente (MyBandsScreen) — mesma mecânica de swipe já
// validada em RequestCard.tsx (Gesture.Pan + threshold/velocity + haptic +
// botões explícitos ≥48px), mas com acento VIOLETA em vez de teal/coral:
// design-system.md já usa violeta pra "comunidade/momento especial" (chat,
// agenda), diferente do teal de pedido ao vivo — evita confundir os dois
// tipos de card visualmente, mesmo tendo o mesmo gesto.
export function BandInviteCard({ band, myMember, onAccept, onReject, disabled, failed }: Props) {
  const translateX = useSharedValue(0);
  const hapticFired = useSharedValue(false);

  useEffect(() => {
    if (failed) {
      translateX.value = withTiming(0, { duration: 250 });
    }
  }, [failed, translateX]);

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

  const roleLabel = ROLE_LABEL[myMember.role] ?? myMember.role;

  return (
    <View style={s.root}>
      <Animated.View style={[s.revealBg, s.revealAccept, acceptBgStyle]}>
        <Check size={28} color={colors.text.inverse} />
      </Animated.View>
      <Animated.View style={[s.revealBg, s.revealReject, rejectBgStyle]}>
        <X size={28} color={colors.text.inverse} />
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[s.card, cardStyle, disabled && s.cardDisabled]}>
          <View style={s.header}>
            <Avatar uri={band.avatar} size={44} fallbackIcon={Users} ringColors={[colors.accent.violet, colors.brand.primary]} />
            <View style={s.headerText}>
              <Text style={s.bandName} numberOfLines={1}>{band.name}</Text>
              <Text style={s.inviteText} numberOfLines={1}>Convite pra tocar {myMember.instrument} · {roleLabel}</Text>
            </View>
          </View>

          <View style={s.footer}>
            <Pressable
              onPress={onReject}
              disabled={disabled}
              style={s.rejectBtn}
              accessibilityRole="button"
              accessibilityLabel="Recusar convite"
              hitSlop={8}
            >
              <X size={22} color={colors.accent.coral} />
            </Pressable>
            <Pressable
              onPress={onAccept}
              disabled={disabled}
              style={s.acceptBtn}
              accessibilityRole="button"
              accessibilityLabel="Aceitar convite"
              hitSlop={8}
            >
              <Check size={22} color={colors.text.inverse} />
              <Text style={s.acceptLabel}>Aceitar</Text>
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
  revealBg: {
    position:       'absolute',
    top:             0,
    bottom:          0,
    width:           '50%',
    borderRadius:    radius.lg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  revealAccept: { left: 0, backgroundColor: colors.accent.violet },
  revealReject: { right: 0, backgroundColor: colors.accent.coral },
  card: {
    backgroundColor:   colors.bg.surface,
    borderRadius:      radius.lg,
    borderWidth:       1,
    borderColor:       colors.border.brand,
    padding:           spacing.lg,
    gap:               spacing.md,
    ...shadows.violet,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
  },
  headerText: {
    flex: 1,
    gap:   2,
  },
  bandName: {
    ...typography.title,
    color: colors.text.primary,
  },
  inviteText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    gap:            spacing.md,
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
    backgroundColor:  colors.accent.violet,
    flexDirection:    'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:                spacing.sm,
  },
  acceptLabel: {
    ...typography.body,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color:      colors.text.inverse,
  },
});
