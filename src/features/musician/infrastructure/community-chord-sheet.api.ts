import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  PersonalChordSheet,
  PersonalChordSheetView,
  PersonalChordSheetSortField,
  ImportedChordSheet,
  SortDirection,
} from '../domain/personal-chord-sheet.types';
import type { PersonalChordSheetCollectionResponse } from './personal-chord-sheet.api';

// Recurso de COMUNIDADE: community/personal-chord-sheets — sem
// MusicianOwnershipGuard, acesso resolvido pelo backend via share_scope
// (band/community). Kill-switch PERSONAL_CHORD_SHEET_COMMUNITY_ENABLED
// derruba pra 404 quando desligado — quem chama trata isso como "comunidade
// indisponível", não como erro genérico (ver useCommunityChordSheets).
export async function listCommunityChordSheets(
  params?: { page?: number; per_page?: number; sort?: PersonalChordSheetSortField; sort_dir?: SortDirection; music_library_id?: string },
): Promise<PersonalChordSheetCollectionResponse> {
  const { data } = await httpClient.get<PersonalChordSheetCollectionResponse>(
    '/community/personal-chord-sheets',
    { params },
  );
  return data;
}

// notes do autor sempre null aqui — o backend redige antes de responder,
// não é o client que esconde.
export async function getCommunityChordSheet(id: string): Promise<PersonalChordSheet> {
  const { data } = await httpClient.get<ApiEnvelope<PersonalChordSheet>>(
    `/community/personal-chord-sheets/${id}`,
  );
  return data.data;
}

export async function getCommunityChordSheetView(
  id: string,
  overrides?: { transpose_semitones?: number; capo_fret?: number },
): Promise<PersonalChordSheetView> {
  const { data } = await httpClient.get<ApiEnvelope<PersonalChordSheetView>>(
    `/community/personal-chord-sheets/${id}/chord-sheet`,
    { params: overrides },
  );
  return data.data;
}

// target_music_library_id é a cópia do IMPORTADOR na própria biblioteca —
// precisa já existir (ver ImportCommunityChordSheetScreen, que resolve/cria
// isso antes de chamar este endpoint).
export async function importCommunityChordSheet(
  id: string,
  targetMusicLibraryId: string,
): Promise<ImportedChordSheet> {
  const { data } = await httpClient.post<ApiEnvelope<ImportedChordSheet>>(
    `/community/personal-chord-sheets/${id}/import`,
    { target_music_library_id: targetMusicLibraryId },
  );
  return data.data;
}
