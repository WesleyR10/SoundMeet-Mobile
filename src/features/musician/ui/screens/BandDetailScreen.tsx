import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Users, UserPlus } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { Avatar } from '@/shared/components/Avatar';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useBand } from '../../application/useBands';
import { BandMemberRow } from '../components/BandMemberRow';
import { BandTipSplitCard } from '../components/BandTipSplitCard';
import { BandAgendaSummary } from '../components/BandAgendaSummary';
import { BandLeaderSettingsSection } from '../components/BandLeaderSettingsSection';
import { InviteMemberSheet } from '../components/InviteMemberSheet';
import type { ProfileScreenProps } from '@/navigation/types';

type Props = ProfileScreenProps<'BandDetail'>;

// Detalhe de uma banda (v2, jul/2026) — membros com status de convite
// (pending/accepted/declined), regra de split de gorjeta e agenda dos
// próximos 30 dias. Convidar/remover membro e as seções de
// Disponibilidade/Endereço só aparecem pra quem é líder (BandMember.role
// === 'leader') — restrição só de UI, ver plano/CLAUDE.md sobre o guard do
// backend não distinguir líder ainda.
export function BandDetailScreen({ route, navigation }: Props) {
  const { bandId } = route.params;
  const myMusicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data: band, isPending, isError, refetch } = useBand(bandId);
  const [inviteSheetVisible, setInviteSheetVisible] = useState(false);

  const isLeader = band?.members.some((m) => m.musician_id === myMusicianId && m.role === 'leader') ?? false;

  function renderBody() {
    if (isPending) {
      return (
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      );
    }

    if (isError || !band) {
      return (
        <View style={s.centerRoot}>
          <ErrorBanner message="Não conseguimos carregar esta banda." />
          <Pressable onPress={() => refetch()} style={s.retryBtn} accessibilityRole="button" accessibilityLabel="Tentar novamente">
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.heroRow}>
          <Avatar
            uri={band.avatar}
            size={64}
            fallbackIcon={Users}
            ringColors={[colors.accent.violet, colors.brand.primary]}
          />
          <View style={s.heroText}>
            <Text style={s.bandName}>{band.name}</Text>
            {!!band.genres.length && (
              <Text style={s.genres} numberOfLines={1}>{band.genres.join(' · ')}</Text>
            )}
          </View>
        </View>

        {!!band.description && <Text style={s.description}>{band.description}</Text>}

        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Membros ({band.members.length})</Text>
            {isLeader && (
              <Pressable
                onPress={() => setInviteSheetVisible(true)}
                style={s.inviteBtn}
                accessibilityRole="button"
                accessibilityLabel="Convidar membro"
                hitSlop={8}
              >
                <UserPlus size={16} color={colors.brand.primary} />
                <Text style={s.inviteBtnLabel}>Convidar</Text>
              </Pressable>
            )}
          </View>
          <View style={s.card}>
            {band.members.map((member) => (
              <BandMemberRow
                key={member.member_id}
                member={member}
                bandId={band.id}
                canManage={isLeader}
              />
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Gorjetas</Text>
          {/* Só membros "accepted" recebem parte da gorjeta — pending/declined
              não contam (regra de negócio, ver Docs do backend). */}
          <BandTipSplitCard activeMemberCount={band.members.filter((m) => m.status === 'accepted').length} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Agenda</Text>
          <View style={s.card}>
            <BandAgendaSummary bandId={band.id} />
          </View>
        </View>

        {isLeader && (
          <View style={s.section}>
            <BandLeaderSettingsSection band={band} musicianId={myMusicianId} />
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
        <Text style={s.title}>Banda</Text>
        <View style={s.iconBtn} />
      </View>

      {renderBody()}

      {isLeader && (
        <InviteMemberSheet
          visible={inviteSheetVisible}
          onClose={() => setInviteSheetVisible(false)}
          bandId={bandId}
          musicianId={myMusicianId}
          existingMemberIds={band?.members.filter((m) => m.status !== 'declined').map((m) => m.musician_id) ?? []}
        />
      )}
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
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.xxl,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.lg,
  },
  heroText: {
    flex: 1,
    gap:   spacing.xs,
  },
  bandName: {
    ...typography.title,
    color: colors.text.primary,
  },
  genres: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
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
  card: {
    gap:                spacing.lg,
    padding:            spacing.lg,
    borderRadius:       radius.lg,
    borderWidth:         1,
    borderColor:        colors.border.default,
    backgroundColor:    'rgba(255,255,255,0.03)',
  },
  sectionHeaderRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  inviteBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical:   spacing.xs,
    borderRadius:      radius.sm,
    backgroundColor:  colors.brand.muted,
  },
  inviteBtnLabel: {
    ...typography.caption,
    fontFamily: 'Inter-Bold',
    color:      colors.brand.primary,
  },
});
