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
import { useConnectMercadoPago, useWallet } from '../../application/useWallet';
import { useWalletSocket } from '../../application/useWalletSocket';
import { getWithdrawEligibility } from '../../domain/tip.types';
import { EscrowHistoryList } from '../components/EscrowHistoryList';
import { MercadoPagoLinkCard } from '../components/MercadoPagoLinkCard';
import { WalletBalanceCard } from '../components/WalletBalanceCard';
import { WalletSectionHeader } from '../components/WalletSectionHeader';
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
  const connectMercadoPago = useConnectMercadoPago(musicianId);

  const balanceStyle = useReveal(60);
  const linkStyle = useReveal(110);
  const progressStyle = useReveal(140);
  const escrowTitleStyle = useReveal(190);
  const escrowListStyle = useReveal(240);
  const historyTitleStyle = useReveal(300);
  const historyStyle = useReveal(360);

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
            {/* "Carteira", não "Gorjetas": o saldo daqui é o cachê liberado da
                custódia — a gorjeta cai direto na conta Mercado Pago. */}
            <Text style={s.screenTitle}>Carteira</Text>
            <WalletBalanceCard wallet={wallet} />
          </Animated.View>

          <Animated.View style={linkStyle}>
            <MercadoPagoLinkCard
              linked={wallet.mp_linked}
              isConnecting={connectMercadoPago.isPending}
              onConnect={() => connectMercadoPago.mutate()}
            />
          </Animated.View>

          <Animated.View style={progressStyle}>
            <WithdrawProgressBar eligibility={eligibility} />
          </Animated.View>

          <Animated.View style={escrowTitleStyle}>
            {/*
              Vem ANTES do extrato de gorjetas de propósito: é dinheiro a
              receber (ação futura), enquanto gorjeta é dinheiro já recebido
              (histórico). O que ainda vai acontecer importa mais.
            */}
            <WalletSectionHeader
              title="Cachês em custódia"
              subtitle="Garantidos antes do show, liberados depois dele"
            />
          </Animated.View>

          <Animated.View style={escrowListStyle}>
            <EscrowHistoryList musicianId={musicianId} />
          </Animated.View>

          <Animated.View style={historyTitleStyle}>
            {/*
              EXTRATO, não saldo: cada gorjeta desta lista já foi paga direto na
              conta Mercado Pago do músico. Chamar de "histórico da carteira"
              sugeriria que o dinheiro passou por aqui — e ele nunca passou.
            */}
            <WalletSectionHeader
              title="Extrato de gorjetas"
              subtitle="Recebidas direto na sua conta Mercado Pago"
            />
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
});
