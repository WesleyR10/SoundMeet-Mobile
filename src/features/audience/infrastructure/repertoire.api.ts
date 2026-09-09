import { httpClient } from '@/shared/services/http/client';
import type { PublicRepertoirePage } from '../domain/repertoire.types';

// GET /musicians/:musician_id/repertoire — catálogo do músico para quem vai
// PEDIR (backend Bloco 9.6c, que fecha o 7.14).
//
// Resposta já traz `meta` (CollectionPresenter), então o WrapperDataInterceptor
// pula o envelope: NÃO é `ApiEnvelope<T>`. Mesmo caso de
// `features/musician/infrastructure/music-library.api.ts`.
//
// ⚠️ `musician_id` vive só no PATH por desenho do backend — não existe "listar
// a biblioteca inteira" para terceiro, e mandá-lo na query seria descartado de
// qualquer forma (o controller sobrescreve com o do path). Por isso o parâmetro
// não é oferecido aqui.
//
// ⚠️ A rota tem `@Throttle(30/min)` PRÓPRIO, além do teto global — é catálogo
// raspável. Por isso a busca é debounced e exige 2 caracteres no hook.
export async function searchMusicianRepertoire(
  musicianId: string,
  params: { title?: string; per_page?: number } = {},
): Promise<PublicRepertoirePage> {
  const { data } = await httpClient.get<PublicRepertoirePage>(
    `/musicians/${musicianId}/repertoire`,
    {
      params: {
        per_page: params.per_page ?? 20,
        sort:     'title',
        sort_dir: 'asc',
        ...(params.title ? { title: params.title } : {}),
      },
    },
  );
  return data;
}
