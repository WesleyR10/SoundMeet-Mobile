import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { ConfettiBurst } from '@/shared/components/ConfettiBurst';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { MusicianTabScreenProps } from '@/navigation/types';
import { useWallet } from '../../application/useWallet';
import { useWalletSocket } from '../../application/useWalletSocket';
import { getWithdrawEligibility } from '../../domain/tip.types';
import { WalletBalanceCard } from '../components/WalletBalanceCard';
import { WithdrawProgressBar } from '../components/WithdrawProgressBar';
import { TipHistoryList } from '../components/TipHistoryList';

type Props = MusicianTabScreenProps<'Wallet'>;

// Mesmo padrão hand-rolled de reveal em cascata de ViewProfileScreen/HomeScreen
// (sem hook compartilhado — duplicado por tela de propósito, ver CLAUDE.md).
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

const WALLET_GLOWS = [
  { color: 'rgba(255,107,107,0.16)', size: 320, top: -120, left: -80, duration: 7000 },
  { color: 'rgba(255,46,122,0.14)', size: 280, bottom: -100, right: -90, duration: 9000 },
];

export function WalletScreen(_props: Props) {
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data: wallet, isPending, isError, refetch } = useWallet(musicianId);
  const celebration = useWalletSocket(musicianId);

  const balanceStyle = useReveal(60);
  const progressStyle = useReveal(140);
  const historyTitleStyle = useReveal(200);
  const historyStyle = useReveal(260);

  if (isPending) {
    return (
      <SafeAreaView style={s.loaderRoot} edges={['top']}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.accent.coral} size="large" />
      </SafeAreaView>
    );
  }

  if (isError || !wallet) {
    return (
      <SafeAreaView style={s.loaderRoot} edges={['top']}>
        <StatusBar style="light" />
        <ErrorBanner message="Não conseguimos carregar sua carteira." style={s.errorBanner} />
        <Pressable onPress={() => refetch()} style={s.retryBtn} accessibilityRole="button" accessibilityLabel="Tentar novamente">
          <Text style={s.retryText}>Tentar novamente</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const eligibility = getWithdrawEligibility(wallet);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground glows={WALLET_GLOWS} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <Animated.View style={balanceStyle}>
            <Text style={s.screenTitle}>Gorjetas</Text>
            <WalletBalanceCard wallet={wallet} />
          </Animated.View>

          <Animated.View style={progressStyle}>
            <WithdrawProgressBar eligibility={eligibility} />
          </Animated.View>

          <Animated.View style={historyTitleStyle}>
            <Text style={s.sectionTitle}>Histórico</Text>
          </Animated.View>

          <Animated.View style={historyStyle}>
            <TipHistoryList musicianId={musicianId} />
          </Animated.View>
        </View>
      </ScrollView>

      {/* Declarado DEPOIS do ScrollView de propósito — irmãos do RN empilham por
          ordem de declaração (sem zIndex explícito), então isso garante que o
          burst pinte por cima do conteúdo da tela em vez de atrás dele. */}
      <View style={s.confettiLayer} pointerEvents="none">
        <ConfettiBurst trigger={celebration.trigger} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  loaderRoot: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  errorBanner: {
    marginBottom: spacing.sm,
  },
  retryBtn: {
    backgroundColor: colors.accent.coral,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  retryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color: colors.text.inverse,
  },
  confettiLayer: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    width: 1,
    height: 1,
  },
  scroll: {
    padding: spacing.xl,
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
  sectionTitle: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color: colors.text.primary,
  },
});
