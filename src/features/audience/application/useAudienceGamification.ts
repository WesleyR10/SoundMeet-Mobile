import { useQuery } from '@tanstack/react-query';
import { getUserBadges, getUserPoints } from '@/shared/services/gamification/gamification.api';

// Mesmo adapter compartilhado usado pela Home do músico (useMusicianBadges,
// Bloco 10.3) — GET /gamification/users/:user_id/... usa o `sub` do
// Keycloak (auth.store.userId), não audienceId.
export const audiencePointsKey  = (userId: string) => ['gamification', userId, 'points'] as const;
export const audienceBadgesKey  = (userId: string) => ['gamification', userId, 'badges'] as const;

export function useAudiencePoints(userId: string | null) {
  return useQuery({
    queryKey:  userId ? audiencePointsKey(userId) : ['gamification', 'points', 'disabled'],
    queryFn:   () => getUserPoints(userId!),
    enabled:   !!userId,
    staleTime: 60 * 1_000,
  });
}

export function useAudienceBadges(userId: string | null) {
  return useQuery({
    queryKey:  userId ? audienceBadgesKey(userId) : ['gamification', 'badges', 'disabled'],
    queryFn:   () => getUserBadges(userId!),
    enabled:   !!userId,
    staleTime: 60 * 1_000,
  });
}
