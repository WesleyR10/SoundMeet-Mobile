import { useQuery } from '@tanstack/react-query';
import { getUserBadges } from '@/shared/services/gamification/gamification.api';

export const musicianBadgesKey = (userId: string) => ['gamification', userId, 'badges'] as const;

// Conquistas recentes da Home (Bloco 10.3) — GET /gamification/users/:user_id/badges
// usa o `sub` do Keycloak (auth.store.userId), não musicianId: o backend
// valida currentUser.userId === user_id, não o aggregate de músico.
export function useMusicianBadges(userId: string | null) {
  return useQuery({
    queryKey:  userId ? musicianBadgesKey(userId) : ['gamification', 'badges', 'disabled'],
    queryFn:   () => getUserBadges(userId!),
    enabled:   !!userId,
    staleTime: 60 * 1_000,
  });
}
