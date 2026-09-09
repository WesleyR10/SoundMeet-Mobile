import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Crown } from 'lucide-react-native';
import { gradients, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

const BADGE_SIZE = 72;

// Hero do paywall — coroa em badge gradiente premium com aura pulsante
// (mesma técnica de glow do AmbientGlowBackground: círculo translúcido +
// pulso de opacity/scale, sem blur nativo).
const useStyles = makeStyles((colors) => ({
  root: {
    alignItems: 'center',
    gap:         spacing.sm,
  },
  badgeWrap: {
    width:           BADGE_SIZE,
    height:          BADGE_SIZE,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:    spacing.sm,
  },
  aura: {
    position:        'absolute',
    width:            BADGE_SIZE + 28,
    height:           BADGE_SIZE + 28,
    borderRadius:     radius.full,
    backgroundColor: 'rgba(124,58,237,0.28)',
  },
  badge: {
    width:           BADGE_SIZE,
    height:          BADGE_SIZE,
    borderRadius:    radius.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
  eyebrow: {
    ...typography.caption,
    color:         colors.accent.violetLight,
    letterSpacing:  2,
  },
  title: {
    ...typography.displayMd,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color:             colors.text.secondary,
    textAlign:         'center',
    paddingHorizontal: spacing.lg,
  },
}));

export function PaywallHero() {
  const s = useStyles();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    // Aura do paywall: puro reforço estético. Meio da faixa mantém o brilho
    // premium sem pulsar.
    if (reducedMotion) {
      pulse.value = 0.5;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }), -1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const auraStyle = useAnimatedStyle(() => ({
    opacity:   0.35 + pulse.value * 0.4,
    transform: [{ scale: 1 + pulse.value * 0.18 }],
  }));

  return (
    <View style={s.root}>
      <View style={s.badgeWrap}>
        <Animated.View style={[s.aura, auraStyle]} />
        <LinearGradient colors={gradients.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.badge, shadows.violet]}>
          <Crown size={32} color={colors.text.primary} />
        </LinearGradient>
      </View>

      <Text style={s.eyebrow}>SOUNDMEET PREMIUM</Text>
      <Text style={s.title}>Toque no próximo nível</Text>
      <Text style={s.subtitle}>
        Menos taxa na gorjeta, saque mais rápido e ferramentas de quem vive de música.
      </Text>
    </View>
  );
}
