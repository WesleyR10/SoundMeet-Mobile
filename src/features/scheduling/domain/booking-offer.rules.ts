// Regras puras da proposta de show dentro da conversa (18/set/2026).
// Domínio puro — sem RN/Expo/Axios.
import { formatHHMM, formatShortDate } from '@/shared/utils/date-format';
import type { BookingOffer } from './booking-offer.types';

/**
 * Em que pé a proposta está, do ponto de vista do ARTISTA.
 *
 * - `awaiting_me` — a casa propôs e a vez é dele (o único estágio com botões);
 * - `awaiting_them` — ele mesmo propôs (via API) e a casa ainda não respondeu;
 * - `not_accepted` — cancelada ANTES de confirmar (recusa ou retirada);
 * - `cancelled` — cancelada DEPOIS de confirmada (o show foi desfeito).
 *
 * ⚠️ `not_accepted` × `cancelled` sai de `confirmed_at`, não do status: os dois
 * chegam como `cancelled`, e dizer "show cancelado" sobre uma proposta que
 * nunca foi aceita assustaria à toa.
 */
export type OfferStage =
  | 'awaiting_me'
  | 'awaiting_them'
  | 'confirmed'
  | 'completed'
  | 'expired'
  | 'not_accepted'
  | 'cancelled';

export function offerStage(offer: BookingOffer, now: Date = new Date()): OfferStage {
  switch (offer.status) {
    case 'pending': {
      /*
       * O backend só marca `expired` quando alguém toca no booking (o job e o
       * `confirm` chamam `expire`). Entre o prazo e esse toque ele ainda chega
       * `pending` — oferecer "Aceitar" ali levaria a um 422 certo.
       */
      if (offer.expires_at && now.getTime() >= new Date(offer.expires_at).getTime()) {
        return 'expired';
      }
      return offer.proposed_by === 'musician' || offer.proposed_by === 'band'
        ? 'awaiting_them'
        : 'awaiting_me';
    }
    case 'confirmed':
      return 'confirmed';
    case 'completed':
      return 'completed';
    case 'expired':
      return 'expired';
    case 'cancelled':
      return offer.confirmed_at ? 'cancelled' : 'not_accepted';
  }
}

export const OFFER_STAGE_LABEL: Record<OfferStage, string> = {
  awaiting_me:   'Aguardando sua resposta',
  awaiting_them: 'Aguardando a casa',
  confirmed:     'Show confirmado',
  completed:     'Show realizado',
  expired:       'Proposta vencida',
  not_accepted:  'Proposta não aceita',
  cancelled:     'Show cancelado',
};

export type OfferTone = 'pending' | 'positive' | 'negative' | 'neutral';

export function offerTone(stage: OfferStage): OfferTone {
  switch (stage) {
    case 'awaiting_me':
    case 'awaiting_them':
      return 'pending';
    case 'confirmed':
    case 'completed':
      return 'positive';
    case 'cancelled':
      return 'negative';
    default:
      return 'neutral';
  }
}

/**
 * Qual booking é a proposta desta conversa.
 *
 * A conversa nasce de UMA de duas portas: "propor um show" (a conversa aponta
 * direto para o booking) ou "conversar sobre uma data" (aponta para a inquiry,
 * e a proposta só existe depois que ela vira booking — `inquiry.booking_id`).
 * Não existe `GET` de inquiry única no backend, então quem chama passa a lista.
 */
export function resolveOfferBookingId(
  conversation: { booking_id: string | null; inquiry_id: string | null },
  inquiries: readonly { id: string; booking_id: string | null }[],
): string | null {
  if (conversation.booking_id) return conversation.booking_id;
  if (!conversation.inquiry_id) return null;
  return inquiries.find((item) => item.id === conversation.inquiry_id)?.booking_id ?? null;
}

const WEEKDAYS_PT_BR = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** "sex, 2 out" — o dia do show, no relógio do aparelho (convenção do app). */
export function formatOfferDay(iso: string): string {
  const d = new Date(iso);
  return `${WEEKDAYS_PT_BR[d.getDay()]}, ${formatShortDate(iso)}`;
}

/** "22:00 → 01:00", e se o show atravessa a meia-noite. */
export function formatOfferTimes(startIso: string, endIso: string): { range: string; overnight: boolean } {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return {
    range:     `${formatHHMM(startIso)} → ${formatHHMM(endIso)}`,
    overnight: start.toDateString() !== end.toDateString(),
  };
}

export function formatOfferFee(fee: number | null): string {
  return fee === null
    ? 'A combinar'
    : fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * O que entra na conversa depois de responder.
 *
 * O estabelecimento é avisado em tempo real pelo painel (`booking.updated`),
 * mas a conversa é o HISTÓRICO da negociação — sem esta linha, o fio terminaria
 * na proposta, sem registro de que ela foi respondida.
 */
export function buildOfferReplyMessage(decision: 'accept' | 'decline', offer: BookingOffer): string {
  const day = formatOfferDay(offer.start_at);
  return decision === 'accept'
    ? `✅ Aceitei a proposta de ${day}. Show confirmado!`
    : `Não vou poder aceitar a proposta de ${day}.`;
}

/**
 * Erro de resposta, em português e acionável.
 *
 * O `ConfirmBookingUseCase` revalida a agenda no momento do aceite — e é aqui
 * que o artista descobre que bloqueou aquele dia, ou que já fechou outro show.
 * A frase crua do servidor está em inglês e não diz onde resolver.
 */
export function describeOfferError(status: number | undefined, message: string): string {
  if (status === 403) {
    return 'Só o líder da banda pode responder a esta proposta.';
  }
  if (/only pending bookings/i.test(message)) {
    return 'Esta proposta não está mais de pé — ela pode ter vencido ou sido alterada pela casa.';
  }
  if (/unavailable/i.test(message)) {
    return 'Esse horário está bloqueado na sua agenda. Libere a data em Agenda para aceitar.';
  }
  if (/already has a confirmed booking/i.test(message)) {
    return 'Você já tem um show confirmado nesse horário.';
  }
  if (/maximum shows per day/i.test(message)) {
    return 'Você já atingiu o limite de shows desse dia. Ajuste o limite em Agenda.';
  }
  return message;
}
