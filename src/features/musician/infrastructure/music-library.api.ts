import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { MusicLibraryItem } from '../domain/music-library.types';

// Resposta de GET /music-library/items já vem com `meta` (CollectionPresenter
// do backend) — o WrapperDataInterceptor global pula o wrap de envelope nesse
// caso (ver nota em CLAUDE.md), então NÃO é `ApiEnvelope<T>` como os outros
// adapters do módulo músico.
interface MusicLibraryListResponse<T> {
  data: T[];
  meta: { current_page: number; per_page: number; last_page: number; total: number };
}

// Só a contagem — usado pelo tile "Repertório" da Home (Bloco 10.3). Sem
// musician_id no filtro: o backend deriva do JWT pra role musician (só admin
// pode especificar outro musician_id), então essa chamada já vem escopada à
// própria biblioteca de quem está logado.
export async function getRepertoireCount(): Promise<number> {
  const { data } = await httpClient.get<MusicLibraryListResponse<unknown>>('/music-library/items', {
    params: { per_page: 1 },
  });
  return data.meta.total;
}

// GET /music-library/items/:id — sem ownership guard no backend (só
// update/remove checam posse), então serve tanto pro enriquecimento de
// título/artista das PRÓPRIAS cifras pessoais quanto das da comunidade
// (o item pertence ao AUTOR do fork, não a quem está lendo).
export async function getMusicLibraryItem(id: string): Promise<MusicLibraryItem> {
  const { data } = await httpClient.get<ApiEnvelope<MusicLibraryItem>>(`/music-library/items/${id}`);
  return data.data;
}

// Lista a PRÓPRIA biblioteca (o backend deriva musician_id do JWT pra role
// musician, ver findAll do MusicLibraryController) — usado pelo picker de
// AddPersonalChordSheetScreen e pela checagem de "já tenho essa música" do
// fluxo de import da comunidade.
export async function listMyMusicLibraryItems(
  params?: { page?: number; per_page?: number; title?: string; artist?: string },
): Promise<MusicLibraryListResponse<MusicLibraryItem>> {
  const { data } = await httpClient.get<MusicLibraryListResponse<MusicLibraryItem>>('/music-library/items', {
    params,
  });
  return data;
}
