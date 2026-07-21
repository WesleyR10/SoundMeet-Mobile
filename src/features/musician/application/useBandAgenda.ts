import { useQuery } from '@tanstack/react-query';
import { getBandFreeBusy } from '../infrastructure/band.api';

const UPCOMING_WINDOW_DAYS = 30;

// Agenda da banda somente-leitura (v1) — não é o grid mensal interativo do
// músico (AgendaScreen), só a lista de compromissos dos próximos 30 dias.
// Mesmo endpoint (GET scheduling/calendar/free-busy) já usado por
// useMonthBusy, com target_type=band.
export function useBandAgenda(bandId: string | null) {
  const start = new Date();
  const end = new Date(start.getTime() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  return useQuery({
    queryKey: bandId
      ? (['musician', 'bands', bandId, 'free-busy'] as const)
      : (['musician', 'bands', 'free-busy', 'disabled'] as const),
    queryFn:   () => getBandFreeBusy(bandId!, start.toISOString(), end.toISOString()),
    enabled:   !!bandId,
    staleTime: 30 * 1_000,
  });
}
