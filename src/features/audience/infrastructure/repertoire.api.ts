import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { SongCatalogResponse } from '../domain/repertoire.types';

// GET /musicians/:musician_id/song-catalog — catálogo para quem vai PEDIR.
//
// ⚠️ Não existe parâmetro de ESCOPO, e a ausência é a regra: quem decide se a
// busca varre a plataforma inteira ou só o repertório do músico é o próprio
// músico, lido no servidor. Um escopo na query devolveria ao cliente
// exatamente o limite que desligar o switch existe para impor.
//
// ⚠️ `musician_id` vive só no PATH, como na rota de repertório: o cliente
// escolhe DE QUEM é o catálogo, nunca "de todos".
//
// ⚠️ A rota tem `@Throttle(30/min)` PRÓPRIO, além do teto global. Por isso a
// busca é debounced no hook.
//
// 🔴 Resposta É envelopada. `SongCatalogPresenter` não tem `meta` (não é um
// `CollectionPresenter` — a paginação não faz sentido num catálogo com
// `limit`), e o `WrapperDataInterceptor` embrulha tudo que não tem `meta` em
// `{ data }`. Ler `data.items` direto devolveria `undefined` em silêncio: a
// lista viria vazia e a tela pareceria só "sem resultados".
export async function searchSongCatalog(
  musicianId: string,
  params: { term?: string; limit?: number } = {},
): Promise<SongCatalogResponse> {
  const { data } = await httpClient.get<ApiEnvelope<SongCatalogResponse>>(
    `/musicians/${musicianId}/song-catalog`,
    {
      params: {
        limit: params.limit ?? 20,
        ...(params.term ? { term: params.term } : {}),
      },
    },
  );
  return data.data;
}
