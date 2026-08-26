import { useMutation, useQuery } from '@tanstack/react-query';
import { extractApiMessage } from '@/shared/services/http/types';
import { getContractBooking, submitEstablishmentReview } from '../infrastructure/review.api';
import type { SubmitReviewPayload } from '../domain/review.types';

export const contractBookingKey = (bookingId: string) =>
  ['contract', 'booking', bookingId] as const;

/**
 * A reserva por trás do contrato — só para saber se o show já foi concluído.
 *
 * `staleTime` curto porque o status é justamente o que muda: `confirmed` vira
 * `completed` pelo job horário, e é essa transição que libera a avaliação. Um
 * cache longo esconderia a liberação até o app ser reaberto.
 */
export function useContractBooking(bookingId: string | null) {
  return useQuery({
    queryKey: bookingId ? contractBookingKey(bookingId) : ['contract', 'booking', 'disabled'],
    queryFn:   () => getContractBooking(bookingId!),
    enabled:   !!bookingId,
    staleTime: 30 * 1_000,
  });
}

/**
 * Enviar a avaliação da casa.
 *
 * Sem invalidação de cache: a nota do estabelecimento não é exibida em nenhuma
 * tela do app do músico (o perfil da casa é território do fã), e o
 * `target_rating` já volta na resposta para quem quiser mostrar o resultado.
 * Invalidar por invalidar custaria um refetch sem leitor.
 */
export function useSubmitEstablishmentReview(establishmentId: string | null) {
  return useMutation({
    mutationFn: (payload: SubmitReviewPayload) =>
      submitEstablishmentReview(establishmentId!, payload),
  });
}

/**
 * Mensagem de erro da avaliação, em português.
 *
 * ⚠️ **O 403 NÃO ganha mensagem própria de propósito.** Ele cobre causas
 * distintas — reserva ainda não concluída, autor fora das partes, contexto
 * errado — e o backend já devolve qual delas foi
 * (`ReviewEligibilityService` lança `ForbiddenException` com texto específico
 * e em português). Traduzir tudo para uma frase só trocaria o motivo certo por
 * um palpite: quando a causa fosse "você não participou desta reserva", a tela
 * diria "aguarde o fim do show", e a pessoa esperaria por algo que nunca vem.
 *
 * A UI já evita o caso comum antes do toque (`canReviewEstablishment`), então o
 * que chega aqui é o inesperado — e aí a verdade do servidor vale mais que uma
 * mensagem bonita.
 */
export function getSubmitReviewErrorMessage(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status;

  if (status === 404) {
    return 'Estabelecimento não encontrado.';
  }

  return extractApiMessage(error);
}
