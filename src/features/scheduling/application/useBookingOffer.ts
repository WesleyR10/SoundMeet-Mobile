import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { extractApiMessage } from '@/shared/services/http/types';
import { buildOfferReplyMessage, describeOfferError, resolveOfferBookingId } from '../domain/booking-offer.rules';
import type { BookingOffer } from '../domain/booking-offer.types';
import type { ConversationSummary } from '../domain/conversation.types';
import { confirmBooking, declineBooking, getBooking } from '../infrastructure/booking.api';
import { sendMessage } from '../infrastructure/conversation.api';
import { listInquiries } from '../infrastructure/inquiry.api';
import { chatMessagesKey } from './useChat';

export const bookingOfferKey = (bookingId: string) => ['scheduling', 'booking-offer', bookingId] as const;

const conversationInquiriesKey = (establishmentId: string) =>
  ['scheduling', 'conversation-inquiries', establishmentId] as const;

/**
 * A proposta em jogo numa conversa — ou `null` enquanto não existe.
 *
 * Duas leituras, e a segunda só quando precisa: numa conversa aberta por
 * "propor um show" o booking vem direto na conversa; numa aberta por
 * "conversar sobre uma data", a proposta é o booking em que a inquiry virou, e
 * achar a inquiry exige a lista (não há `GET` de inquiry única).
 */
export function useConversationOffer(conversation: ConversationSummary | undefined) {
  const needsInquiry = !!conversation && !conversation.booking_id && !!conversation.inquiry_id;

  const inquiries = useQuery({
    queryKey: conversation
      ? conversationInquiriesKey(conversation.establishment_id)
      : ['scheduling', 'conversation-inquiries', 'disabled'],
    queryFn:   () => listInquiries({ establishment_id: conversation!.establishment_id, per_page: 100 }),
    enabled:   needsInquiry,
    staleTime: 10 * 1_000,
  });

  const bookingId = conversation
    ? resolveOfferBookingId(conversation, inquiries.data?.data ?? [])
    : null;

  const offer = useQuery({
    queryKey:  bookingId ? bookingOfferKey(bookingId) : ['scheduling', 'booking-offer', 'disabled'],
    queryFn:   () => getBooking(bookingId!),
    enabled:   !!bookingId,
    staleTime: 5 * 1_000,
  });

  return {
    offer: offer.data ?? null,
    /**
     * Recarrega as duas leituras. Chamado quando chega mensagem da casa: a
     * proposta feita pelo painel entra no fio como mensagem, e é esse o sinal
     * de que a oferta pode ter mudado (ou acabado de nascer, na conversão).
     */
    refresh: () => {
      if (needsInquiry) void inquiries.refetch();
      if (bookingId) void offer.refetch();
    },
  };
}

/**
 * Aceitar ou recusar a proposta, e deixar o rastro na conversa.
 *
 * Ordem: a DECISÃO primeiro, a mensagem depois — e a mensagem é best-effort.
 * Falhar o registro não pode desfazer um aceite que o backend já gravou (e que
 * o painel da casa já recebeu por `booking.updated`).
 */
export function useRespondToOffer(conversationId: string | null) {
  const queryClient = useQueryClient();

  const afterDecision = (decision: 'accept' | 'decline') => (updated: BookingOffer, offer: BookingOffer) => {
    queryClient.setQueryData(bookingOfferKey(offer.id), updated);
    if (!conversationId) return;
    void sendMessage(conversationId, buildOfferReplyMessage(decision, offer))
      .catch(() => undefined)
      // O socket ignora o eco da própria mensagem (useChatSocket), então é o
      // refetch que a faz aparecer no fio.
      .finally(() => queryClient.invalidateQueries({ queryKey: chatMessagesKey(conversationId) }));
  };

  const accept = useMutation({
    mutationFn: (offer: BookingOffer) => confirmBooking(offer.id),
    onSuccess:  afterDecision('accept'),
  });

  const decline = useMutation({
    mutationFn: (offer: BookingOffer) => declineBooking(offer.id),
    onSuccess:  afterDecision('decline'),
  });

  const error = accept.error ?? decline.error;

  return {
    accept,
    decline,
    errorMessage: error
      ? describeOfferError(
          (error as { response?: { status?: number } })?.response?.status,
          extractApiMessage(error),
        )
      : null,
  };
}

/** O booking em que uma proposta virou — os termos (data, horário, cachê) moram nele. */
export function useBookingOfferById(bookingId: string | null) {
  return useQuery({
    queryKey:  bookingId ? bookingOfferKey(bookingId) : ['scheduling', 'booking-offer', 'disabled'],
    queryFn:   () => getBooking(bookingId!),
    enabled:   !!bookingId,
    staleTime: 5 * 1_000,
  });
}
