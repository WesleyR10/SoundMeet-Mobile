import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { MusicianAnalytics } from '../domain/analytics.types';

export async function getAnalytics(musicianId: string): Promise<MusicianAnalytics> {
  const { data } = await httpClient.get<ApiEnvelope<MusicianAnalytics>>(`/musicians/${musicianId}/analytics`);
  return data.data;
}
