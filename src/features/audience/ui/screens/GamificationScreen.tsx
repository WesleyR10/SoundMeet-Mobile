import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight, Trophy } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { SkeletonList, SkeletonProfileHeader, SkeletonStatRow } from '@/shared/components/Skeleton';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { FanProfileScreenProps } from '@/navigation/types';
import { useAudiencePoints, useAudienceBadges } from '../../application/useAudienceGamification';
import { BadgeGrid } from '../components/BadgeGrid';

type Props = FanProfileScreenProps<'Gamification'>;

// GamificationScreen (Bloco 11.11) — reaproveita o mesmo adapter shared/
// services/gamification/ criado pra Home do músico (Bloco 10.3).
const useStyles = makeStyles((colors) => ({
  // Mesmo respiro do conteúdo real — é o que evita o salto na troca.
  skeleton: { flex: 1, gap: spacing.xl, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.xl,
  },
  centerRoot: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  levelCard: {
    borderRadius:      radius.lg,
    borderWidth:         1,
    borderColor:       colors.border.brand,
    backgroundColor:  colors.brand.muted,
    padding:             spacing.lg,
    gap:                 spacing.sm,
  },
  levelName: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  pointsValue: {
    ...typography.displayMd,
    color: colors.brand.primary,
  },
  progressTrack: {
    width:            '100%',
    height:           8,
    borderRadius:     radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow:         'hidden',
  },
  progressFill: {
    height:           '100%',
    borderRadius:     radius.full,
    backgroundColor: colors.brand.primary,
  },
  progressHint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop:      spacing.sm,
  },
  statBox: { alignItems: 'center', gap: 2 },
  statValue: {
    ...typography.title,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  emptyInline: {
    ...typography.body,
    color: colors.text.secondary,
  },
  leaderboardLink: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
    borderRadius:   radius.lg,
    borderWidth:     1,
    borderColor:    colors.border.default,
    padding:          spacing.md,
  },
  leaderboardLinkText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
    flex:        1,
  },
  badgesSection: { gap: spacing.md },
  sectionTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
}));

export function GamificationScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const userId = useAuthStore((s) => s.user?.userId ?? null);
  const pointsQuery = useAudiencePoints(userId);
  const badgesQuery = useAudienceBadges(userId);

  if (pointsQuery.isPending || badgesQuery.isPending) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.skeleton}>
          <SkeletonProfileHeader avatarSize={72} />
          {/* Pontos, nível e progresso; depois a grade de badges. */}
          <SkeletonStatRow count={3} />
          <SkeletonList count={3} itemHeight={80} />
        </View>
      </SafeAreaView>
    );
  }

  const points = pointsQuery.data;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Gamificação</Text>

        {points ? (
          <View style={s.levelCard}>
            <Text style={s.levelName}>Nível {points.current_level} · {points.level_info.name}</Text>
            <Text style={s.pointsValue}>{points.total_points} pts</Text>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${Math.min(100, points.progress_to_next_level)}%` }]} />
            </View>
            <Text style={s.progressHint}>{points.progress_to_next_level}% pro próximo nível</Text>

            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Text style={s.statValue}>{points.total_scans}</Text>
                <Text style={s.statLabel}>Scans</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statValue}>{points.total_requests}</Text>
                <Text style={s.statLabel}>Pedidos</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statValue}>{points.total_tips}</Text>
                <Text style={s.statLabel}>Gorjetas</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={s.emptyInline}>Escaneie um QR Code ou peça uma música pra começar a pontuar.</Text>
        )}

        <Pressable
          onPress={() => navigation.navigate('Leaderboard')}
          style={s.leaderboardLink}
          accessibilityRole="button"
          accessibilityLabel="Ver ranking"
        >
          <Trophy size={20} color={colors.accent.amber} />
          <Text style={s.leaderboardLinkText}>Ver ranking geral</Text>
          <ChevronRight size={18} color={colors.text.muted} />
        </Pressable>

        <View style={s.badgesSection}>
          <Text style={s.sectionTitle}>Conquistas</Text>
          <BadgeGrid badges={badgesQuery.data ?? []} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
