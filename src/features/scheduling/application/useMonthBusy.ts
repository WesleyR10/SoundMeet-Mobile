import { useQuery } from '@tanstack/react-query';
import { getFreeBusy } from '../infrastructure/calendar.api';
import { monthBusyPrefix } from './useAvailability';

// Free/busy do mês visível no calendário da Agenda — bookings confirmados
// (dias de show) + bloqueios (férias/indisponibilidade).
export function useMonthBusy(musicianId: string | null, year: number, month: number) {
  // Range UTC simples cobrindo o mês local com folga de fuso (±1 dia) — o
  // objetivo é marcar DIAS no grid, não calcular slots precisos (isso é o
  // backend que faz via month-slots quando o estabelecimento propõe booking).
  const start = new Date(Date.UTC(year, month - 1, 1));
  start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(Date.UTC(year, month, 1));
  end.setUTCDate(end.getUTCDate() + 1);

  return useQuery({
    queryKey: musicianId
      ? ([...monthBusyPrefix(musicianId), year, month] as const)
      : (['scheduling', 'free-busy', 'disabled'] as const),
    queryFn:   () => getFreeBusy(musicianId!, start.toISOString(), end.toISOString()),
    enabled:   !!musicianId,
    staleTime: 30 * 1_000,
  });
}
