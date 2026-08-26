import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  LivePerformance,
  MusicianResume,
  OpenableEvent,
  Performance,
  PerformanceReport,
  SetlistSuggestions,
  StartSongPayload,
} from './performance.types';

/**
 * POST /performances — abre o set.
 *
 * `musician_id` NÃO vai no corpo: o backend o tira do token. Mandá-lo daqui
 * seria oferecer ao cliente um campo que ele não deve controlar.
 */
export async function startPerformance(payload: {
  event_id: string;
  band_id?: string;
}): Promise<Performance> {
  const { data } = await httpClient.post<ApiEnvelope<Performance>>(
    '/performances',
    payload,
  );
  return data.data;
}

/** POST /performances/:id/songs — começa uma música (fecha a anterior). */
export async function startSong(
  performanceId: string,
  payload: StartSongPayload,
): Promise<Performance> {
  const { data } = await httpClient.post<ApiEnvelope<Performance>>(
    `/performances/${performanceId}/songs`,
    payload,
  );
  return data.data;
}

/** PATCH /performances/:id/end — encerra. Idempotente no backend. */
export async function endPerformance(
  performanceId: string,
): Promise<Performance> {
  const { data } = await httpClient.patch<ApiEnvelope<Performance>>(
    `/performances/${performanceId}/end`,
    {},
  );
  return data.data;
}

export async function getPerformance(
  performanceId: string,
): Promise<Performance> {
  const { data } = await httpClient.get<ApiEnvelope<Performance>>(
    `/performances/${performanceId}`,
  );
  return data.data;
}

export async function getPerformanceReport(
  performanceId: string,
): Promise<PerformanceReport> {
  const { data } = await httpClient.get<ApiEnvelope<PerformanceReport>>(
    `/performances/${performanceId}/report`,
  );
  return data.data;
}

export async function listPerformances(params: {
  status?: string;
  page?: number;
  per_page?: number;
}): Promise<{ items: Performance[]; total: number; last_page: number }> {
  const { data } = await httpClient.get<
    ApiEnvelope<{ items: Performance[]; total: number; last_page: number }>
  >('/performances', { params });
  return data.data;
}

/**
 * GET /performances/live — o que o músico está tocando AGORA.
 *
 * A rota literal `live` é servida por um controller separado, declarado antes
 * do que tem `:performance_id` — senão `live` casaria como id e viraria 422.
 */
export async function getLivePerformance(params: {
  musician_id: string;
  event_id: string;
}): Promise<LivePerformance> {
  const { data } = await httpClient.get<ApiEnvelope<LivePerformance>>(
    '/performances/live',
    { params },
  );
  return data.data;
}

/** GET /musicians/:id/resume — currículo verificado (também lido pelo fã). */
export async function getMusicianResume(
  musicianId: string,
): Promise<MusicianResume> {
  const { data } = await httpClient.get<ApiEnvelope<MusicianResume>>(
    `/musicians/${musicianId}/resume`,
  );
  return data.data;
}

/** GET /musicians/:id/setlist-suggestions — só o próprio músico. */
export async function getSetlistSuggestions(
  musicianId: string,
  params: { establishment_id: string; limit?: number },
): Promise<SetlistSuggestions> {
  const { data } = await httpClient.get<ApiEnvelope<SetlistSuggestions>>(
    `/musicians/${musicianId}/setlist-suggestions`,
    { params },
  );
  return data.data;
}

/**
 * GET /performances/openable-events — em quais shows posso abrir um set agora.
 *
 * Rota literal declarada antes de `:performance_id` no controller; invertida,
 * `openable-events` casaria como id e viraria 422.
 */
export async function listOpenableEvents(): Promise<{ events: OpenableEvent[] }> {
  const { data } = await httpClient.get<ApiEnvelope<{ events: OpenableEvent[] }>>(
    '/performances/openable-events',
  );
  return data.data;
}
