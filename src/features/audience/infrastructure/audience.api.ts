import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  AudienceProfile,
  CompleteAudienceProfilePayload,
  ScanQrPayload,
  ScanQrResult,
} from '../domain/audience.types';
import type { MusicianPublic } from '../domain/musician-public.types';
import type { PaginationMeta } from '../domain/establishment.types';

export async function getAudience(id: string): Promise<AudienceProfile> {
  const { data } = await httpClient.get<ApiEnvelope<AudienceProfile>>(`/audiences/${id}`);
  return data.data;
}

export async function completeAudienceProfile(
  id: string,
  payload: CompleteAudienceProfilePayload,
): Promise<AudienceProfile> {
  const { data } = await httpClient.patch<ApiEnvelope<AudienceProfile>>(`/audiences/${id}/complete-profile`, payload);
  return data.data;
}

// POST /audiences/:id/scan-qr — qr_code precisa bater soundmeet://musician/<uuid>
// (ScanQRUseCase valida no backend); ver QRScannerScreen.
export async function scanQr(id: string, payload: ScanQrPayload): Promise<ScanQrResult> {
  const { data } = await httpClient.post<ApiEnvelope<ScanQrResult>>(`/audiences/${id}/scan-qr`, payload);
  return data.data;
}

// POST /audiences/:id/attend-event — pré-requisito pra CanMakeRequestPolicy
// aceitar um pedido musical do fã pro evento (ver SongRequestScreen).
export async function attendEvent(id: string, eventId: string, establishmentId?: string): Promise<AudienceProfile> {
  const { data } = await httpClient.post<ApiEnvelope<AudienceProfile>>(`/audiences/${id}/attend-event`, {
    event_id: eventId,
    establishment_id: establishmentId,
  });
  return data.data;
}

interface RecommendedMusiciansResponse {
  data: MusicianPublic[];
  meta: PaginationMeta;
}

// GET /audiences/:id/recommendations/musicians — recomendação baseada nas
// preferências do fã (favorite_genres/instruments).
export async function getRecommendedMusicians(
  id: string,
  page = 1,
  perPage = 10,
): Promise<RecommendedMusiciansResponse> {
  const { data } = await httpClient.get<RecommendedMusiciansResponse>(
    `/audiences/${id}/recommendations/musicians`,
    { params: { page, per_page: perPage, only_active: true } },
  );
  return data;
}
