import { View, Text, ActivityIndicator } from 'react-native';
import { CalendarClock, CalendarX2 } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { formatHHMM, formatShortDate } from '@/shared/utils/date-format';
import { useBandAgenda } from '../../application/useBandAgenda';

type Props = {
  bandId: string;
};

// Seção de agenda na BandDetailScreen — lista simples dos próximos 30 dias
// (shows confirmados + bloqueios), não o grid mensal interativo do músico
// (AgendaScreen); leitura, sem editar disponibilidade da banda nesta v1.
const useStyles = makeStyles((colors) => ({
  centerRow: {
    paddingVertical: spacing.lg,
    alignItems:      'center',
  },
  errorText: {
    ...typography.bodySm,
    color: colors.status.error,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
    padding:        spacing.md,
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
  },
  iconBox: {
    width:           32,
    height:          32,
    borderRadius:    radius.sm,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  info: {
    flex: 1,
  },
  date: {
    ...typography.bodySm,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
  },
  kind: {
    ...typography.caption,
    color: colors.text.muted,
  },
}));

export function BandAgendaSummary({ bandId }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { data, isPending, isError } = useBandAgenda(bandId);

  if (isPending) {
    return (
      <View style={s.centerRow}>
        <ActivityIndicator color={colors.brand.primary} size="small" />
      </View>
    );
  }

  if (isError) {
    return (
      <Text style={s.errorText}>Não foi possível carregar a agenda da banda.</Text>
    );
  }

  const busy = [...(data?.busy ?? [])].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  );

  if (busy.length === 0) {
    return (
      <View style={s.emptyRow}>
        <CalendarClock size={18} color={colors.text.muted} />
        <Text style={s.emptyText}>Nenhum compromisso nos próximos 30 dias.</Text>
      </View>
    );
  }

  return (
    <View style={s.list}>
      {busy.map((interval, index) => (
        <View key={`${interval.start_at}-${index}`} style={s.row}>
          <View style={s.iconBox}>
            {interval.kind === 'booking'
              ? <CalendarClock size={16} color={colors.brand.primary} />
              : <CalendarX2 size={16} color={colors.accent.coral} />}
          </View>
          <View style={s.info}>
            <Text style={s.date}>
              {formatShortDate(interval.start_at)} · {formatHHMM(interval.start_at)}–{formatHHMM(interval.end_at)}
            </Text>
            <Text style={s.kind}>
              {interval.kind === 'booking' ? 'Show confirmado' : (interval.reason ?? 'Indisponível')}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
