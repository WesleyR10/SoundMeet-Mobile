import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import type { ThemeColors } from '@/shared/services/ThemeContext';
import { Skeleton, SkeletonList, SkeletonStatRow } from '@/shared/components/Skeleton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { GlowCard } from '@/shared/components/GlowCard';
import { AnimatedBalance } from '@/shared/components/AnimatedBalance';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { isPlanLimitError } from '@/shared/services/http/types';
import { useAnalytics } from '../../application/useAnalytics';
import { AnalyticsHeroStats } from '../components/AnalyticsHeroStats';
import { RequestsOutcomeChart } from '../components/RequestsOutcomeChart';
import { TopSongsList } from '../components/TopSongsList';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MusicianTabParamList, ProfileScreenProps, RootStackParamList } from '@/navigation/types';

type Props = ProfileScreenProps<'Analytics'>;

// Mesmo padrão hand-rolled de reveal em cascata de WalletScreen (Bloco 5) —
// sem hook compartilhado, duplicado por tela de propósito (ver CLAUDE.md).
function useReveal(delay: number) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
    y.value = withDelay(delay, withTiming(0, { duration: 420 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));
}

// Teal+âmbar (paleta "Analytics" do design-system.md), distinto do
// coral/rosa da WalletScreen e do teal+violeta default do resto do app.
/*
 * Função do tema, não constante de módulo: array avaliado no carregamento
 * congelaria o glow do tema escuro sobre um fundo claro.
 */
const analyticsGlows = (colors: ThemeColors) => [
  { color: colors.brand.glow, size: 300, top: -100, left: -90, duration: 8000 },
  { color: `${colors.accent.amber}28`, size: 280, bottom: -100, right: -80, duration: 9500 },
];

// AnalyticsScreen (Bloco 6) — empurrada na stack de Perfil (não é tab), mesmo
// padrão de back button de QRCodeScreen. Dado é all-time/global (sem escopo
// por evento — nenhum endpoint de requests/tips filtra por event_id hoje),
// por isso o texto evita "gorjetas do evento" e usa "total em gorjetas".
const useStyles = makeStyles((colors) => ({
  // Mesmo respiro do conteúdo real — é o que evita o salto na troca.
  skeleton: { flex: 1, gap: spacing.xl, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  backBtn: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loaderRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  retryBtn: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  retryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color: colors.text.inverse,
  },
  gateTitle: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
  },
  gateBody: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  scroll: {
    padding: spacing.xl,
    paddingTop: spacing.xxxl + spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  content: {
    gap: spacing.xl,
  },
  screenTitle: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  tipsCard: {
    gap: spacing.xs,
  },
  tipsLabel: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  sectionTitle: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color: colors.text.primary,
  },
}));

export function AnalyticsScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data: analytics, isPending, isError, error, refetch } = useAnalytics(musicianId);
  const tabs = navigation.getParent<BottomTabNavigationProp<MusicianTabParamList>>();
  const root = tabs?.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const statsStyle = useReveal(60);
  const tipsStyle = useReveal(140);
  const chartStyle = useReveal(200);
  const songsTitleStyle = useReveal(260);
  const songsStyle = useReveal(320);

  function renderBody() {
    if (isPending) {
      return (
        <View style={s.skeleton}>
          <SkeletonStatRow count={3} />
          {/* O gráfico é o bloco alto; não é lista, é uma área só. */}
          <Skeleton height={220} borderRadius={radius.lg} />
          <SkeletonList count={3} itemHeight={64} />
        </View>
      );
    }

    // 402 não é erro de rede: é o gate 9.7a (`realtime_analytics`,
    // Essencial/Pro). Oferecer "tentar novamente" aqui seria mandar o músico
    // repetir uma ação que nunca vai funcionar no plano atual.
    if (isPlanLimitError(error)) {
      return (
        <View style={s.loaderRoot}>
          <Text style={s.gateTitle}>Analytics é do plano Essencial</Text>
          <Text style={s.gateBody}>
            Veja pedidos aceitos e recusados, total em gorjetas e as músicas que mais te pedem.
          </Text>
          <Pressable
            onPress={() => root?.navigate('Plans')}
            style={s.retryBtn}
            accessibilityRole="button"
            accessibilityLabel="Ver planos"
          >
            <Text style={s.retryText}>Ver planos</Text>
          </Pressable>
        </View>
      );
    }

    if (isError || !analytics) {
      return (
        <View style={s.loaderRoot}>
          <ErrorBanner message="Não conseguimos carregar seus dados de analytics." />
          <Pressable onPress={() => refetch()} style={s.retryBtn} accessibilityRole="button" accessibilityLabel="Tentar novamente">
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <Animated.View style={statsStyle}>
            <Text style={s.screenTitle}>Analytics</Text>
            <AnalyticsHeroStats analytics={analytics} />
          </Animated.View>

          <Animated.View style={tipsStyle}>
            <GlowCard accentColor={colors.accent.amber} style={s.tipsCard}>
              <Text style={s.tipsLabel}>Total em gorjetas</Text>
              <AnimatedBalance value={analytics.total_tips_amount} />
            </GlowCard>
          </Animated.View>

          <Animated.View style={chartStyle}>
            <RequestsOutcomeChart
              accepted={analytics.accepted_requests_count}
              rejected={analytics.rejected_requests_count}
            />
          </Animated.View>

          <Animated.View style={songsTitleStyle}>
            <Text style={s.sectionTitle}>Músicas mais pedidas</Text>
          </Animated.View>

          <Animated.View style={songsStyle}>
            <TopSongsList songs={analytics.top_requested_songs} />
          </Animated.View>
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground glows={analyticsGlows(colors)} />

      <Pressable
        onPress={() => navigation.goBack()}
        style={s.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={8}
      >
        <ArrowLeft size={22} color={colors.text.primary} />
      </Pressable>

      {renderBody()}
    </SafeAreaView>
  );
}
