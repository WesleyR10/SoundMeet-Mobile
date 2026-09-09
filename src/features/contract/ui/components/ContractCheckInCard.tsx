import { View, Text } from 'react-native';
import { AlertTriangle, CircleCheckBig, ShieldAlert } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { extractApiMessage } from '@/shared/services/http/types';
import { formatHHMM, formatShortDate } from '@/shared/utils/date-format';
import { useBookingCheckIn, useCheckInBooking } from '../../application/useBookingCheckIn';
import {
  canCheckIn,
  hasPerformanceRecord,
  isCheckInOverdue,
} from '../../domain/check-in.rules';

type Props = {
  bookingId: string;
};

const useStyles = makeStyles((colors) => ({
  card: {
    gap:              spacing.sm,
    padding:          spacing.lg,
    borderRadius:     radius.lg,
    borderWidth:       1,
    borderColor:      colors.border.default,
    backgroundColor:  colors.bg.elevated,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  title: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  body: {
    ...typography.bodySm,
    color:      colors.text.secondary,
    lineHeight: 20,
  },
  muted: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
  notice: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:              spacing.sm,
    padding:          spacing.md,
    borderRadius:     radius.md,
    borderWidth:       1,
  },
  noticeTexts: {
    flex: 1,
    gap:   2,
  },
  noticeTitle: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  button: {
    marginTop: spacing.xs,
  },
}));

function formatMoment(iso: string): string {
  return `${formatShortDate(iso)} às ${formatHHMM(iso)}`;
}

/**
 * Registro da apresentação, na tela do contrato (F1.3a).
 *
 * 🔴 **Por que isto existe.** `POST /scheduling/bookings/:id/check-in` não
 * tinha cliente nenhum — nem aqui, nem no painel do estabelecimento —, e
 * `ReleaseBookingEscrowUseCase` recusa liberar o cachê com
 * `!booking.isCheckedIn`. Com a custódia ligada, o dinheiro do artista ficaria
 * retido para sempre, e o pior é que **em silêncio**: o job horário roda, não
 * encontra nada liberável e não registra erro nenhum.
 *
 * ⚠️ Fica no contrato porque **o contrato é a tela do show neste app** — o
 * músico não tem tela de booking (decisão registrada no `CLAUDE.md`).
 *
 * Não renderiza nada quando o booking não pode ter apresentação (proposta,
 * cancelado, expirado) nem quando a leitura falha: a tela do contrato é o lugar
 * mais formal do app, e um cartão de erro sobre um dado secundário competiria
 * com o documento.
 */
export function ContractCheckInCard({ bookingId }: Props) {
  const s = useStyles();
  const { colors } = useTheme();

  const { data: booking } = useBookingCheckIn(bookingId);
  const checkIn = useCheckInBooking(bookingId);

  if (!hasPerformanceRecord(booking ?? null)) return null;

  const registered = booking?.checked_in_at ?? null;
  const disputed   = booking?.disputed_at ?? null;
  const showButton = canCheckIn(booking ?? null);
  const overdue    = isCheckInOverdue(booking ?? null);

  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <CircleCheckBig
          size={15}
          color={registered ? colors.status.success : colors.text.muted}
        />
        <Text style={s.title}>Registro da apresentação</Text>
      </View>

      {registered ? (
        <Text style={s.body}>
          Apresentação registrada em {formatMoment(registered)}. É esta marca que
          libera seu cachê no prazo combinado.
        </Text>
      ) : (
        <Text style={s.body}>
          Confirmar que o show aconteceu é o que libera seu cachê da custódia.
          Qualquer uma das partes pode registrar.
        </Text>
      )}

      {/*
        🔴 O aviso importa mais que o botão: o show terminou, o cachê está
        retido e nada mais no app diria isso — a carteira mostraria saldo retido
        sem explicar o que falta.
      */}
      {overdue && (
        <View style={[s.notice, { borderColor: `${colors.accent.amber}55`, backgroundColor: `${colors.accent.amber}14` }]}>
          <AlertTriangle size={16} color={colors.accent.amber} />
          <View style={s.noticeTexts}>
            <Text style={s.noticeTitle}>Este show já terminou e não foi registrado</Text>
            <Text style={s.muted}>Enquanto não houver registro, o cachê continua retido.</Text>
          </View>
        </View>
      )}

      {disputed && (
        <View style={[s.notice, { borderColor: `${colors.status.error}55`, backgroundColor: `${colors.status.error}14` }]}>
          <ShieldAlert size={16} color={colors.status.error} />
          <View style={s.noticeTexts}>
            <Text style={s.noticeTitle}>Contestação aberta em {formatMoment(disputed)}</Text>
            {/*
              O motivo NÃO é mostrado aqui de propósito: `dispute_reason` é o
              texto que o contratante escreveu para a mediação ler, e exibi-lo
              cru no app do artista, sem canal de resposta, transformaria a tela
              do contrato num lugar de conflito sem saída.
            */}
            <Text style={s.muted}>
              A liberação automática está congelada até a mediação decidir.
            </Text>
          </View>
        </View>
      )}

      {!registered && !showButton && !overdue && (
        <Text style={s.muted}>
          O registro fica disponível a partir do horário de início do show.
        </Text>
      )}

      {checkIn.isError && <ErrorBanner message={extractApiMessage(checkIn.error)} />}

      {showButton && (
        <PrimaryButton
          label="Registrar apresentação"
          onPress={() => checkIn.mutate()}
          loading={checkIn.isPending}
          disabled={checkIn.isPending}
          style={s.button}
        />
      )}
    </View>
  );
}
