import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { UserPoints } from '@/shared/services/gamification/gamification.types';

// GET /gamification/leaderboard — @Public(). Backend 7.16b (jul/2026):
// UserPointsPresenter agora inclui nickname/avatar do fã (join via Prisma
// include na mesma query — sem round-trip extra), resolvendo o gap que
// forçava LeaderboardScreen a mostrar "Fã #<hash>" em vez do nome real.
export async function getLeaderboard(limit = 20): Promise<UserPoints[]> {
  const { data } = await httpClient.get<ApiEnvelope<UserPoints[]>>('/gamification/leaderboard', {
    params: { limit },
  });
  return data.data;
}
