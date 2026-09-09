import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checkInBooking, getBookingCheckIn } from '../infrastructure/booking-check-in.api';

export const bookingCheckInKey = (bookingId: string) =>
  ['contract', 'booking-check-in', bookingId] as const;

/**
 * Estado do registro da apresentação deste show.
 *
 * `staleTime` curto (ao contrário de `useContractPayout`, que é congelado):
 * este dado muda no fim da noite, e é comum a contraparte registrar primeiro —
 * o músico precisa ver isso ao reabrir a tela, não um cache de dez minutos.
 */
export function useBookingCheckIn(bookingId: string | null) {
  return useQuery({
    queryKey:  bookingId ? bookingCheckInKey(bookingId) : ['contract', 'booking-check-in', 'disabled'],
    queryFn:   () => getBookingCheckIn(bookingId!),
    enabled:   !!bookingId,
    staleTime: 30 * 1_000,
    // Booking de um contrato antigo pode ter sumido, ou o músico pode ter saído
    // da banda: 403/404 não são estados de "tentar de novo".
    retry:     false,
  });
}

export function useCheckInBooking(bookingId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => checkInBooking(bookingId!),
    onSuccess: (updated) => {
      if (!bookingId) return;
      // Escreve a resposta direto no cache: o backend devolve o booking já
      // registrado, e um refetch só para reler o que acabou de chegar deixaria
      // o cartão piscando entre "registrar" e "registrado".
      queryClient.setQueryData(bookingCheckInKey(bookingId), updated);
    },
  });
}
