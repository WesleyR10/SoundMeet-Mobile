import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  Repertoire,
  RepertoireSortField,
  SortDirection,
} from '../domain/repertoire.types';

// Resposta de GET /musicians/:musician_id/repertoires já vem com `meta`
// (CollectionPresenter do backend) — mesmo gotcha documentado em
// music-library.api.ts: o WrapperDataInterceptor global pula o wrap de
// envelope quando o body já tem `meta`, então NÃO é ApiEnvelope<T[]>.
export interface RepertoireCollectionResponse {
  data: Repertoire[];
  meta: { current_page: number; per_page: number; last_page: number; total: number };
}

export async function listRepertoires(
  musicianId: string,
  params?: { page?: number; per_page?: number; sort?: RepertoireSortField; sort_dir?: SortDirection; name?: string },
): Promise<RepertoireCollectionResponse> {
  const { data } = await httpClient.get<RepertoireCollectionResponse>(
    `/musicians/${musicianId}/repertoires`,
    { params },
  );
  return data;
}

export async function getRepertoire(musicianId: string, repertoireId: string): Promise<Repertoire> {
  const { data } = await httpClient.get<ApiEnvelope<Repertoire>>(
    `/musicians/${musicianId}/repertoires/${repertoireId}`,
  );
  return data.data;
}

export async function createRepertoire(musicianId: string, name: string): Promise<Repertoire> {
  const { data } = await httpClient.post<ApiEnvelope<Repertoire>>(
    `/musicians/${musicianId}/repertoires`,
    { musician_id: musicianId, name },
  );
  return data.data;
}

export async function renameRepertoire(musicianId: string, repertoireId: string, name: string): Promise<Repertoire> {
  const { data } = await httpClient.patch<ApiEnvelope<Repertoire>>(
    `/musicians/${musicianId}/repertoires/${repertoireId}`,
    { name },
  );
  return data.data;
}

export async function deleteRepertoire(musicianId: string, repertoireId: string): Promise<void> {
  await httpClient.delete(`/musicians/${musicianId}/repertoires/${repertoireId}`);
}

export async function addSong(
  musicianId: string,
  repertoireId: string,
  musicLibraryId: string,
  options?: { customNotes?: string; durationOverrideSeconds?: number },
): Promise<Repertoire> {
  const { data } = await httpClient.post<ApiEnvelope<Repertoire>>(
    `/musicians/${musicianId}/repertoires/${repertoireId}/songs`,
    {
      music_library_id: musicLibraryId,
      custom_notes: options?.customNotes,
      duration_override_seconds: options?.durationOverrideSeconds,
    },
  );
  return data.data;
}

export async function removeSong(musicianId: string, repertoireId: string, songId: string): Promise<void> {
  await httpClient.delete(`/musicians/${musicianId}/repertoires/${repertoireId}/songs/${songId}`);
}

// Backend exige o array COMPLETO de song_ids na nova ordem (não reorder
// parcial/relativo) — o servidor recalcula position 1..N a partir disso.
export async function reorderSongs(
  musicianId: string,
  repertoireId: string,
  orderedSongIds: string[],
): Promise<Repertoire> {
  const { data } = await httpClient.patch<ApiEnvelope<Repertoire>>(
    `/musicians/${musicianId}/repertoires/${repertoireId}/songs`,
    { ordered_song_ids: orderedSongIds },
  );
  return data.data;
}

export async function shareRepertoire(musicianId: string, repertoireId: string): Promise<Repertoire> {
  const { data } = await httpClient.post<ApiEnvelope<Repertoire>>(
    `/musicians/${musicianId}/repertoires/${repertoireId}/share`,
  );
  return data.data;
}

export async function unshareRepertoire(musicianId: string, repertoireId: string): Promise<void> {
  await httpClient.delete(`/musicians/${musicianId}/repertoires/${repertoireId}/share`);
}

export async function inviteMusician(
  musicianId: string,
  repertoireId: string,
  inviteeMusicianId: string,
): Promise<Repertoire> {
  const { data } = await httpClient.post<ApiEnvelope<Repertoire>>(
    `/musicians/${musicianId}/repertoires/${repertoireId}/invites`,
    { invitee_musician_id: inviteeMusicianId },
  );
  return data.data;
}

export async function revokeInvite(musicianId: string, repertoireId: string, inviteeId: string): Promise<void> {
  await httpClient.delete(`/musicians/${musicianId}/repertoires/${repertoireId}/invites/${inviteeId}`);
}

// GET /musicians/:musician_id/repertoire-invites — repertórios de OUTROS
// músicos onde o músico autenticado foi convidado nominalmente (PRO).
export async function listMyInvites(musicianId: string): Promise<Repertoire[]> {
  const { data } = await httpClient.get<ApiEnvelope<Repertoire[]>>(
    `/musicians/${musicianId}/repertoire-invites`,
  );
  return data.data;
}

// GET /repertoires/shared/:token — público, sem auth (usado por quem RECEBE
// o link de compartilhamento, não o dono).
export async function getSharedRepertoire(token: string): Promise<Repertoire> {
  const { data } = await httpClient.get<ApiEnvelope<Repertoire>>(`/repertoires/shared/${token}`);
  return data.data;
}
