import { View, Text } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import type { EventItem } from '../../domain/event.types';

type Props = {
  event:   EventItem;
  onPress: () => void;
};

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS   = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Linha de evento (EstablishmentDetailScreen, Bloco 11.5) — mesma linguagem
// de "date box" do mockup Home do Músico (Próximo Show), reaproveitada aqui
// como o análogo do fã (descobrir/entrar num show, não gerenciar o próprio).
const useStyles = makeStyles((colors) => ({
  card: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
    borderRadius:   radius.lg,
    borderWidth:     1,
    borderColor:    colors.accent.violet + '30',
    backgroundColor: 'rgba(124,58,237,0.06)',
    padding:          spacing.md,
  },
  dateBox: {
    width:            48,
    alignItems:      'center',
    paddingVertical:   spacing.xs,
    borderRadius:      radius.md,
    backgroundColor:  'rgba(255,255,255,0.06)',
  },
  dateWeekday: {
    ...typography.caption,
    color: colors.accent.violetLight,
  },
  dateDay: {
    ...typography.title,
    color: colors.text.primary,
  },
  dateMonth: {
    ...typography.caption,
    color: colors.text.muted,
  },
  info: { flex: 1, gap: 2 },
  name: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  meta: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
}));

export function EventListItem({ event, onPress }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const start = new Date(event.start_at);

  return (
    <Pressable3DCard onPress={onPress} style={s.card} accessibilityLabel={event.name}>
      <View style={s.dateBox}>
        <Text style={s.dateWeekday}>{WEEKDAYS[start.getDay()]}</Text>
        <Text style={s.dateDay}>{start.getDate()}</Text>
        <Text style={s.dateMonth}>{MONTHS[start.getMonth()]}</Text>
      </View>

      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{event.name}</Text>
        <Text style={s.meta}>
          {formatTime(event.start_at)} – {formatTime(event.end_at)}
          {event.cover_charge ? ` · R$ ${event.cover_charge.toFixed(2)}` : ' · Entrada grátis'}
        </Text>
      </View>

      <ChevronRight size={18} color={colors.text.muted} />
    </Pressable3DCard>
  );
}
