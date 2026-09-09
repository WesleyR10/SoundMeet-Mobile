import { View, Text } from 'react-native';
import { BadgeCheck, Building2, MapPin, Music2, Users } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { useMusicianResume } from '../../application/useLivePerformance';

type Props = { musicianId: string };

/** Um currículo sem show realizado não é vitrine — é um bloco de zeros. */
function hasSomethingToShow(shows: number, songs: number) {
  return shows > 0 || songs > 0;
}

/**
 * Currículo verificado no perfil público.
 *
 * 🔴 **Cada número aqui tem prova no banco** — booking concluído, check-in do
 * artista, presença registrada por QR, avaliação com contexto. O músico não
 * escreve uma linha; é isso, e só isso, que separa esta seção da bio logo
 * acima, que aceita qualquer coisa.
 *
 * Nenhum valor de cachê aparece, e não é filtragem de UI: o backend nunca
 * produz o campo. Esta tela é lida por qualquer fã.
 */
const useStyles = makeStyles((colors) => ({
  root: {
    gap:             spacing.md,
    padding:         spacing.lg,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.border.default,
    backgroundColor: colors.bg.elevated,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  headerText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    rowGap:        spacing.md,
  },
  cell: {
    width:      '50%',
    gap:        2,
  },
  value: {
    ...typography.title,
    color: colors.text.primary,
  },
  label: {
    ...typography.caption,
    color: colors.text.muted,
  },
  venues: {
    gap: 2,
  },
  venuesLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  venuesList: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  footnote: {
    ...typography.caption,
    color: colors.text.muted,
  },
}));

export function VerifiedResumeSection({ musicianId }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { data: resume } = useMusicianResume(musicianId);

  if (!resume) return null;
  if (!hasSomethingToShow(resume.shows_completed, resume.distinct_songs_performed)) {
    return null;
  }

  const stats = [
    {
      icon:  Building2,
      value: String(resume.shows_completed),
      label: resume.shows_completed === 1 ? 'show realizado' : 'shows realizados',
    },
    {
      icon:  MapPin,
      value: String(resume.distinct_venues),
      label: resume.distinct_venues === 1 ? 'casa' : 'casas',
    },
    {
      icon:  Users,
      value: formatCompact(resume.audience_reached),
      label: 'pessoas alcançadas',
    },
    {
      icon:  Music2,
      value: String(resume.distinct_songs_performed),
      label: 'músicas no palco',
    },
  ];

  return (
    <View style={s.root}>
      <View style={s.header}>
        <BadgeCheck size={16} color={colors.brand.primary} />
        <Text style={s.headerText}>Histórico verificado</Text>
      </View>

      <View style={s.grid}>
        {stats.map(({ icon: Icon, value, label }) => (
          <View key={label} style={s.cell}>
            <Icon size={15} color={colors.text.muted} />
            <Text style={s.value}>{value}</Text>
            <Text style={s.label}>{label}</Text>
          </View>
        ))}
      </View>

      {resume.venues.length > 0 && (
        <View style={s.venues}>
          <Text style={s.venuesLabel}>Já tocou em</Text>
          <Text style={s.venuesList} numberOfLines={3}>
            {resume.venues.map((v) => v.name).join(' · ')}
          </Text>
        </View>
      )}

      <Text style={s.footnote}>
        Números apurados pela plataforma a partir de shows concluídos e presença
        registrada.
      </Text>
    </View>
  );
}

/** 1.240 vira "1,2 mil" — quatro dígitos numa célula estreita não cabem. */
function formatCompact(value: number): string {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(1).replace('.', ',')} mil`;
}
