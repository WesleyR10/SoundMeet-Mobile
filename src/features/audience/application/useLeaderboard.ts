import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '../infrastructure/leaderboard.api';

export const leaderboardKey = (limit: number) => ['gamification', 'leaderboard', limit] as const;

export function useLeaderboard(limit = 20) {
  return useQuery({
    queryKey:  leaderboardKey(limit),
    queryFn:   () => getLeaderboard(limit),
    staleTime: 60 * 1_000,
  });
}
