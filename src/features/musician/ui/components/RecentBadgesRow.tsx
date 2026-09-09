import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Award } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { UserBadge } from '@/shared/services/gamification/gamification.types';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

type Props = {
  badges:    UserBadge[];
  isLoading: boolean;
};

// Glow pulsante (estilo `hm-badge` do mockup) só em badges desbloqueadas —
// uma badge travada não pulsa, fica só em opacidade reduzida.
function BadgeCard({ badge, index }: { badge: UserBadge; index: number }) {
  // Helper não exportado chama o hook por conta própria (ver CLAUDE.md).
  const reducedMotion = useReducedMotion();
  const glow = useSharedValue(0.35);

  useEffect(() => {
    if (!badge.is_unlocked) return;
    // 🔴 Badge desbloqueada PRECISA continuar se distinguindo da travada — a
    // diferença entre as duas é justamente o glow. Sob reduce motion ela para
    // no valor ALTO, não no inicial: congelar em 0.35 apagaria a conquista.
    if (reducedMotion) {
      glow.value = 0.9;
      return;
    }
    glow.value = withDelay(
      index * 150,
      withRepeat(withTiming(0.9, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: badge.is_unlocked ? glow.value : 0,
  }));

  return (
    <Animated.View style={[s.badge, glowStyle, !badge.is_unlocked && s.badgeLocked]}>
      <View style={s.iconBox}>
        <Award size={20} color={badge.is_unlocked ? colors.accent.amber : colors.text.muted} />
      </View>
      <Text style={s.badgeLabel} numberOfLines={2}>{badge.badge_description}</Text>
    </Animated.View>
  );
}

// Fonte real: GET /gamification/users/:user_id/badges (useMusicianBadges).
export function RecentBadgesRow({ badges, isLoading }: Props) {
  const recent = badges.slice(0, 3);

  return (
    <View style={s.root}>
      <Text style={s.title}>Conquistas Recentes</Text>

      {isLoading ? (
        <Text style={s.empty}>Carregando…</Text>
      ) : recent.length === 0 ? (
        <Text style={s.empty}>Ainda sem conquistas — continue tocando para desbloquear.</Text>
      ) : (
        <View style={s.row}>
          {recent.map((badge, index) => (
            <BadgeCard key={badge.id} badge={badge} index={index} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:  { gap: spacing.md },
  title: { ...typography.title, color: colors.text.primary },
  empty: { ...typography.body, color: colors.text.secondary },
  row: {
    flexDirection: 'row',
    gap:            spacing.md,
  },
  badge: {
    flex:              1,
    alignItems:       'center',
    gap:               spacing.xs,
    borderRadius:      radius.lg,
    borderWidth:        1,
    borderColor:      `${colors.accent.amber}40`,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding:            spacing.md,
    shadowColor:      colors.accent.amber,
    shadowOffset:     { width: 0, height: 0 },
    shadowRadius:      12,
    elevation:          4,
  },
  badgeLocked: {
    opacity: 0.4,
  },
  iconBox: {
    width:            36,
    height:           36,
    borderRadius:     radius.md,
    backgroundColor: `${colors.accent.amber}20`,
    alignItems:      'center',
    justifyContent:  'center',
  },
  badgeLabel: {
    ...typography.caption,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
});
