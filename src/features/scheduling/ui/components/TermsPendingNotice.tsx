import { Text, View } from 'react-native';
import { CalendarClock } from 'lucide-react-native';
import { radius, spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

/*
 * Mostrado quando a proposta ainda não tem data, horário nem cachê — o que é o
 * normal de um "conversar sobre uma data": o backend guarda só assunto e
 * mensagem. Dizer isso com todas as letras é o que impede o músico de achar
 * que está aceitando um show.
 */
const useStyles = makeStyles((colors) => ({
  box: {
    flexDirection:   'row',
    gap:             spacing.md,
    padding:         spacing.lg,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.accent.amber,
    backgroundColor: colors.bg.surface,
  },
  body:  { flex: 1, gap: spacing.xs },
  title: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  text: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
}));

export function TermsPendingNotice() {
  const s = useStyles();
  const { colors } = useTheme();

  return (
    <View style={s.box} accessible>
      <CalendarClock size={22} color={colors.accent.amber} />
      <View style={s.body}>
        <Text style={s.title}>Data, horário e cachê ainda não definidos</Text>
        <Text style={s.text}>
          A casa quer conversar antes. Dizer que tem interesse não fecha nenhum show: a proposta com data e
          valor chega depois, e só vale se você aceitar.
        </Text>
      </View>
    </View>
  );
}
