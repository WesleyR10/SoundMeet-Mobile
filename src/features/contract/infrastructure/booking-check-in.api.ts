import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { BookingCheckIn } from '../domain/check-in.types';

// GET /scheduling/bookings/:id — só participantes (estabelecimento, músico ou
// integrante da banda). Ao contrário de confirmar/cancelar, VER não exige
// liderança da banda, então todo membro escalado consegue ler.
export async function getBookingCheckIn(bookingId: string): Promise<BookingCheckIn> {
  const { data } = await httpClient.get<ApiEnvelope<BookingCheckIn>>(
    `/scheduling/bookings/${bookingId}`,
  );
  return data.data;
}

/**
 * POST /scheduling/bookings/:id/check-in — registra que o show aconteceu.
 *
 * 🔴 **Sem corpo, e isso é a garantia.** A hora é a do SERVIDOR: aceitar
 * `checked_in_at` do cliente permitiria registrar um show de ontem como se
 * fosse de hoje, e este registro existe justamente para provar *quando*.
 *
 * Idempotente — o primeiro registro é o que vale. As duas partes podem
 * registrar, e um check-in feito pela contraparte é prova ainda mais forte a
 * favor do artista.
 */
export async function checkInBooking(bookingId: string): Promise<BookingCheckIn> {
  const { data } = await httpClient.post<ApiEnvelope<BookingCheckIn>>(
    `/scheduling/bookings/${bookingId}/check-in`,
  );
  return data.data;
}
