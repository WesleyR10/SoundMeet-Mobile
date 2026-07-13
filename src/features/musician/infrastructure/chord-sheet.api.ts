import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { ChordSheet } from '@/shared/utils/chord-sheet';

// GET /musicians/:musician_id/repertoires/:repertoire_id/songs/:music_library_id/chord-sheet
// — usado pelo Play Mode (sempre tem repertoireId em mão). Autoriza dono OU
// convidado nominal do repertório (ver core/repertoire's
// CheckRepertoireSongAccessUseCase no backend) — diferente do endpoint
// acima, que só serve o próprio dono. `ownerMusicianId` é o dono do
// repertório (repertoire.musician_id), não necessariamente quem está logado.
export async function getChordSheetViaRepertoire(
  ownerMusicianId: string,
  repertoireId: string,
  musicLibraryId: string,
): Promise<ChordSheet> {
  const { data } = await httpClient.get<ApiEnvelope<ChordSheet>>(
    `/musicians/${ownerMusicianId}/repertoires/${repertoireId}/songs/${musicLibraryId}/chord-sheet`,
  );
  return data.data;
}
