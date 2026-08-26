import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  endPerformance,
  getMusicianResume,
  getPerformance,
  getPerformanceReport,
  getSetlistSuggestions,
  listOpenableEvents,
  listPerformances,
  startPerformance,
  startSong,
} from '@/shared/services/performance/performance.api';
import type { StartSongPayload } from '@/shared/services/performance/performance.types';
import { useLiveSetStore } from './liveSet.store';

export const performanceKey = (id: string) => ['performance', id] as const;
export const performanceReportKey = (id: string) =>
  ['performance', id, 'report'] as const;
export const performanceHistoryKey = ['performance', 'history'] as const;
export const openableEventsKey = ['performance', 'openable-events'] as const;
export const musicianResumeKey = (musicianId: string) =>
  ['musician', musicianId, 'resume'] as const;
export const setlistSuggestionsKey = (
  musicianId: string,
  establishmentId: string,
) => ['musician', musicianId, 'setlist-suggestions', establishmentId] as const;

/**
 * Shows em que o músico pode abrir um set agora.
 *
 * `staleTime` curto: a janela é de horas, mas o `live_performance_id` muda no
 * instante em que ele abre o set em outro aparelho — e é esse campo que decide
 * entre "Iniciar show" e "Voltar ao show".
 */
export function useOpenableEvents(enabled = true) {
  return useQuery({
    queryKey: openableEventsKey,
    queryFn:  listOpenableEvents,
    enabled,
    staleTime: 30 * 1_000,
  });
}

export function usePerformance(performanceId: string | null) {
  return useQuery({
    queryKey: performanceId
      ? performanceKey(performanceId)
      : ['performance', 'disabled'],
    queryFn: () => getPerformance(performanceId!),
    enabled: !!performanceId,
  });
}

export function usePerformanceReport(performanceId: string | null) {
  return useQuery({
    queryKey: performanceId
      ? performanceReportKey(performanceId)
      : ['performance', 'report', 'disabled'],
    queryFn: () => getPerformanceReport(performanceId!),
    enabled: !!performanceId,
    // O relatório só existe para set encerrado — o número não muda mais.
    staleTime: Infinity,
  });
}

export function usePerformanceHistory() {
  return useQuery({
    queryKey: performanceHistoryKey,
    queryFn: () => listPerformances({ status: 'ended', per_page: 30 }),
  });
}

export function useMyResume(musicianId: string | null) {
  return useQuery({
    queryKey: musicianId
      ? musicianResumeKey(musicianId)
      : ['musician', 'resume', 'disabled'],
    queryFn: () => getMusicianResume(musicianId!),
    enabled: !!musicianId,
    staleTime: 5 * 60 * 1_000,
  });
}

export function useSetlistSuggestions(
  musicianId: string | null,
  establishmentId: string | null,
) {
  const enabled = !!musicianId && !!establishmentId;

  return useQuery({
    queryKey: enabled
      ? setlistSuggestionsKey(musicianId!, establishmentId!)
      : ['musician', 'setlist-suggestions', 'disabled'],
    queryFn: () =>
      getSetlistSuggestions(musicianId!, {
        establishment_id: establishmentId!,
      }),
    enabled,
    staleTime: 5 * 60 * 1_000,
  });
}

/**
 * Controle do set ao vivo — abrir, registrar música, encerrar.
 *
 * As mutations escrevem o resultado direto no cache com `setQueryData` em vez
 * de invalidar: no palco, com rede ruim, um refetch extra é latência visível
 * entre tocar o botão e a tela responder — e a resposta do backend já é o set
 * completo e atualizado.
 *
 * O store local (`useLiveSetStore`) é atualizado junto porque é ele que o Play
 * Mode consulta para saber se deve transmitir. Query cache serve a tela; o
 * store serve à decisão.
 */
export function usePerformanceControl() {
  const queryClient = useQueryClient();
  const setActiveSet = useLiveSetStore((s) => s.setActiveSet);
  const clearActiveSet = useLiveSetStore((s) => s.clearActiveSet);

  const start = useMutation({
    mutationFn: (payload: { event_id: string; band_id?: string }) =>
      startPerformance(payload),
    onSuccess: (performance) => {
      queryClient.setQueryData(performanceKey(performance.id), performance);
      setActiveSet({
        performanceId:   performance.id,
        eventId:         performance.event_id,
        establishmentId: performance.establishment_id,
        bandId:          performance.band_id,
        startedAt:       performance.started_at,
      });
      void queryClient.invalidateQueries({ queryKey: openableEventsKey });
    },
  });

  const playSong = useMutation({
    mutationFn: (vars: { performanceId: string; payload: StartSongPayload }) =>
      startSong(vars.performanceId, vars.payload),
    onSuccess: (performance) => {
      queryClient.setQueryData(performanceKey(performance.id), performance);
    },
  });

  const end = useMutation({
    mutationFn: (performanceId: string) => endPerformance(performanceId),
    onSuccess: (performance) => {
      queryClient.setQueryData(performanceKey(performance.id), performance);
      clearActiveSet();
      // O relatório e o histórico passam a existir só agora.
      void queryClient.invalidateQueries({
        queryKey: performanceReportKey(performance.id),
      });
      void queryClient.invalidateQueries({ queryKey: performanceHistoryKey });
      void queryClient.invalidateQueries({ queryKey: openableEventsKey });
    },
  });

  return { start, playSong, end };
}
