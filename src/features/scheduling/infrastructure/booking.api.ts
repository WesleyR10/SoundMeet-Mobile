import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { BookingOffer } from '../domain/booking-offer.types';

/**
 * Propostas de show (booking) — o que a casa manda pela conversa.
 *
 * 🔴 Primeiro cliente destas rotas no app (18/set/2026). Até aqui o músico não
 * tinha como aceitar uma proposta de show: a tela não existia, e o painel do
 * estabelecimento afirmava que existia.
 *
 * O escopo é do JWT: só participantes leem (`assertNegotiationViewer`) e só as
 * partes decidem — numa proposta de BANDA, só o líder (`assertBandLeader`,
 * 403 para os demais).
 */

/** GET /scheduling/bookings/:id */
export async function getBooking(bookingId: string): Promise<BookingOffer> {
  const { data } = await httpClient.get<ApiEnvelope<BookingOffer>>(`/scheduling/bookings/${bookingId}`);
  return data.data;
}

/**
 * POST /scheduling/bookings/:id/confirm — aceitar a proposta.
 *
 * O backend REVALIDA a agenda aqui (bloqueios, show confirmado no mesmo
 * horário, limite por dia). É neste toque que o artista descobre um conflito,
 * e `describeOfferError` traduz a recusa.
 */
export async function confirmBooking(bookingId: string): Promise<BookingOffer> {
  const { data } = await httpClient.post<ApiEnvelope<BookingOffer>>(
    `/scheduling/bookings/${bookingId}/confirm`,
    {},
  );
  return data.data;
}

/**
 * POST /scheduling/bookings/:id/cancel — recusar a proposta.
 *
 * Numa proposta PENDENTE o motivo é opcional (só é exigido num show confirmado
 * dentro da janela de cancelamento). Recusar não encerra a conversa: a casa
 * pode mandar outra proposta no mesmo fio (`/revise` reabre a recusada).
 */
export async function declineBooking(bookingId: string, reason?: string): Promise<BookingOffer> {
  const { data } = await httpClient.post<ApiEnvelope<BookingOffer>>(
    `/scheduling/bookings/${bookingId}/cancel`,
    { reason: reason?.trim() || undefined },
  );
  return data.data;
}
