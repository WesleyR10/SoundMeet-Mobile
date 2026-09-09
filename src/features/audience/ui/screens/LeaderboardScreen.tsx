import { FlatList, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Trophy } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { FanProfileScreenProps } from '@/navigation/types';
import { useLeaderboard } from '../../application/useLeaderboard';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { EmptyState } from '@/shared/components/EmptyState';
import { SkeletonList } from '@/shared/components/Skeleton';

type Props = FanProfileScreenProps<'Leaderboard'>;

const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.md,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  centerRoot: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
  },
}));

export function LeaderboardScreen(_props: Props) {
  const s = useStyles();
  const userId = useAuthStore((s) => s.user?.userId ?? null);
  const { data, isPending, isRefetching, refetch } = useLeaderboard(20);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <Text style={s.title}>Ranking</Text>
      </View>

      {isPending ? (
        <View style={s.list}>
          {/* O ranking é linha curta com avatar e posição — 64, não 92. */}
          <SkeletonList count={6} itemHeight={64} withAvatar />
        </View>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Trophy} title="Ranking ainda vazio" subtitle="Seja o primeiro a pontuar e apareça aqui." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item, index }) => (
            <LeaderboardRow entry={item} position={index + 1} isSelf={item.user_id === userId} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
