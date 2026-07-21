import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { QrCode } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { logout } from '@/shared/services/auth/keycloak.service';
import { RoleSwitchSheet } from '@/navigation/components/RoleSwitchSheet';
import { useMusician } from '../../application/useMusician';
import { useMyBands } from '../../application/useBands';
import { ProfileIdentityBlock } from '../components/ProfileIdentityBlock';
import { ProfileInfoSection } from '../components/ProfileInfoSection';
import { ProfileSocialLinks } from '../components/ProfileSocialLinks';
import { ProfileMenuGroups } from '../components/ProfileMenuGroups';
import type { ProfileScreenProps, MusicianTabParamList, RootStackParamList } from '@/navigation/types';

type Props = ProfileScreenProps<'ViewProfile'>;

function confirmLogout() {
  Alert.alert(
    'Sair da conta',
    'Você precisará entrar novamente para acessar o app.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => { void logout(); } },
    ],
  );
}

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
  // Mesma query de MyBandsScreen (cache compartilhado, sem fetch extra) — só
  // pra contar convites de banda pendentes e alimentar o badge do menu.
  const { data: bands } = useMyBands(musicianId);
  const pendingBandInvites = (bands ?? []).filter(
    (b) => b.members.some((m) => m.musician_id === musicianId && m.status === 'pending'),
  ).length;
  const [accountsVisible, setAccountsVisible] = useState(false);

  // ViewProfile fica dois níveis abaixo do Root (Root → MusicianTabs →
  // ProfileStack → ViewProfile) — um getParent() alcança a tab irmã
  // (Wallet/Repertoire), dois alcançam o Root (Agenda/ConversationList/Plans).
  // Mesmo racional documentado em HomeScreen.tsx, só que ali Home é filha
  // direta da tab, então um getParent() já chega no Root.
  const tabNavigation = navigation.getParent<BottomTabNavigationProp<MusicianTabParamList>>();
  const rootNavigation = tabNavigation?.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const menuStyle   = useReveal(260);
  const infoStyle   = useReveal(340);
  const socialStyle = useReveal(420);

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

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <ProfileIdentityBlock musician={musician} />

          <Animated.View style={menuStyle}>
            <ProfileMenuGroups
              onPressQrCode={() => navigation.navigate('QRCode')}
              onPressRepertoire={() => tabNavigation?.navigate('Repertoire', { screen: 'RepertoireList' })}
              onPressTuner={() => navigation.navigate('Tuner')}
              onPressAnalytics={() => navigation.navigate('Analytics')}
              onPressWallet={() => tabNavigation?.navigate('Wallet')}
              onPressPlans={() => rootNavigation?.navigate('Plans')}
              onPressBands={() => navigation.navigate('MyBands')}
              bandsBadgeCount={pendingBandInvites}
              onPressAgenda={() => rootNavigation?.navigate('Agenda')}
              onPressConversations={() => rootNavigation?.navigate('ConversationList')}
              onPressEditProfile={() => navigation.navigate('EditProfile')}
              onPressSwitchAccount={() => setAccountsVisible(true)}
              onPressLogout={confirmLogout}
            />
          </Animated.View>

          <Animated.View style={infoStyle}>
            <ProfileInfoSection musician={musician} />
          </Animated.View>

          <Animated.View style={socialStyle}>
            <ProfileSocialLinks socialLinks={musician.profile?.social_links ?? null} />
          </Animated.View>
        </View>
      </ScrollView>

      <RoleSwitchSheet
        visible={accountsVisible}
        onClose={() => setAccountsVisible(false)}
        context="musician"
      />

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
