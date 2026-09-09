import type { BookingCheckIn } from './check-in.types';

/**
 * Regras do registro da apresentação (F1.3a).
 *
 * 🔴 **O check-in é o que destranca o cachê em custódia.**
 * `ReleaseBookingEscrowUseCase` recusa liberar com `!booking.isCheckedIn`, e
 * até esta fatia `POST /scheduling/bookings/:id/check-in` **não tinha cliente
 * nenhum** — nem no app, nem no painel. Com a custódia ligada, o dinheiro do
 * artista ficaria retido para sempre: o job horário rodaria, não encontraria
 * nada liberável e não registraria erro em lugar nenhum.
 *
 * Espelho de `booking.aggregate.ts` (`checkIn`) e gêmeo de
 * `soundmeet-web/src/features/hiring/domain/booking-lifecycle.ts`. Não
 * substituem a validação do backend — evitam oferecer ação que ele recusaria
 * com 422, e evitam esconder a que ele aceitaria.
 */

/**
 * Dá para registrar a apresentação?
 *
 * Três condições do agregado: booking `confirmed`, show já começado, e ainda
 * não registrado (o `checkIn` é idempotente — o primeiro registro vale —, então
 * reofertar depois só produziria um no-op silencioso).
 */
export function canCheckIn(booking: BookingCheckIn | null, now: Date = new Date()): boolean {
  if (!booking) return false;
  if (booking.status !== 'confirmed') return false;
  if (booking.checked_in_at !== null) return false;

  const start = new Date(booking.start_at).getTime();
  if (!Number.isFinite(start)) return false;

  return now.getTime() >= start;
}

/**
 * O show terminou e ninguém registrou?
 *
 * É o estado que a tela precisa **destacar**, não só permitir: o cachê fica
 * retido enquanto isso for verdade, e o músico não tem como saber disso — a
 * carteira dele mostraria saldo retido sem dizer o que falta.
 */
export function isCheckInOverdue(booking: BookingCheckIn | null, now: Date = new Date()): boolean {
  if (!booking) return false;
  if (booking.status !== 'confirmed' || booking.checked_in_at !== null) return false;

  const end = new Date(booking.end_at).getTime();
  if (!Number.isFinite(end)) return false;

  return now.getTime() > end;
}

/**
 * O cartão de registro tem algo a dizer sobre este booking?
 *
 * Booking que nunca chegou a acontecer não tem apresentação a registrar — e um
 * cartão vazio na tela do contrato é ruído no lugar mais formal do app.
 */
export function hasPerformanceRecord(booking: BookingCheckIn | null): boolean {
  if (!booking) return false;
  return booking.status === 'confirmed' || booking.status === 'completed';
}
