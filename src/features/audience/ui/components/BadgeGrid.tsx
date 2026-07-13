import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Award } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { UserBadge } from '@/shared/services/gamification/gamification.types';

type Props = {
  badges: UserBadge[];
};

function BadgeCell({ badge, index }: { badge: UserBadge; index: number }) {
  const glow = useSharedValue(0.35);

  // Depende de `is_unlocked` (não array vazio) — GamificationScreen invalida
  // o cache de badges após ações que pontuam (ver useScanQr.ts/
  // useSongRequest.ts), então uma badge pode passar de bloqueada pra
  // desbloqueada com este componente ainda montado (mesmo `key={badge.id}`);
  // sem essa dependência o glow nunca começaria a pulsar até desmontar.
  useEffect(() => {
    if (!badge.is_unlocked) return;
    glow.value = withDelay(
      index * 120,
      withRepeat(withTiming(0.9, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [badge.is_unlocked, index, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: badge.is_unlocked ? glow.value : 0,
  }));

  return (
    <Animated.View style={[s.cell, glowStyle, !badge.is_unlocked && s.cellLocked]}>
      <View style={s.iconBox}>
        <Award size={22} color={badge.is_unlocked ? colors.accent.amber : colors.text.muted} />
      </View>
      <Text style={s.label} numberOfLines={2}>{badge.badge_description}</Text>
      {!badge.is_unlocked && (
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${Math.min(100, badge.progress_percentage)}%` }]} />
        </View>
      )}
    </Animated.View>
  );
}

// Grid completo de badges (GamificationScreen, Bloco 11.11) — distinto de
// RecentBadgesRow (musician, top-3 na Home); aqui mostra o catálogo inteiro
// do fã, com barra de progresso nas ainda não desbloqueadas.
export function BadgeGrid({ badges }: Props) {
  if (badges.length === 0) {
    return <Text style={s.empty}>Ainda sem conquistas — escaneie QR codes e peça músicas pra desbloquear.</Text>;
  }

  return (
    <View style={s.grid}>
      {badges.map((badge, index) => (
        <BadgeCell key={badge.id} badge={badge} index={index} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.text.secondary,
  },
  cell: {
    width:            '30%',
    flexGrow:          1,
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
  cellLocked: {
    opacity: 0.45,
  },
  iconBox: {
    width:            40,
    height:           40,
    borderRadius:     radius.md,
    backgroundColor: `${colors.accent.amber}20`,
    alignItems:      'center',
    justifyContent:  'center',
  },
  label: {
    ...typography.caption,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  progressTrack: {
    width:            '100%',
    height:           4,
    borderRadius:     radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow:         'hidden',
  },
  progressFill: {
    height:           '100%',
    borderRadius:     radius.full,
    backgroundColor: colors.accent.amber,
  },
});
