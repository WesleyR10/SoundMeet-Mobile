import { useCallback } from 'react';
import { ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '@/shared/design-system/tokens';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useMusician } from '../../application/useMusician';
import { useMusicianWallet } from '../../application/useMusicianWallet';
import { useRepertoireCount } from '../../application/useRepertoireCount';
import { useRequests } from '../../application/useRequests';
import { useMusicianBadges } from '../../application/useMusicianBadges';
import { HomeHeader } from '../components/HomeHeader';
import { NextShowCard } from '../components/NextShowCard';
import { QuickAccessGrid } from '../components/QuickAccessGrid';
import { DiscoveryCard } from '../components/DiscoveryCard';
import { RecentActivityList } from '../components/RecentActivityList';
import { RecentBadgesRow } from '../components/RecentBadgesRow';
import type { MusicianTabScreenProps, RootStackParamList } from '@/navigation/types';

type Props = MusicianTabScreenProps<'Home'>;

// Amber+violeta (combinação do mockup da Home, distinta do teal+violeta
// default do resto do app — ver Docs/design-system.md, "usage by context").
const HOME_GLOWS = [
  { color: `${colors.accent.amber}24`, size: 300, top: -100, right: -90, duration: 8000 },
  { color: 'rgba(124,58,237,0.16)', size: 320, top: 200, left: -110, duration: 9500 },
];

// Home do músico (Bloco 10.3) — orquestra os dados reais (perfil, saldo,
// contagem de repertório, atividade recente, badges) e delega estados
// vazios/placeholder (Próximo Show, Descoberta) aos próprios componentes.
export function HomeScreen({ navigation }: Props) {
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const userId     = useAuthStore((s) => s.user?.userId ?? null);

  // Home é uma Tab.Screen direta (sem stack própria) — ConversationList
  // vive no Root, não numa tab irmã, então getParent() aqui sobe pro
  // native-stack do RootNavigator, não pro Tab.Navigator (mesmo padrão
  // tipado de FanHomeScreen.tsx, trocado pro navigator certo pra esse salto
  // tab→root em vez de tab→tab).
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const musicianQuery   = useMusician(musicianId);
  const walletQuery     = useMusicianWallet(musicianId);
  const repertoireQuery = useRepertoireCount(musicianId);
  const requestsQuery   = useRequests(musicianId, 'all');
  const badgesQuery     = useMusicianBadges(userId);

  const isRefreshing =
    musicianQuery.isRefetching ||
    walletQuery.isRefetching ||
    repertoireQuery.isRefetching ||
    requestsQuery.isRefetching ||
    badgesQuery.isRefetching;

  const onRefresh = useCallback(() => {
    musicianQuery.refetch();
    walletQuery.refetch();
    repertoireQuery.refetch();
    requestsQuery.refetch();
    badgesQuery.refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recentActivity = (requestsQuery.data?.requests ?? [])
    .filter((r) => r.is_accepted || r.is_played)
    .slice(0, 3);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground glows={HOME_GLOWS} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl tintColor={colors.brand.primary} refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <HomeHeader musician={musicianQuery.data} balance={walletQuery.data?.balance ?? null} />

        <NextShowCard />

        <QuickAccessGrid
          repertoireCount={repertoireQuery.data ?? null}
          onPressQrCode={() => navigation.navigate('Profile', { screen: 'QRCode' })}
          onPressRepertoire={() => navigation.navigate('Repertoire', { screen: 'RepertoireList' })}
          onPressAnalytics={() => navigation.navigate('Profile', { screen: 'Analytics' })}
          onPressTuner={() => navigation.navigate('Profile', { screen: 'Tuner' })}
          onPressAgenda={() => rootNavigation?.navigate('ConversationList')}
        />

        <DiscoveryCard />

        <RecentActivityList requests={recentActivity} isLoading={requestsQuery.isPending} />

        <RecentBadgesRow badges={badgesQuery.data ?? []} isLoading={badgesQuery.isPending} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.lg,
  },
});
