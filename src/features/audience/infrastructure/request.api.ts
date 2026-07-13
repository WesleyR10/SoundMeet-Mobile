import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  MakeMusicRequestPayload,
  MakeMusicRequestResult,
  RequestSuggestionsResult,
  VoteType,
} from '../domain/request.types';

// POST /audiences/:id/music-requests — wrapper gamificado (cria o pedido via
// CreateRequestUseCase por dentro + credita +25 pts numa chamada só);
// preferido sobre POST /requests direto pelo mesmo motivo do padrão de tips
// (ver soundmeet-mobile/Docs/roadmap-mobile.md 11.8).
export async function makeMusicRequest(
  audienceId: string,
  payload: MakeMusicRequestPayload,
): Promise<MakeMusicRequestResult> {
  const { data } = await httpClient.post<ApiEnvelope<MakeMusicRequestResult>>(
    `/audiences/${audienceId}/music-requests`,
    payload,
  );
  return data.data;
}

// GET /requests/musicians/:musician_id/suggestions — sugestões por
// popularidade (histórico de pedidos), NÃO catálogo de repertório — gap real,
// ver soundmeet-backend/Docs/roadmap.md Bloco 7.14.
export async function getRequestSuggestions(musicianId: string, limit = 8): Promise<RequestSuggestionsResult> {
  const { data } = await httpClient.get<ApiEnvelope<RequestSuggestionsResult>>(
    `/requests/musicians/${musicianId}/suggestions`,
    { params: { limit } },
  );
  return data.data;
}

// POST /requests/:id/votes — corpo é `{ vote_type }`, não `{ vote }` (nome de
// campo confirmado em vote-request.dto.ts, diferente do wrapper de votos do
// audiences-module).
export async function voteOnRequest(requestId: string, voteType: VoteType): Promise<void> {
  await httpClient.post(`/requests/${requestId}/votes`, { vote_type: voteType });
}
