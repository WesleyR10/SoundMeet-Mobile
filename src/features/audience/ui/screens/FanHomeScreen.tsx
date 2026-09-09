import { useCallback } from 'react';
import { ScrollView, RefreshControl, View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Building2, ChevronRight } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import type { ThemeColors } from '@/shared/services/ThemeContext';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { FanStackScreenProps, FanTabParamList } from '@/navigation/types';
import { useAudience } from '../../application/useAudience';
import { useRecommendedMusicians } from '../../application/useRecommendedMusicians';
import { useEstablishments } from '../../application/useEstablishments';
import { HomeHeader } from '../components/HomeHeader';
import { QuickActionsRow } from '../components/QuickActionsRow';
import { MusicianRecommendationCard } from '../components/MusicianRecommendationCard';
import { EstablishmentCard } from '../components/EstablishmentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { SkeletonList } from '@/shared/components/Skeleton';

type Props = FanStackScreenProps<'FanHome'>;

// Amber+violeta como a Home do músico, mas com respiração mais lenta (feed
// de descoberta é "navegar com calma", não "atenção imediata" como o
// contexto ao vivo do músico).
/*
 * Função do tema, não constante: como array de módulo era avaliada no
 * carregamento e congelava o glow teal do tema escuro.
 */
const homeGlows = (colors: ThemeColors) => [
  { color: `${colors.brand.primary}24`, size: 300, top: -100, right: -90, duration: 9000 },
  { color: `${colors.accent.violet}29`, size: 320, top: 220, left: -110, duration: 10500 },
];

const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.xl,
  },
  section: { gap: spacing.md },
  sectionHeaderRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            2,
  },
  seeAllText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
  establishmentList: { gap: spacing.md },
  emptyInline: {
    ...typography.body,
    color: colors.text.secondary,
  },
}));

export function FanHomeScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const audienceId = useAuthStore((s) => s.user?.audienceId ?? null);

  const audienceQuery      = useAudience(audienceId);
  const recommendedQuery   = useRecommendedMusicians(audienceId);
  const establishmentsQuery = useEstablishments({ per_page: 6 });

  const isRefreshing =
    audienceQuery.isRefetching || recommendedQuery.isRefetching || establishmentsQuery.isRefetching;

  const onRefresh = useCallback(() => {
    audienceQuery.refetch();
    recommendedQuery.refetch();
    establishmentsQuery.refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parentTabNavigation = navigation.getParent<BottomTabNavigationProp<FanTabParamList>>();

  function goToExploreTab() {
    parentTabNavigation?.navigate('Explore', { screen: 'FanExplore' } as never);
  }

  function goToMyPoints() {
    parentTabNavigation?.navigate('Profile', { screen: 'Gamification' } as never);
  }

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
        <HomeHeader audience={audienceQuery.data} />

        <QuickActionsRow
          onScanQr={() => navigation.navigate('QRScanner')}
          onMyPoints={goToMyPoints}
          onMyRequests={() => navigation.navigate('MyRequests')}
        />

        <View style={s.section}>
          <Text style={s.sectionTitle}>Recomendados pra você</Text>
          {recommendedQuery.data?.data.length ? (
            <FlatList
              horizontal
              data={recommendedQuery.data.data}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
              renderItem={({ item }) => (
                <MusicianRecommendationCard
                  musician={item}
                  onPress={() => navigation.navigate('MusicianPublicProfile', { musicianId: item.id })}
                />
              )}
            />
          ) : (
            <Text style={s.emptyInline}>
              {recommendedQuery.isPending ? 'Carregando...' : 'Complete seu perfil (gêneros/instrumentos favoritos) pra receber recomendações.'}
            </Text>
          )}
        </View>

        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Estabelecimentos</Text>
            <Pressable onPress={goToExploreTab} accessibilityRole="button" accessibilityLabel="Ver todos os estabelecimentos">
              <View style={s.seeAllRow}>
                <Text style={s.seeAllText}>Ver todos</Text>
                <ChevronRight size={14} color={colors.brand.primary} />
              </View>
            </Pressable>
          </View>

          {establishmentsQuery.isPending ? (
            <SkeletonList count={3} itemHeight={96} withAvatar />
          ) : establishmentsQuery.data?.data.length ? (
            <View style={s.establishmentList}>
              {establishmentsQuery.data.data.map((establishment) => (
                <EstablishmentCard
                  key={establishment.id}
                  establishment={establishment}
                  onPress={() => navigation.navigate('EstablishmentDetail', { establishmentId: establishment.id })}
                />
              ))}
            </View>
          ) : (
            <EmptyState icon={Building2} title="Nenhum estabelecimento por aqui ainda" subtitle="Volte em breve — novos parceiros chegam toda semana." />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
