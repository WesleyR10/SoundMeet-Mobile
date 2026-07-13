import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { ChordSheet } from '@/shared/utils/chord-sheet';
import type { SharedRepertoire } from '../domain/shared-repertoire.types';

// GET /repertoires/shared/:token — público (sem auth exigida pela API; o
// app decide exigir login antes de mostrar esta tela, ver RootNavigator).
export async function getSharedRepertoire(token: string): Promise<SharedRepertoire> {
  const { data } = await httpClient.get<ApiEnvelope<SharedRepertoire>>(`/repertoires/shared/${token}`);
  return data.data;
}

// GET /repertoires/shared/:token/songs/:music_library_id/chord-sheet —
// idem, token é a prova de acesso (não musician_id).
export async function getSharedChordSheet(token: string, musicLibraryId: string): Promise<ChordSheet> {
  const { data } = await httpClient.get<ApiEnvelope<ChordSheet>>(
    `/repertoires/shared/${token}/songs/${musicLibraryId}/chord-sheet`,
  );
  return data.data;
}
