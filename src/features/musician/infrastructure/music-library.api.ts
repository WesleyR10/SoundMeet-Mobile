import { httpClient } from '@/shared/services/http/client';

// Resposta de GET /music-library/items já vem com `meta` (CollectionPresenter
// do backend) — o WrapperDataInterceptor global pula o wrap de envelope nesse
// caso (ver nota em CLAUDE.md), então NÃO é `ApiEnvelope<T>` como os outros
// adapters do módulo músico.
interface MusicLibraryListResponse {
  data: unknown[];
  meta: { current_page: number; per_page: number; last_page: number; total: number };
}

// Só a contagem — usado pelo tile "Repertório" da Home (Bloco 10.3). Sem
// musician_id no filtro: o backend deriva do JWT pra role musician (só admin
// pode especificar outro musician_id), então essa chamada já vem escopada à
// própria biblioteca de quem está logado.
export async function getRepertoireCount(): Promise<number> {
  const { data } = await httpClient.get<MusicLibraryListResponse>('/music-library/items', {
    params: { per_page: 1 },
  });
  return data.meta.total;
}
