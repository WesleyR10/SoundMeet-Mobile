import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addUnavailability,
  getAvailability,
  removeUnavailability,
  setWeeklyRules,
} from '../infrastructure/availability.api';
import type { AddUnavailabilityPayload, WeeklyRuleInput } from '../domain/availability.types';

export const availabilityKey = (musicianId: string) => ['scheduling', musicianId, 'availability'] as const;
export const monthBusyPrefix = (musicianId: string) => ['scheduling', musicianId, 'free-busy'] as const;

export function useAvailability(musicianId: string | null) {
  return useQuery({
    queryKey:  musicianId ? availabilityKey(musicianId) : ['scheduling', 'availability', 'disabled'],
    queryFn:   () => getAvailability(musicianId!),
    enabled:   !!musicianId,
    staleTime: 30 * 1_000,
  });
}

// As três mutations devolvem o AvailabilityPresenter completo — atualizamos o
// cache direto com a resposta (sem refetch) e invalidamos o free-busy do mês,
// que deriva dos bloqueios.
function useAvailabilityMutation<TArgs>(
  musicianId: string,
  mutationFn: (args: TArgs) => ReturnType<typeof getAvailability>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (availability) => {
      queryClient.setQueryData(availabilityKey(musicianId), availability);
      queryClient.invalidateQueries({ queryKey: monthBusyPrefix(musicianId) });
    },
  });
}

export function useSetWeeklyRules(musicianId: string) {
  return useAvailabilityMutation(musicianId, (rules: WeeklyRuleInput[]) =>
    setWeeklyRules(musicianId, rules),
  );
}

export function useAddUnavailability(musicianId: string) {
  return useAvailabilityMutation(musicianId, (payload: AddUnavailabilityPayload) =>
    addUnavailability(musicianId, payload),
  );
}

export function useRemoveUnavailability(musicianId: string) {
  return useAvailabilityMutation(musicianId, (blockId: string) =>
    removeUnavailability(musicianId, blockId),
  );
}
