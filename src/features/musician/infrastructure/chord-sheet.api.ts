import { httpClient } from '@/shared/services/http/client';
import type { ChordSheet } from '@/shared/utils/chord-sheet';

// GET /musicians/:musician_id/repertoires/:repertoire_id/songs/:music_library_id/chord-sheet
// — usado pelo Play Mode (sempre tem repertoireId em mão). Autoriza dono OU
// convidado nominal do repertório (ver core/repertoire's
// CheckRepertoireSongAccessUseCase no backend) — diferente do endpoint
// acima, que só serve o próprio dono. `ownerMusicianId` é o dono do
// repertório (repertoire.musician_id), não necessariamente quem está logado.
//
// SEM envelope, igual `music-library.api.ts`: o backend responde um
// ChordSheetPresenter cru, e esse artefato tem um campo `meta` DE DOMÍNIO
// (bpm, key, pipelineVersion). O WrapperDataInterceptor global decide embrulhar
// com `!body || "meta" in body ? body : { data: body }` — heurístico pensado
// para não re-embrulhar lista paginada, que aqui confunde o `meta` do artefato
// com o de paginação e pula o envelope. Tipar como ApiEnvelope fazia
// `data.data` virar undefined, e o TanStack Query v5 (que proíbe undefined em
// queryFn) derrubava a query com "Query data cannot be undefined" — a cifra
// aparecia como "Sem cifra disponível" em TODAS as músicas.
export async function getChordSheetViaRepertoire(
  ownerMusicianId: string,
  repertoireId: string,
  musicLibraryId: string,
): Promise<ChordSheet> {
  const { data } = await httpClient.get<ChordSheet>(
    `/musicians/${ownerMusicianId}/repertoires/${repertoireId}/songs/${musicLibraryId}/chord-sheet`,
  );
  return data;
}
