import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { MusicianPublic } from '../domain/musician-public.types';

// GET /musicians/:id é @Public() — visão readonly do fã (MusicianPublicProfileScreen).
export async function getMusicianPublic(id: string): Promise<MusicianPublic> {
  const { data } = await httpClient.get<ApiEnvelope<MusicianPublic>>(`/musicians/${id}`);
  return data.data;
}
