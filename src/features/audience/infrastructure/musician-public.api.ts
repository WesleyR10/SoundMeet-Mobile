import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { MusicianListParams, MusicianPublic } from '../domain/musician-public.types';
import type { PaginationMeta } from '../domain/establishment.types';

// GET /musicians/:id é @Public() — visão readonly do fã (MusicianPublicProfileScreen).
export async function getMusicianPublic(id: string): Promise<MusicianPublic> {
  const { data } = await httpClient.get<ApiEnvelope<MusicianPublic>>(`/musicians/${id}`);
  return data.data;
}

interface MusicianListResponse {
  data: MusicianPublic[];
  meta: PaginationMeta;
}

// GET /musicians — @Public(); busca de músicos do fã (FanExplore, 7.13c).
// Filtro é objeto aninhado (`filter[name]=...`), axios serializa em bracket
// notation; lista paginada vem com meta, então NÃO usa ApiEnvelope.
export async function listMusicians(params: MusicianListParams = {}): Promise<MusicianListResponse> {
  const { data } = await httpClient.get<MusicianListResponse>('/musicians', { params });
  return data;
}
