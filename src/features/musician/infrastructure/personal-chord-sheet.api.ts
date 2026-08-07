import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  PersonalChordSheet,
  PersonalChordSheetSummary,
  PersonalChordSheetView,
  PersonalChordSheetSortField,
  ChordEditType,
  ChordComplexity,
  PersonalChordSheetInstrument,
  PreferredAccidental,
  ShareScope,
  SortDirection,
} from '../domain/personal-chord-sheet.types';

// Recurso do DONO: musicians/:musician_id/personal-chord-sheets — espelha
// PersonalChordSheetController do backend (Bloco 8E). Resposta de lista já
// vem com `meta` (CollectionPresenter) — mesmo gotcha documentado em
// repertoire.api.ts, NÃO é ApiEnvelope<T[]>.
export interface PersonalChordSheetCollectionResponse {
  data: PersonalChordSheetSummary[];
  meta: { current_page: number; per_page: number; last_page: number; total: number };
}

export interface ChordEditInput {
  type:    ChordEditType;
  at_ms:   number;
  to_ms?:  number;
  from?:   string;
  to?:     string;
  symbol?: string;
  label?:  string;
  text?:   string;
}

export interface ViewSettingsPatch {
  transpose_semitones?: number;
  capo_fret?:            number;
  chord_complexity?:     ChordComplexity;
  instrument?:            PersonalChordSheetInstrument;
  left_handed?:           boolean;
  preferred_accidental?: PreferredAccidental;
  scroll_speed?:          number;
}

export async function forkChordSheet(musicianId: string, musicLibraryId: string): Promise<PersonalChordSheet> {
  const { data } = await httpClient.post<ApiEnvelope<PersonalChordSheet>>(
    `/musicians/${musicianId}/personal-chord-sheets`,
    { music_library_id: musicLibraryId },
  );
  return data.data;
}

export async function listPersonalChordSheets(
  musicianId: string,
  params?: {
    page?: number; per_page?: number; sort?: PersonalChordSheetSortField; sort_dir?: SortDirection;
    music_library_id?: string; reconcile_status?: 'clean' | 'base_updated';
  },
): Promise<PersonalChordSheetCollectionResponse> {
  const { data } = await httpClient.get<PersonalChordSheetCollectionResponse>(
    `/musicians/${musicianId}/personal-chord-sheets`,
    { params },
  );
  return data;
}

export async function getPersonalChordSheet(musicianId: string, id: string): Promise<PersonalChordSheet> {
  const { data } = await httpClient.get<ApiEnvelope<PersonalChordSheet>>(
    `/musicians/${musicianId}/personal-chord-sheets/${id}`,
  );
  return data.data;
}

// overrides são query-params efêmeros (NÃO persistem) — usados pro preview
// ao vivo do PersonalChordSheetSettingsSheet antes do músico confirmar
// "Salvar como padrão" (que é o PATCH .../view abaixo).
export async function getPersonalChordSheetView(
  musicianId: string,
  id: string,
  overrides?: { transpose_semitones?: number; capo_fret?: number; chord_complexity?: ChordComplexity },
): Promise<PersonalChordSheetView> {
  const { data } = await httpClient.get<ApiEnvelope<PersonalChordSheetView>>(
    `/musicians/${musicianId}/personal-chord-sheets/${id}/chord-sheet`,
    { params: overrides },
  );
  return data.data;
}

export async function applyChordEdits(
  musicianId: string,
  id: string,
  edits: ChordEditInput[],
  mode: 'append' | 'replace' = 'append',
): Promise<PersonalChordSheet> {
  const { data } = await httpClient.post<ApiEnvelope<PersonalChordSheet>>(
    `/musicians/${musicianId}/personal-chord-sheets/${id}/edits`,
    { edits, mode },
  );
  return data.data;
}

export async function removeChordEdit(musicianId: string, id: string, editId: string): Promise<PersonalChordSheet> {
  const { data } = await httpClient.delete<ApiEnvelope<PersonalChordSheet>>(
    `/musicians/${musicianId}/personal-chord-sheets/${id}/edits/${editId}`,
  );
  return data.data;
}

export async function updateViewSettings(
  musicianId: string,
  id: string,
  patch: ViewSettingsPatch,
): Promise<PersonalChordSheet> {
  const { data } = await httpClient.patch<ApiEnvelope<PersonalChordSheet>>(
    `/musicians/${musicianId}/personal-chord-sheets/${id}/view`,
    patch,
  );
  return data.data;
}

export async function updateNotes(musicianId: string, id: string, notes: string | null): Promise<PersonalChordSheet> {
  const { data } = await httpClient.patch<ApiEnvelope<PersonalChordSheet>>(
    `/musicians/${musicianId}/personal-chord-sheets/${id}/notes`,
    { notes },
  );
  return data.data;
}

export async function shareChordSheet(
  musicianId: string,
  id: string,
  scope: Exclude<ShareScope, 'private'>,
): Promise<PersonalChordSheet> {
  const { data } = await httpClient.post<ApiEnvelope<PersonalChordSheet>>(
    `/musicians/${musicianId}/personal-chord-sheets/${id}/share`,
    { scope },
  );
  return data.data;
}

export async function unshareChordSheet(musicianId: string, id: string): Promise<PersonalChordSheet> {
  const { data } = await httpClient.delete<ApiEnvelope<PersonalChordSheet>>(
    `/musicians/${musicianId}/personal-chord-sheets/${id}/share`,
  );
  return data.data;
}

export async function deletePersonalChordSheet(musicianId: string, id: string): Promise<void> {
  await httpClient.delete(`/musicians/${musicianId}/personal-chord-sheets/${id}`);
}
