import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  AudienceRequest,
  MakeMusicRequestPayload,
  MakeMusicRequestResult,
  RequestBoostPayment,
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

// GET /requests/:id/boost/payment — o QR da cobrança do destaque.
//
// Existe porque a cobrança nasce quando o MÚSICO aceita: o fã não está na tela
// nesse instante. O socket entrega o QR a quem está com o app aberto; esta rota
// é o caminho de quem voltou depois (e o público não tem push registrado).
export async function getRequestBoostPayment(requestId: string): Promise<RequestBoostPayment> {
  const { data } = await httpClient.get<ApiEnvelope<RequestBoostPayment>>(
    `/requests/${requestId}/boost/payment`,
  );
  return data.data;
}

// GET /requests/audiences/:audience_id — os pedidos do próprio fã.
//
// Usado no cold start: o `pending-boost.store` vive em memória de propósito
// (um QR em cache de disco poderia ressuscitar vencido), então quem fecha o
// app perde o banner. Esta lista é o que o traz de volta.
export async function getAudienceRequests(
  audienceId: string,
  perPage = 20,
): Promise<AudienceRequest[]> {
  const { data } = await httpClient.get<{ data: AudienceRequest[] }>(
    `/requests/audiences/${audienceId}`,
    { params: { per_page: perPage, sort: 'created_at', sort_dir: 'desc' } },
  );
  return data.data;
}
