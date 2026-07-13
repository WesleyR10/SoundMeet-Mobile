import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { Star, Clock, Wallet, QrCode } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useMusician } from '../../application/useMusician';
import { formatPriceRange } from '../../domain/musician.constants';
import { ProfileStatCard } from '../components/ProfileStatCard';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileTagPills } from '../components/ProfileTagPills';
import { ProfileSocialLinks } from '../components/ProfileSocialLinks';
import { ProfileLogoutButton } from '../components/ProfileLogoutButton';
import type { ProfileScreenProps } from '@/navigation/types';

type Props = ProfileScreenProps<'ViewProfile'>;

// Stagger por seção (header → stats → tags → socials), inspirado no reveal em
// cascata do mockup de referência (Home do Músico.dc.html, `data-reveal` +
// transitionDelay incremental) — mesmo mecanismo manual de useSharedValue já
// usado no resto do app (sem a API declarativa `entering`, para consistência).
function useReveal(delay: number) {
  const opacity = useSharedValue(0);
  const y       = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
    y.value       = withDelay(delay, withTiming(0, { duration: 420 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: y.value }],
  }));
}

export function ViewProfileScreen({ navigation }: Props) {
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data: musician, isPending, isError, refetch } = useMusician(musicianId);

  const headerStyle = useReveal(60);
  const statsStyle  = useReveal(140);
  const tagsStyle   = useReveal(220);
  const socialStyle = useReveal(300);
  const logoutStyle = useReveal(380);

  if (isPending) {
    return (
      <SafeAreaView style={s.loaderRoot} edges={['top']}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.brand.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (isError || !musician) {
    return (
      <SafeAreaView style={s.loaderRoot} edges={['top']}>
        <StatusBar style="light" />
        <ErrorBanner message="Não conseguimos carregar seu perfil." style={s.errorBanner} />
        <Pressable onPress={() => refetch()} style={s.retryBtn} accessibilityRole="button" accessibilityLabel="Tentar novamente">
          <Text style={s.retryText}>Tentar novamente</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const priceLabel = formatPriceRange(musician.profile?.price_range ?? null);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <Animated.View style={headerStyle}>
            <ProfileHeader musician={musician} />
          </Animated.View>

          <Animated.View style={[s.statsRow, statsStyle]}>
            <ProfileStatCard icon={Clock} value={String(musician.profile?.experience ?? musician.experience_years)} label="anos de palco" />
            <ProfileStatCard icon={Star} value={musician.rating.toFixed(1)} label="nota média" accentColor={colors.accent.amber} />
            <ProfileStatCard icon={Wallet} value={priceLabel ?? '—'} label="faixa de preço" accentColor={colors.accent.violet} />
          </Animated.View>

          <Animated.View style={[s.tagsGroup, tagsStyle]}>
            <ProfileTagPills title="Instrumentos" items={musician.instruments} color={colors.brand.primary} />
            <ProfileTagPills title="Gêneros musicais" items={musician.genres} color={colors.accent.coral} />
          </Animated.View>

          <Animated.View style={socialStyle}>
            <ProfileSocialLinks socialLinks={musician.profile?.social_links ?? null} />
          </Animated.View>

          <Animated.View style={logoutStyle}>
            <ProfileLogoutButton />
          </Animated.View>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <Pressable
          onPress={() => navigation.navigate('QRCode')}
          style={s.qrBtn}
          accessibilityRole="button"
          accessibilityLabel="Ver meu QR Code"
        >
          <QrCode size={22} color={colors.brand.primary} />
        </Pressable>
        <PrimaryButton style={s.editBtn} label="Editar perfil" onPress={() => navigation.navigate('EditProfile')} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  loaderRoot: {
    flex:            1,
    backgroundColor: colors.bg.primary,
    alignItems:      'center',
    justifyContent:  'center',
    gap:              spacing.md,
    padding:          spacing.xl,
  },
  errorBanner: {
    marginBottom: spacing.sm,
  },
  retryBtn: {
    backgroundColor:   colors.brand.primary,
    borderRadius:      radius.xl,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  retryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
  },
  scroll: {
    padding:       spacing.xl,
    paddingBottom: 140,
  },
  content: {
    gap: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap:            spacing.md,
  },
  tagsGroup: {
    gap: spacing.xxl,
  },
  footer: {
    position:      'absolute',
    left:           0,
    right:          0,
    bottom:         0,
    flexDirection: 'row',
    gap:            spacing.md,
    padding:        spacing.xl,
    paddingTop:     spacing.xxxl,
  },
  qrBtn: {
    width:           48,
    height:          48,
    borderRadius:    24,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: colors.brand.muted,
    borderWidth:     1,
    borderColor:     colors.border.brand,
  },
  editBtn: {
    flex: 1,
  },
});
