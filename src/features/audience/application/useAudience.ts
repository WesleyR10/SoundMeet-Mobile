import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAudience, completeAudienceProfile } from '../infrastructure/audience.api';
import type { CompleteAudienceProfilePayload } from '../domain/audience.types';

export const audienceProfileKey = (audienceId: string) => ['audience', audienceId, 'profile'] as const;

export function useAudience(audienceId: string | null) {
  return useQuery({
    queryKey:  audienceId ? audienceProfileKey(audienceId) : ['audience', 'profile', 'disabled'],
    queryFn:   () => getAudience(audienceId!),
    enabled:   !!audienceId,
    staleTime: 30 * 1_000,
  });
}

export function useCompleteAudienceProfile(audienceId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompleteAudienceProfilePayload) => completeAudienceProfile(audienceId!, payload),
    onSuccess: () => {
      if (audienceId) queryClient.invalidateQueries({ queryKey: audienceProfileKey(audienceId) });
    },
  });
}
