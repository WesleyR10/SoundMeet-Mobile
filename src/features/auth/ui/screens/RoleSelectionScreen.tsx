import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { ArrowLeft, Guitar, Users } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AuthGlowBackground } from '../components/AuthGlowBackground';
import { RoleVideoBackground } from '../components/RoleVideoBackground';
import { RoleCard } from '../components/RoleCard';
import { usePendingGoogleSessionStore } from '@/shared/services/auth/pendingGoogleSession.store';
import { useSocialSignup, getSocialSignupErrorMessage } from '@/features/auth/application/useSocialSignup';
import type { AuthScreenProps } from '@/navigation/types';
import type { RegisterRole } from '@/features/auth/domain/auth.types';

type Props = AuthScreenProps<'RoleSelection'>;

const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  backBtn: {
    width:          48,
    height:         48,
    marginLeft:     spacing.lg,
    marginTop:      spacing.sm,
    alignItems:     'center',
    justifyContent: 'center',
  },
  content: {
    flex:              1,
    paddingHorizontal: spacing.xl,
    justifyContent:    'center',
    gap:               spacing.xxl,
  },
  header: {
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  1.5,
    color:          colors.brand.primary,
  },
  title: {
    ...typography.displayMd,
    fontFamily: 'SpaceGrotesk-Bold',
    color:      colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  cards: {
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxl,
    gap:               spacing.md,
  },
}));

export function RoleSelectionScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const [role, setRole] = useState<RegisterRole | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Presente quando o usuário veio de um login Google sem cadastro prévio no
  // SoundMeet (roles vazias) — nesse caso "Continuar" pula o formulário de
  // senha inteiramente, já que o Google já autenticou a identidade.
  const pendingSession = usePendingGoogleSessionStore((s) => s.session);
  const socialSignupMutation = useSocialSignup();

  const headerOpacity = useSharedValue(0);
  const headerY       = useSharedValue(16);
  const card1Opacity  = useSharedValue(0);
  const card1Y        = useSharedValue(20);
  const card2Opacity  = useSharedValue(0);
  const card2Y        = useSharedValue(20);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    headerY.value       = withTiming(0, { duration: 400 });
    card1Opacity.value  = withDelay(150, withTiming(1, { duration: 400 }));
    card1Y.value        = withDelay(150, withTiming(0, { duration: 400 }));
    card2Opacity.value  = withDelay(260, withTiming(1, { duration: 400 }));
    card2Y.value        = withDelay(260, withTiming(0, { duration: 400 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));
  const card1Style = useAnimatedStyle(() => ({
    opacity: card1Opacity.value,
    transform: [{ translateY: card1Y.value }],
  }));
  const card2Style = useAnimatedStyle(() => ({
    opacity: card2Opacity.value,
    transform: [{ translateY: card2Y.value }],
  }));

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <AuthGlowBackground variant="full" role={role} />
      <RoleVideoBackground role={role} />

      <Pressable
        onPress={() => navigation.goBack()}
        style={s.backBtn}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <ArrowLeft size={22} color={colors.text.primary} />
      </Pressable>

      <View style={s.content}>
        <Animated.View style={[s.header, headerStyle]}>
          <Text style={s.eyebrow}>QUASE LÁ</Text>
          <Text style={s.title}>Como você quer usar o SoundMeet?</Text>
          <Text style={s.subtitle}>
            {pendingSession
              ? 'Você ainda não tem conta — escolha como quer usar o SoundMeet.'
              : 'Você poderá adicionar o outro papel depois, a qualquer momento.'}
          </Text>
        </Animated.View>

        <View style={s.cards}>
          <Animated.View style={card1Style}>
            <RoleCard
              icon={Guitar}
              emoji="🎸"
              title="Sou Músico"
              subtitle="Receba pedidos e gorjetas ao vivo, monte repertório e mostre seu QR Code."
              accentColor={colors.brand.primary}
              selected={role === 'musician'}
              dimmed={role !== null && role !== 'musician'}
              onPress={() => setRole('musician')}
            />
          </Animated.View>

          <Animated.View style={card2Style}>
            <RoleCard
              icon={Users}
              emoji="🎵"
              title="Sou Fã"
              subtitle="Peça músicas, mande gorjeta via PIX e suba no ranking dos shows que curte."
              accentColor={colors.accent.coral}
              selected={role === 'audience'}
              dimmed={role !== null && role !== 'audience'}
              onPress={() => setRole('audience')}
            />
          </Animated.View>
        </View>
      </View>

      <View style={s.footer}>
        {!!bannerError && <ErrorBanner message={bannerError} />}

        <PrimaryButton
          label="Continuar"
          disabled={!role}
          loading={socialSignupMutation.isPending}
          onPress={async () => {
            if (!role) return;

            if (!pendingSession) {
              navigation.navigate('Register', { role });
              return;
            }

            if (role === 'musician') {
              navigation.navigate('CompleteMusicianSignup');
              return;
            }

            setBannerError(null);
            try {
              await socialSignupMutation.mutateAsync({ role: 'audience' });
              // Sucesso: auth.store.isAuthenticated vira true e o RootNavigator troca
              // de stack reativamente, igual aos demais fluxos de login/registro.
            } catch (err) {
              setBannerError(getSocialSignupErrorMessage(err));
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}
