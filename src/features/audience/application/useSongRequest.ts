import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRequestSuggestions, makeMusicRequest, voteOnRequest } from '../infrastructure/request.api';
import type { MakeMusicRequestPayload, VoteType } from '../domain/request.types';
import { audienceProfileKey } from './useAudience';
import { audiencePointsKey, audienceBadgesKey } from './useAudienceGamification';

export const requestSuggestionsKey = (musicianId: string) => ['requests', 'suggestions', musicianId] as const;

// GET /requests/musicians/:musician_id/suggestions — popularidade histórica,
// não catálogo (ver soundmeet-backend/Docs/roadmap.md Bloco 7.14).
export function useRequestSuggestions(musicianId: string | null) {
  return useQuery({
    queryKey:  musicianId ? requestSuggestionsKey(musicianId) : ['requests', 'suggestions', 'disabled'],
    queryFn:   () => getRequestSuggestions(musicianId!),
    enabled:   !!musicianId,
    staleTime: 60 * 1_000,
  });
}

// Wrapper gamificado credita +25 pts (MakeMusicRequestUseCase) — invalida
// também o cache de gamificação, não só o perfil (mesmo raciocínio de
// useScanQr.ts), senão GamificationScreen fica com pontos/badges
// desatualizados até o staleTime de 60s expirar.
export function useMakeMusicRequest(audienceId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MakeMusicRequestPayload) => makeMusicRequest(audienceId!, payload),
    onSuccess: () => {
      if (!audienceId) return;
      queryClient.invalidateQueries({ queryKey: audienceProfileKey(audienceId) });
      queryClient.invalidateQueries({ queryKey: audiencePointsKey(audienceId) });
      queryClient.invalidateQueries({ queryKey: audienceBadgesKey(audienceId) });
    },
  });
}

export function useVoteOnRequest() {
  return useMutation({
    mutationFn: ({ requestId, voteType }: { requestId: string; voteType: VoteType }) =>
      voteOnRequest(requestId, voteType),
  });
}
