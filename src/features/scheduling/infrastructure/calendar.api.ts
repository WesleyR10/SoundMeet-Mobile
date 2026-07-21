import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { FreeBusy } from '../domain/availability.types';

// GET /scheduling/calendar/free-busy — intervalos ocupados (bookings
// confirmados + bloqueios) no período. Rota pública no backend, mas aqui
// sempre chamada autenticada (mesmo httpClient).
export async function getFreeBusy(
  musicianId: string,
  startAtISO: string,
  endAtISO: string,
): Promise<FreeBusy> {
  const { data } = await httpClient.get<ApiEnvelope<FreeBusy>>('/scheduling/calendar/free-busy', {
    params: {
      target_type: 'musician',
      target_id:   musicianId,
      start_at:    startAtISO,
      end_at:      endAtISO,
    },
  });
  return data.data;
}
