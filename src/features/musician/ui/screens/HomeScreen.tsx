import { useCallback, useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import type { ThemeColors } from '@/shared/services/ThemeContext';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { RoleSwitchSheet } from '@/navigation/components/RoleSwitchSheet';
import { OpenToGigsDecisionSheet } from '../components/OpenToGigsDecisionSheet';
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
/*
 * Função do tema, não constante de módulo: array avaliado no carregamento
 * congelaria o glow do tema escuro sobre um fundo claro.
 */
const homeGlows = (colors: ThemeColors) => [
  { color: `${colors.accent.amber}24`, size: 300, top: -100, right: -90, duration: 8000 },
  { color: `${colors.accent.violet}29`, size: 320, top: 200, left: -110, duration: 9500 },
];

// Home do músico (Bloco 10.3) — orquestra os dados reais (perfil, saldo,
// contagem de repertório, atividade recente, badges) e delega estados
// vazios/placeholder (Próximo Show, Descoberta) aos próprios componentes.
const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.lg,
  },
}));

export function HomeScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const userId     = useAuthStore((s) => s.user?.userId ?? null);
  const [accountsVisible, setAccountsVisible] = useState(false);
  // "Decidir depois" só fecha o sheet nesta sessão (a tab da Home continua
  // montada) — musician.open_to_gigs continua null, reaparece no próximo
  // cold start do app (este state não persiste).
  const [decisionDismissed, setDecisionDismissed] = useState(false);

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
      <AmbientGlowBackground glows={homeGlows(colors)} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl tintColor={colors.brand.primary} refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <HomeHeader
          musician={musicianQuery.data}
          balance={walletQuery.data?.balance ?? null}
          onNavigateProfile={() => navigation.navigate('Profile', { screen: 'ViewProfile' })}
          onNavigatePlans={() => rootNavigation?.navigate('Plans')}
          onOpenAccounts={() => setAccountsVisible(true)}
          onPressMessages={() => rootNavigation?.navigate('ConversationList')}
        />

        <NextShowCard />

        <QuickAccessGrid
          repertoireCount={repertoireQuery.data ?? null}
          onPressQrCode={() => navigation.navigate('Profile', { screen: 'QRCode' })}
          onPressRepertoire={() => navigation.navigate('Repertoire', { screen: 'RepertoireList' })}
          onPressAnalytics={() => navigation.navigate('Profile', { screen: 'Analytics' })}
          onPressTuner={() => navigation.navigate('Profile', { screen: 'Tuner' })}
          onPressCifras={() => navigation.navigate('Repertoire', { screen: 'ChordSheetsHub' })}
          onPressAgenda={() => rootNavigation?.navigate('Agenda')}
          onPressInquiries={() => rootNavigation?.navigate('InquiryList')}
          onPressContracts={() => rootNavigation?.navigate('ContractList')}
        />

        <DiscoveryCard />

        <RecentActivityList requests={recentActivity} isLoading={requestsQuery.isPending} />

        <RecentBadgesRow badges={badgesQuery.data ?? []} isLoading={badgesQuery.isPending} />
      </ScrollView>

      <RoleSwitchSheet
        visible={accountsVisible}
        onClose={() => setAccountsVisible(false)}
        context="musician"
      />

      <OpenToGigsDecisionSheet
        visible={!decisionDismissed && musicianQuery.data?.open_to_gigs === null}
        onClose={() => setDecisionDismissed(true)}
        musicianId={musicianId}
      />
    </SafeAreaView>
  );
}
