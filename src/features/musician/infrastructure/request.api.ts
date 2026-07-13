import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { MusicianRequestsResult, MusicRequest, RequestStatus } from '../domain/request.types';

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
