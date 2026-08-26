import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getPracticeSeparation,
  requestPracticeSeparation,
} from '../infrastructure/ai-audio.api';
import {
  isPracticeJobSettled,
  type PracticeSeparationJob,
} from '../domain/practice.types';

export const practiceJobKey = (jobId: string) =>
  ['practice', 'separation', jobId] as const;

/**
 * A separação roda em GPU e leva de dezenas de segundos a minutos. 3s é o
 * meio-termo: rápido o bastante para a barra de progresso parecer viva, lento
 * o bastante para não martelar o backend durante uma espera longa.
 */
const POLL_INTERVAL_MS = 3_000;

export function usePracticeSeparationJob(jobId: string | null) {
  return useQuery({
    queryKey: jobId ? practiceJobKey(jobId) : ['practice', 'separation', 'idle'],
    queryFn:  () => getPracticeSeparation(jobId!),
    enabled:  !!jobId,
    // Para de perguntar assim que o job chega a um estado terminal — inclusive
    // `expired`, que não é erro: é o prazo de retenção dos stems tendo vencido.
    refetchInterval: (query) => {
      const data = query.state.data as PracticeSeparationJob | undefined;
      if (!data) return POLL_INTERVAL_MS;
      return isPracticeJobSettled(data.status) ? false : POLL_INTERVAL_MS;
    },
  });
}

export function useRequestPracticeSeparation(musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (musicLibraryId: string) => {
      if (!musicianId) {
        throw new Error('Sessão sem músico.');
      }
      return requestPracticeSeparation(musicianId, {
        music_library_id: musicLibraryId,
      });
    },
    onSuccess: (job) => {
      // Semeia o cache para o polling já começar do estado real em vez de
      // esperar o primeiro GET.
      queryClient.setQueryData(practiceJobKey(job.id), job);
    },
  });
}
