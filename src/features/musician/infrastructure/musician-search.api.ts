import { httpClient } from '@/shared/services/http/client';
import type { MusicianSearchResult } from '../domain/musician-search.types';

interface MusicianSearchResponse {
  data: MusicianSearchResult[];
  meta: { current_page: number; per_page: number; last_page: number; total: number };
}

// GET /musicians?filter[stage_name]= — @Public() no backend, mas só usado
// aqui dentro do fluxo de convite nominal (autenticado). Filtro é objeto
// aninhado, axios já serializa em bracket notation por padrão (mesmo padrão
// de establishment.api.ts/listEstablishments).
export async function searchMusiciansByName(query: string, perPage = 10): Promise<MusicianSearchResult[]> {
  const { data } = await httpClient.get<MusicianSearchResponse>('/musicians', {
    params: { filter: { stage_name: query }, per_page: perPage },
  });
  return data.data;
}
