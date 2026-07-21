import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Users } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useMyBands } from '../../application/useBands';
import { useAcceptBandInvite, getAcceptBandInviteErrorMessage } from '../../application/useAcceptBandInvite';
import { useDeclineBandInvite, getDeclineBandInviteErrorMessage } from '../../application/useDeclineBandInvite';
import { BandListItem } from '../components/BandListItem';
import { BandInviteCard } from '../components/BandInviteCard';
import type { ProfileScreenProps } from '@/navigation/types';

type Props = ProfileScreenProps<'MyBands'>;

// Gestão de banda (v2, jul/2026): "minhas bandas" agora mistura duas coisas
// vindas do MESMO GET /bands?filter[musician_id]= — convites pendentes
// (status "pending" na minha própria linha de membro) sobem pro topo como
// BandInviteCard (swipe aceitar/recusar), e bandas onde já sou "accepted"
// continuam como antes (BandListItem). "declined" não aparece em nenhuma das
// duas — já é decisão passada. Sem fetch novo: o filtro é client-side sobre
// os dados que useMyBands já traz.
export function MyBandsScreen({ navigation }: Props) {
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data, isPending, isError, isRefetching, refetch } = useMyBands(musicianId);
  const [failedInviteId, setFailedInviteId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const acceptInvite = useAcceptBandInvite(musicianId);
  const declineInvite = useDeclineBandInvite(musicianId);

  const handleAccept = async (bandId: string) => {
    setInviteError(null);
    setFailedInviteId(null);
    try {
      await acceptInvite.mutateAsync(bandId);
    } catch (err) {
      setInviteError(getAcceptBandInviteErrorMessage(err));
      setFailedInviteId(bandId);
    }
  };

  const handleDecline = async (bandId: string) => {
    setInviteError(null);
    setFailedInviteId(null);
    try {
      await declineInvite.mutateAsync(bandId);
    } catch (err) {
      setInviteError(getDeclineBandInviteErrorMessage(err));
      setFailedInviteId(bandId);
    }
  };

  function renderBody() {
    if (isPending) {
      return (
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={s.centerRoot}>
          <ErrorBanner message="Não conseguimos carregar suas bandas." />
          <Pressable onPress={() => refetch()} style={s.retryBtn} accessibilityRole="button" accessibilityLabel="Tentar novamente">
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    const bands = data ?? [];
    const findMyMember = (bandMembers: typeof bands[number]['members']) =>
      bandMembers.find((m) => m.musician_id === musicianId);

    const pendingBands = bands.filter((b) => findMyMember(b.members)?.status === 'pending');
    const acceptedBands = bands.filter((b) => findMyMember(b.members)?.status === 'accepted');

    if (bands.length === 0 || (pendingBands.length === 0 && acceptedBands.length === 0)) {
      return (
        <View style={s.centerRoot}>
          <Users size={40} color={colors.text.muted} />
          <Text style={s.emptyTitle}>Você ainda não faz parte de nenhuma banda</Text>
          <Text style={s.emptySubtitle}>Peça pro líder de uma banda te convidar por aqui.</Text>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl tintColor={colors.brand.primary} refreshing={isRefetching} onRefresh={() => refetch()} />
        }
      >
        {pendingBands.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Convites pendentes</Text>
            {!!inviteError && <ErrorBanner message={inviteError} style={s.inviteError} />}
            {pendingBands.map((band) => {
              const myMember = findMyMember(band.members)!;
              return (
                <BandInviteCard
                  key={band.id}
                  band={band}
                  myMember={myMember}
                  disabled={acceptInvite.isPending || declineInvite.isPending}
                  failed={failedInviteId === band.id}
                  onAccept={() => handleAccept(band.id)}
                  onReject={() => handleDecline(band.id)}
                />
              );
            })}
          </View>
        )}

        {acceptedBands.length > 0 && (
          <View style={s.section}>
            {pendingBands.length > 0 && <Text style={s.sectionTitle}>Minhas bandas</Text>}
            {acceptedBands.map((item, index) => (
              <BandListItem
                key={item.id}
                band={item}
                riseDelay={index * 60}
                onPress={() => navigation.navigate('BandDetail', { bandId: item.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <View style={s.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={s.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={8}
        >
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={s.title}>Minhas bandas</Text>
        <View style={s.iconBtn} />
      </View>

      {renderBody()}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.lg,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  iconBtn: {
    width:          48,
    height:         48,
    alignItems:     'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.8,
    textTransform: 'uppercase',
    color:          colors.text.secondary,
  },
  inviteError: {
    marginBottom: spacing.sm,
  },
  centerRoot: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:              spacing.md,
    padding:          spacing.xl,
  },
  emptyTitle: {
    ...typography.title,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
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
});
