import { View, Text, Pressable, Alert, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { Moon } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { GlowCard } from '@/shared/components/GlowCard';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { formatHHMM, formatShortDate } from '@/shared/utils/date-format';
import {
  OFFER_STAGE_LABEL,
  formatOfferDay,
  formatOfferFee,
  formatOfferTimes,
  offerStage,
  offerTone,
  type OfferTone,
} from '../../domain/booking-offer.rules';
import type { BookingOffer } from '../../domain/booking-offer.types';

type Props = {
  offer:        BookingOffer;
  accepting:    boolean;
  declining:    boolean;
  errorMessage: string | null;
  onAccept:     () => void;
  onDecline:    () => void;
  /** No chat o cartão tem margem própria; dentro de um sheet, quem dá é o sheet. */
  style?:       StyleProp<ViewStyle>;
};

const WEEKDAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTH_SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const useStyles = makeStyles((colors) => ({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop:         spacing.sm,
  },
  card: {
    padding: spacing.md,
    gap:     spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
  },
  // O canhoto do bilhete: o dia, grande, separado por um picote.
  stub: {
    alignItems:        'center',
    minWidth:           56,
    paddingRight:       spacing.md,
    borderRightWidth:   1,
    borderStyle:        'dashed',
    borderColor:        colors.border.strong,
  },
  stubSmall: {
    ...typography.caption,
    color:         colors.brand.primary,
    letterSpacing: 1.5,
  },
  stubDay: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  body: {
    flex: 1,
    gap:  2,
  },
  eyebrow: {
    ...typography.caption,
    color:         colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  times: {
    ...typography.mono,
    color: colors.text.primary,
  },
  timesRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  fee: {
    ...typography.mono,
    fontFamily: 'JetBrainsMono-Bold',
    color:      colors.brand.primary,
  },
  pill: {
    alignSelf:         'flex-start',
    borderWidth:        1,
    borderRadius:       radius.full,
    paddingHorizontal:  spacing.sm,
    paddingVertical:    2,
  },
  pillText: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
  },
  notes: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  deadline: {
    ...typography.caption,
    color: colors.accent.amber,
  },
  actions: {
    flexDirection: 'row',
    gap:            spacing.sm,
  },
  btn: {
    flex:            1,
    minHeight:       48,
    borderRadius:    radius.lg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  btnDecline: {
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  btnAccept: {
    backgroundColor: colors.brand.primary,
  },
  btnPressed: {
    opacity: 0.8,
  },
  btnDeclineText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
  btnAcceptText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
  },
}));

/**
 * A proposta de show, fixada no topo da conversa — o bilhete.
 *
 * ## Por que existe (18/set/2026)
 *
 * O painel do estabelecimento manda propostas de show (data, horário, cachê) —
 * desde "Propor um show" e, agora, de dentro da própria conversa. O app NÃO
 * tinha onde aceitá-las: nem esta tela nem cliente das rotas de booking. É aqui
 * que o artista responde, porque é aqui que ele estava negociando.
 *
 * ## Fixado, e não uma bolha
 *
 * A mensagem que a casa manda junto é o HISTÓRICO; o bilhete é o que vale
 * AGORA. Numa conversa longa, "o cachê ficou em quanto?" não pode depender de
 * rolar até a última proposta — e o botão de aceitar não pode ficar numa bolha
 * antiga que talvez já tenha sido substituída por outra.
 *
 * Aceitar e recusar pedem confirmação: é compromisso com data e multa de
 * cancelamento, e o artista frequentemente responde com uma mão, no palco ou
 * no trânsito — um toque acidental não pode fechar um show.
 */
export function ProposalCard({ offer, accepting, declining, errorMessage, onAccept, onDecline, style }: Props) {
  const s = useStyles();
  const { colors } = useTheme();

  const stage = offerStage(offer);
  const tone = offerTone(stage);
  const toneColor: Record<OfferTone, string> = {
    pending:  colors.accent.amber,
    positive: colors.status.success,
    negative: colors.status.error,
    neutral:  colors.text.muted,
  };

  const start = new Date(offer.start_at);
  const { range, overnight } = formatOfferTimes(offer.start_at, offer.end_at);
  const fee = formatOfferFee(offer.fee);
  const busy = accepting || declining;
  const canRespond = stage === 'awaiting_me';

  function confirmAccept() {
    Alert.alert(
      'Aceitar a proposta?',
      `${formatOfferDay(offer.start_at)}, ${range} · ${fee}.\nO show entra na sua agenda e a casa é avisada na hora.`,
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Aceitar', onPress: onAccept },
      ],
    );
  }

  function confirmDecline() {
    Alert.alert(
      'Recusar a proposta?',
      'A casa é avisada e pode mandar outra proposta aqui mesmo na conversa.',
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Recusar', style: 'destructive', onPress: onDecline },
      ],
    );
  }

  return (
    <View style={[s.wrap, style]}>
      <GlowCard accentColor={colors.accent.violet} style={s.card}>
        <View
          style={s.row}
          accessible
          accessibilityLabel={`Proposta de show: ${formatOfferDay(offer.start_at)}, ${range}${
            overnight ? ', terminando no dia seguinte' : ''
          }. Cachê ${fee}. ${OFFER_STAGE_LABEL[stage]}.`}
        >
          <View style={s.stub}>
            <Text style={s.stubSmall}>{WEEKDAY_SHORT[start.getDay()]}</Text>
            <Text style={s.stubDay}>{String(start.getDate()).padStart(2, '0')}</Text>
            <Text style={s.stubSmall}>{MONTH_SHORT[start.getMonth()]}</Text>
          </View>

          <View style={s.body}>
            <Text style={s.eyebrow}>Proposta de show</Text>
            <View style={s.timesRow}>
              <Text style={s.times}>{range}</Text>
              {overnight ? <Moon size={14} color={colors.text.muted} /> : null}
            </View>
            <Text style={s.fee}>{fee}</Text>
            <View style={[s.pill, { borderColor: toneColor[tone] }]}>
              <Text style={[s.pillText, { color: toneColor[tone] }]}>{OFFER_STAGE_LABEL[stage]}</Text>
            </View>
          </View>
        </View>

        {canRespond && !!offer.notes && (
          <Text style={s.notes} numberOfLines={3}>{offer.notes}</Text>
        )}

        {canRespond && !!offer.expires_at && (
          <Text style={s.deadline}>
            Responda até {formatShortDate(offer.expires_at)} às {formatHHMM(offer.expires_at)}
          </Text>
        )}

        {!!errorMessage && <ErrorBanner message={errorMessage} />}

        {canRespond && (
          <View style={s.actions}>
            <Pressable
              onPress={confirmDecline}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Recusar a proposta"
              accessibilityState={{ disabled: busy, busy: declining }}
              style={({ pressed }) => [s.btn, s.btnDecline, pressed && s.btnPressed]}
            >
              {declining ? (
                <ActivityIndicator color={colors.text.secondary} />
              ) : (
                <Text style={s.btnDeclineText}>Recusar</Text>
              )}
            </Pressable>
            <Pressable
              onPress={confirmAccept}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Aceitar a proposta"
              accessibilityState={{ disabled: busy, busy: accepting }}
              style={({ pressed }) => [s.btn, s.btnAccept, pressed && s.btnPressed]}
            >
              {accepting ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <Text style={s.btnAcceptText}>Aceitar</Text>
              )}
            </Pressable>
          </View>
        )}
      </GlowCard>
    </View>
  );
}
