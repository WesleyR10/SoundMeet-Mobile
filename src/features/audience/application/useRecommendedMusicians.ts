import { useQuery } from '@tanstack/react-query';
import { getRecommendedMusicians } from '../infrastructure/audience.api';

export const recommendedMusiciansKey = (audienceId: string) => ['audience', audienceId, 'recommendations', 'musicians'] as const;

// GET /audiences/:id/recommendations/musicians — base do carrossel "Pra
// você" da Home do fã.
export function useRecommendedMusicians(audienceId: string | null) {
  return useQuery({
    queryKey:  audienceId ? recommendedMusiciansKey(audienceId) : ['audience', 'recommendations', 'disabled'],
    queryFn:   () => getRecommendedMusicians(audienceId!),
    enabled:   !!audienceId,
    staleTime: 60 * 1_000,
  });
}
