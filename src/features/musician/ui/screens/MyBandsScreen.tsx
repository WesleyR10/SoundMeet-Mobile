import { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Plus, Users } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { EmptyState } from '@/shared/components/EmptyState';
import { SkeletonList } from '@/shared/components/Skeleton';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useMyBands } from '../../application/useBands';
import { useAcceptBandInvite, getAcceptBandInviteErrorMessage } from '../../application/useAcceptBandInvite';
import { useDeclineBandInvite, getDeclineBandInviteErrorMessage } from '../../application/useDeclineBandInvite';
import { BandListItem } from '../components/BandListItem';
import { BandInviteCard } from '../components/BandInviteCard';
import { CreateBandSheet } from '../components/CreateBandSheet';
import type { ProfileScreenProps } from '@/navigation/types';

type Props = ProfileScreenProps<'MyBands'>;

// Gestão de banda (v2, jul/2026): "minhas bandas" agora mistura duas coisas
// vindas do MESMO GET /bands?filter[musician_id]= — convites pendentes
// (status "pending" na minha própria linha de membro) sobem pro topo como
// BandInviteCard (swipe aceitar/recusar), e bandas onde já sou "accepted"
// continuam como antes (BandListItem). "declined" não aparece em nenhuma das
// duas — já é decisão passada. Sem fetch novo: o filtro é client-side sobre
// os dados que useMyBands já traz.
const useStyles = makeStyles((colors) => ({
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
}));

export function MyBandsScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data, isPending, isError, isRefetching, refetch } = useMyBands(musicianId);
  const [failedInviteId, setFailedInviteId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

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
        <View style={s.listContent}>
          <SkeletonList count={3} itemHeight={88} withAvatar />
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
        /*
          Antes desta fatia o texto era só "peça pro líder de uma banda te
          convidar" — um beco sem saída: `POST /bands` existia no backend desde
          sempre e o app não o chamava, então a única forma de ter uma banda era
          alguém de fora criá-la. O convite continua sendo um caminho, mas agora
          não é o único.
        */
        <EmptyState
          icon={Users}
          title="Você ainda não faz parte de nenhuma banda"
          subtitle="Crie a sua e convide os integrantes, ou peça pro líder de uma banda te convidar."
          action={{ label: 'Criar banda', onPress: () => setCreateOpen(true) }}
        />
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
        <Pressable
          onPress={() => setCreateOpen(true)}
          style={s.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Criar banda"
          hitSlop={8}
        >
          <Plus size={22} color={colors.brand.primary} />
        </Pressable>
      </View>

      {renderBody()}

      <CreateBandSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        musicianId={musicianId}
        onCreated={(bandId) => navigation.navigate('BandDetail', { bandId })}
      />
    </SafeAreaView>
  );
}
