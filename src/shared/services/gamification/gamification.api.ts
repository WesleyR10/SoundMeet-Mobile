import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { UserBadge, UserPoints } from './gamification.types';

// GET /gamification/users/:user_id/badges — usuário só pode consultar os
// próprios badges (backend valida currentUser.userId === user_id, 403 caso
// contrário). user_id aqui é o `sub` do Keycloak (auth.store.userId), não o
// musicianId/audienceId.
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data } = await httpClient.get<ApiEnvelope<UserBadge[]>>(`/gamification/users/${userId}/badges`);
  return data.data;
}

// GET /gamification/users/:user_id/points — mesmo esquema de ownership acima.
// Quando o usuário ainda não tem pontos, o backend retorna `null` (não
// `{ data: null }`) — WrapperDataInterceptor pula o wrap quando `!body`
// (ver wrapper-data.interceptor.ts), então o corpo HTTP é o `null` cru.
// `data?.data` (não `data.data`) evita TypeError nesse caso.
export async function getUserPoints(userId: string): Promise<UserPoints | null> {
  const { data } = await httpClient.get<ApiEnvelope<UserPoints> | null>(`/gamification/users/${userId}/points`);
  return data?.data ?? null;
}
