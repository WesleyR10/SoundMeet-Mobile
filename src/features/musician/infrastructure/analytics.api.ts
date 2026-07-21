import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { MusicianAnalytics } from '../domain/analytics.types';

// Normaliza o payload: backends desatualizados/respostas parciais podem omitir
// campos numéricos ou a lista de músicas — a UI assume todos presentes
// (ex.: average_rating.toFixed, top_requested_songs.length), então o adapter
// garante defaults em vez de deixar undefined vazar pro render.
function toMusicianAnalytics(raw: Partial<MusicianAnalytics>, musicianId: string): MusicianAnalytics {
  return {
    musician_id:             raw.musician_id ?? musicianId,
    average_rating:          raw.average_rating ?? 0,
    total_ratings:           raw.total_ratings ?? 0,
    plan_tier:               raw.plan_tier ?? 'free',
    realtime_available:      raw.realtime_available ?? false,
    accepted_requests_count: raw.accepted_requests_count ?? 0,
    rejected_requests_count: raw.rejected_requests_count ?? 0,
    total_tips_amount:       raw.total_tips_amount ?? 0,
    top_requested_songs:     raw.top_requested_songs ?? [],
  };
}

export async function getAnalytics(musicianId: string): Promise<MusicianAnalytics> {
  const { data } = await httpClient.get<ApiEnvelope<Partial<MusicianAnalytics>>>(
    `/musicians/${musicianId}/analytics`,
  );
  return toMusicianAnalytics(data.data ?? {}, musicianId);
}
