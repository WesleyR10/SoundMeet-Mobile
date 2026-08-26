import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  ReviewableBooking,
  SubmitReviewPayload,
  SubmitReviewResult,
} from '../domain/review.types';

/**
 * GET /scheduling/bookings/:id — a reserva por trás do contrato.
 *
 * Existe porque o `ContractPresenter` congela o show (data, local, cachê) mas
 * **não carrega o status da reserva**: o contrato é imutável e o status muda
 * depois dele. Sem esta busca não há como saber se o show já foi concluído, que
 * é a única condição em que o backend aceita a avaliação.
 *
 * Buscada no DETALHE, nunca por linha da lista — mesmo racional de
 * `getInquiryEstablishment`: seria um N+1 visível, e o status só importa aqui.
 *
 * O escopo vem do JWT (`resolveParticipantIds`): quem não é parte da reserva
 * recebe 403, então não há como espiar reserva alheia por id.
 */
export async function getContractBooking(bookingId: string): Promise<ReviewableBooking> {
  const { data } = await httpClient.get<ApiEnvelope<ReviewableBooking>>(
    `/scheduling/bookings/${bookingId}`,
  );
  return data.data;
}

/**
 * POST /establishments/:id/ratings — o músico avalia a casa onde tocou.
 *
 * `context_type: 'booking'` é o que prova o vínculo: o backend exige uma reserva
 * `completed` em que este músico e este estabelecimento sejam as duas partes.
 *
 * 🔴 **Reenviar ATUALIZA a nota, não soma outra.** O ledger tem unique em
 * `(target_type, target_id, author_id, context_id)` e o use-case faz upsert —
 * por isso a UI não precisa (nem deve) esconder o botão de quem já avaliou.
 */
export async function submitEstablishmentReview(
  establishmentId: string,
  payload: SubmitReviewPayload,
): Promise<SubmitReviewResult> {
  const { data } = await httpClient.post<ApiEnvelope<SubmitReviewResult>>(
    `/establishments/${establishmentId}/ratings`,
    payload,
  );
  return data.data;
}
