import { ScrollView, View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, BadgeCheck, User, Music, Clock } from 'lucide-react-native';
import { colors, spacing, radius, typography, gradients, shadows } from '@/shared/design-system/tokens';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import type { FanStackScreenProps } from '@/navigation/types';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useMusicianPublic } from '../../application/useMusicianPublic';
import { NowPlayingCard } from '../components/NowPlayingCard';
import { PublicStatCard } from '../components/PublicStatCard';
import { TagChipRow } from '../components/TagChipRow';
import { SocialLinksRow } from '../components/SocialLinksRow';
import { VerifiedResumeSection } from '../components/VerifiedResumeSection';

type Props = FanStackScreenProps<'MusicianPublicProfile'>;

const AVATAR_SIZE = 108;

export function MusicianPublicProfileScreen({ route, navigation }: Props) {
  const { musicianId, eventId, establishmentId } = route.params;
  const { data: musician, isPending } = useMusicianPublic(musicianId);
  const audienceId = useAuthStore((s) => s.user?.audienceId ?? null);

  if (isPending || !musician) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const name = musician.stage_name || musician.display_name || musician.name;
  const social = musician.profile?.social_links;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <LinearGradient colors={gradients.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatarRing}>
            <View style={s.avatarInner}>
              {musician.avatar ? (
                <Image source={{ uri: musician.avatar }} style={s.avatarImg} />
              ) : (
                <User size={40} color={colors.text.muted} />
              )}
            </View>
          </LinearGradient>

          <View style={s.nameRow}>
            <Text style={s.name}>{name}</Text>
            {musician.is_verified && <BadgeCheck size={20} color={colors.brand.primary} />}
          </View>

          <View style={s.ratingRow}>
            <Star size={15} color={colors.accent.amber} fill={colors.accent.amber} />
            <Text style={s.ratingText}>
              {musician.rating.toFixed(1)} · {musician.total_ratings} avaliaç{musician.total_ratings === 1 ? 'ão' : 'ões'}
            </Text>
          </View>

          {!!musician.bio && <Text style={s.bio}>{musician.bio}</Text>}
        </View>

        {/*
          Logo abaixo do nome, antes de qualquer estatística: durante um show é
          a informação mais útil da tela. Some sozinho fora de evento, sem set
          aberto, ou no intervalo entre duas músicas.
        */}
        <NowPlayingCard
          musicianId={musicianId}
          eventId={eventId}
          audienceId={audienceId}
        />

        <View style={s.statsRow}>
          <PublicStatCard icon={Clock} value={`${musician.experience_years} anos`} label="Experiência" accentColor={colors.brand.primary} />
          <PublicStatCard icon={Music} value={String(musician.genres.length)} label="Gêneros" accentColor={colors.accent.violet} />
        </View>

        <TagChipRow label="Instrumentos" tags={musician.instruments} accentColor={colors.brand.primary} />
        <TagChipRow label="Gêneros" tags={musician.genres} accentColor={colors.accent.violet} />

        <SocialLinksRow socialLinks={social ?? null} />

        {/*
          Currículo verificado (F4). Depois da bio de propósito: a bio é o que o
          artista diz de si, isto é o que a plataforma pode provar. Some por
          inteiro para quem ainda não tem show concluído — um bloco de zeros
          seria pior que ausência.
        */}
        <VerifiedResumeSection musicianId={musicianId} />

        <View style={s.ctaSection}>
          {eventId ? (
            <PrimaryButton
              label="Pedir uma música"
              onPress={() => navigation.navigate('SongRequest', { musicianId, eventId, establishmentId })}
            />
          ) : (
            <View style={s.ctaBlockedNote}>
              <Text style={s.ctaBlockedText}>
                Pedidos musicais só valem durante um evento ativo — escaneie o QR do músico no local do show pra pedir uma música.
              </Text>
            </View>
          )}

          <PrimaryButton
            label="Enviar gorjeta"
            variant="coral"
            onPress={() => navigation.navigate('TipMusician', { musicianId, eventId, establishmentId })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.xl,
  },
  centerRoot: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', gap: spacing.sm },
  avatarRing: {
    width:          AVATAR_SIZE,
    height:         AVATAR_SIZE,
    borderRadius:   AVATAR_SIZE / 2,
    padding:         3,
    alignItems:     'center',
    justifyContent: 'center',
    ...shadows.violet,
  },
  avatarInner: {
    width:            '100%',
    height:           '100%',
    borderRadius:     AVATAR_SIZE / 2,
    backgroundColor: colors.bg.surface,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:         'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  nameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
    marginTop:      spacing.sm,
  },
  name: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  ratingText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  bio: {
    ...typography.body,
    color:      colors.text.secondary,
    textAlign:  'center',
    marginTop:  spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap:            spacing.md,
  },
  ctaSection: { gap: spacing.md },
  ctaBlockedNote: {
    borderRadius:      radius.lg,
    borderWidth:         1,
    borderColor:        colors.border.default,
    backgroundColor:   'rgba(255,255,255,0.03)',
    padding:              spacing.md,
  },
  ctaBlockedText: {
    ...typography.bodySm,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
});
