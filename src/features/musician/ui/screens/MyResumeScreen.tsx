import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  BadgeCheck,
  Building2,
  CalendarCheck,
  MapPin,
  Music2,
  Star,
  Users,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { RootScreenProps } from '@/navigation/types';
import { useMyResume } from '../../application/usePerformance';
import { ReportStatCard } from '../components/ReportStatCard';

type Props = RootScreenProps<'MyResume'>;

/**
 * Currículo verificado (F4) — a versão do próprio músico.
 *
 * 🔴 **Nada aqui é editável, e é essa a feature.** O músico não escreve uma
 * linha: cada número vem de booking concluído, check-in, presença registrada
 * por QR e avaliação com contexto. É o que o separa da bio — que ele escreve, e
 * que qualquer contratante desconta.
 *
 * Nenhum valor de cachê aparece, nem nesta tela em que só ele se vê: o dado não
 * existe no output do backend, e é o mesmo endpoint que serve o perfil público.
 */
export function MyResumeScreen(_props: Props) {
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data: resume, isPending, isError } = useMyResume(musicianId);

  if (isPending) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.center}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !resume) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.center}>
          <ErrorBanner message="Não conseguimos carregar seu currículo." />
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = resume.shows_completed === 0;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.titleRow}>
          <BadgeCheck size={22} color={colors.brand.primary} />
          <Text style={s.title}>Currículo verificado</Text>
        </View>
        <Text style={s.subtitle}>
          Tudo aqui é apurado pela plataforma a partir de shows concluídos.
          Você não edita nada — e é exatamente por isso que vale como prova.
        </Text>

        {isEmpty ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>Seu currículo começa no primeiro show</Text>
            <Text style={s.emptyText}>
              Ao concluir um show contratado pela plataforma, ele entra aqui
              automaticamente — com local, público presente e avaliação.
            </Text>
          </View>
        ) : (
          <>
            <View style={s.grid}>
              <ReportStatCard
                icon={Building2}
                value={String(resume.shows_completed)}
                label={resume.shows_completed === 1 ? 'show realizado' : 'shows realizados'}
                hint={`${resume.shows_with_checkin} com check-in`}
                accentColor={colors.brand.primary}
              />
              <ReportStatCard
                icon={MapPin}
                value={String(resume.distinct_venues)}
                label={resume.distinct_venues === 1 ? 'casa diferente' : 'casas diferentes'}
                accentColor={colors.accent.violet}
              />
              <ReportStatCard
                icon={Users}
                value={String(resume.audience_reached)}
                label="pessoas alcançadas"
                accentColor={colors.accent.amber}
              />
              <ReportStatCard
                icon={Music2}
                value={String(resume.distinct_songs_performed)}
                label="músicas no palco"
                accentColor={colors.accent.coral}
              />
              <ReportStatCard
                icon={Star}
                value={resume.rating_average.toFixed(1)}
                label="de média"
                hint={`${resume.rating_total} ${resume.rating_total === 1 ? 'avaliação' : 'avaliações'}`}
                accentColor={colors.accent.amber}
              />
              <ReportStatCard
                icon={CalendarCheck}
                value={String(resume.months_active)}
                label={resume.months_active === 1 ? 'mês de estrada' : 'meses de estrada'}
                accentColor={colors.brand.primary}
              />
            </View>

            {resume.venues.length > 0 && (
              <View style={s.venuesCard}>
                <Text style={s.venuesHeading}>Onde você já tocou</Text>
                {resume.venues.map((venue) => (
                  <View key={venue.establishment_id} style={s.venueRow}>
                    <Text style={s.venueName} numberOfLines={1}>{venue.name}</Text>
                    <Text style={s.venueCount}>
                      {venue.shows_count}{venue.shows_count === 1 ? ' show' : ' shows'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {resume.distinct_songs_performed === 0 && !isEmpty && (
          <Text style={s.footnote}>
            A contagem de músicas no palco começa nos shows em que você usa o
            modo ao vivo — shows anteriores não têm esse registro.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  center: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: spacing.xl,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.xxxl,
    gap:               spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    marginTop: -spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing.md,
  },
  emptyCard: {
    gap:             spacing.sm,
    padding:         spacing.lg,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.border.default,
    backgroundColor: colors.bg.elevated,
  },
  emptyTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  venuesCard: {
    gap:             spacing.sm,
    padding:         spacing.lg,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.border.default,
    backgroundColor: colors.bg.elevated,
  },
  venuesHeading: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  venueRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:             spacing.md,
  },
  venueName: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex:  1,
  },
  venueCount: {
    ...typography.caption,
    color: colors.text.muted,
  },
  footnote: {
    ...typography.caption,
    color: colors.text.muted,
  },
});
