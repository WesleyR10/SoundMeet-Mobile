import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import { REJECTION_REASON_MAX_LENGTH } from '../domain/request.types';
import type {
  BatchRespondResult,
  MusicianRequestsResult,
  MusicRequest,
  RequestStatus,
  RespondToRequestAction,
} from '../domain/request.types';

// GET /requests/musicians/:musician_id — não GET /api/v1/requests (rota
// listada no roadmap-mobile.md original estava desatualizada/errada).
export async function listRequests(
  musicianId: string,
  status: RequestStatus | 'all' = 'pending',
  page = 1,
  perPage = 20,
): Promise<MusicianRequestsResult> {
  const { data } = await httpClient.get<ApiEnvelope<MusicianRequestsResult>>(
    `/requests/musicians/${musicianId}`,
    { params: { status, page, per_page: perPage } },
  );
  return data.data;
}

// PATCH /requests/:id/respond — não POST /:id/accept|reject (idem acima).
export async function acceptRequest(requestId: string): Promise<MusicRequest> {
  const { data } = await httpClient.patch<ApiEnvelope<MusicRequest>>(
    `/requests/${requestId}/respond`,
    { action: 'accept' },
  );
  return data.data;
}

export async function rejectRequest(requestId: string, rejectionReason?: string): Promise<MusicRequest> {
  const { data } = await httpClient.patch<ApiEnvelope<MusicRequest>>(
    `/requests/${requestId}/respond`,
    { action: 'reject', rejection_reason: rejectionReason },
  );
  return data.data;
}

// POST /requests/batch-respond — responde até BATCH_RESPOND_MAX_ITEMS pedidos
// numa chamada só (o músico volta do intervalo com a fila acumulada).
//
// 🔴 A rota NÃO é atômica, e é isso que o chamador precisa tratar: ela devolve
// 200 mesmo quando parte do lote falhou. Quem só olha o status HTTP conclui
// que respondeu 30 pedidos tendo respondido 27. Ver `BatchRespondResult`.
//
// O músico é sempre o do token — `musician_id` não vai no corpo de propósito
// (o backend o ignora; aceitar do cliente seria responder pedido dos outros).
export async function batchRespondRequests(
  requestIds: string[],
  action: RespondToRequestAction,
  rejectionReason?: string,
): Promise<BatchRespondResult> {
  const { data } = await httpClient.post<ApiEnvelope<BatchRespondResult>>(
    '/requests/batch-respond',
    {
      request_ids: requestIds,
      action,
      // Só acompanha a recusa por semântica, não por validação: o DTO marca
      // `rejection_reason` como @IsOptional(), então o backend aceitaria o
      // campo num accept e o guardaria sem sentido nenhum.
      ...(action === 'reject' && rejectionReason
        ? { rejection_reason: rejectionReason.slice(0, REJECTION_REASON_MAX_LENGTH) }
        : {}),
    },
  );
  return data.data;
}
