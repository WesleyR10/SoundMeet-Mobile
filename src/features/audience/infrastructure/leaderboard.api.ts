import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { UserPoints } from '@/shared/services/gamification/gamification.types';

// GET /gamification/leaderboard — @Public(). IMPORTANTE: UserPointsPresenter
// não tem nome/avatar (só user_id) — não existe forma de resolver o nome de
// OUTRO fã no ranking (GET /audiences/:id só permite dono/admin). LeaderboardScreen
// mostra posição + pontos, sem nome fabricado. Ver
// soundmeet-backend/Docs/roadmap.md Bloco 7.16 (gap registrado).
export async function getLeaderboard(limit = 20): Promise<UserPoints[]> {
  const { data } = await httpClient.get<ApiEnvelope<UserPoints[]>>('/gamification/leaderboard', {
    params: { limit },
  });
  return data.data;
}
