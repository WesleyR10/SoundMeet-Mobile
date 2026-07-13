import { useMutation, useQueryClient } from '@tanstack/react-query';
import { extractApiMessage } from '@/shared/services/http/types';
import {
  createRepertoire,
  renameRepertoire,
  deleteRepertoire,
  addSong,
  removeSong,
  reorderSongs,
  shareRepertoire,
  unshareRepertoire,
  inviteMusician,
  revokeInvite,
} from '../infrastructure/repertoire.api';
import { repertoiresListKey } from './useRepertoires';
import { repertoireKey } from './useRepertoire';
import type { Repertoire } from '../domain/repertoire.types';

// Mesmo padrão de useUpdateQRCustomization.ts: mutation hook + helper
// exportado separado pra extrair a mensagem de erro (402 de plan gate incluso
// — extractApiMessage já cobre isso, backend manda a mensagem do
// PlanLimitExceededError no body).
export function getRepertoireMutationErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}

export function useCreateRepertoire(musicianId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return createRepertoire(musicianId, name);
    },
    onSuccess: () => {
      if (musicianId) queryClient.invalidateQueries({ queryKey: repertoiresListKey(musicianId) });
    },
  });
}

export function useRenameRepertoire(musicianId: string | null, repertoireId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => {
      if (!musicianId || !repertoireId) throw new Error('repertório ausente');
      return renameRepertoire(musicianId, repertoireId, name);
    },
    onSuccess: () => {
      if (!musicianId || !repertoireId) return;
      queryClient.invalidateQueries({ queryKey: repertoiresListKey(musicianId) });
      queryClient.invalidateQueries({ queryKey: repertoireKey(musicianId, repertoireId) });
    },
  });
}

export function useDeleteRepertoire(musicianId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (repertoireId: string) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return deleteRepertoire(musicianId, repertoireId);
    },
    onSuccess: () => {
      if (musicianId) queryClient.invalidateQueries({ queryKey: repertoiresListKey(musicianId) });
    },
  });
}

export function useAddSong(musicianId: string | null, repertoireId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (musicLibraryId: string) => {
      if (!musicianId || !repertoireId) throw new Error('repertório ausente');
      return addSong(musicianId, repertoireId, musicLibraryId);
    },
    onSuccess: () => {
      if (!musicianId || !repertoireId) return;
      queryClient.invalidateQueries({ queryKey: repertoireKey(musicianId, repertoireId) });
      queryClient.invalidateQueries({ queryKey: repertoiresListKey(musicianId) });
    },
  });
}

export function useRemoveSong(musicianId: string | null, repertoireId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (songId: string) => {
      if (!musicianId || !repertoireId) throw new Error('repertório ausente');
      return removeSong(musicianId, repertoireId, songId);
    },
    onSuccess: () => {
      if (!musicianId || !repertoireId) return;
      queryClient.invalidateQueries({ queryKey: repertoireKey(musicianId, repertoireId) });
      queryClient.invalidateQueries({ queryKey: repertoiresListKey(musicianId) });
    },
  });
}

// Reordenação otimista — DraggableFlatList já reordena a UI localmente no
// drag; aqui só espelhamos isso no cache do TanStack Query ANTES da resposta
// do servidor chegar (onMutate), pra não haver "flash" de volta pra ordem
// antiga enquanto o PATCH está em voo. Rollback em onError.
export function useReorderSongs(musicianId: string | null, repertoireId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedSongIds: string[]) => {
      if (!musicianId || !repertoireId) throw new Error('repertório ausente');
      return reorderSongs(musicianId, repertoireId, orderedSongIds);
    },
    onMutate: async (orderedSongIds: string[]) => {
      if (!musicianId || !repertoireId) return undefined;
      const key = repertoireKey(musicianId, repertoireId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Repertoire>(key);

      if (previous) {
        const byId = new Map(previous.songs.map((s) => [s.song_id, s]));
        const reordered = orderedSongIds
          .map((id, idx) => {
            const song = byId.get(id);
            return song ? { ...song, position: idx + 1 } : null;
          })
          .filter((s): s is Repertoire['songs'][number] => s !== null);
        queryClient.setQueryData<Repertoire>(key, { ...previous, songs: reordered });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (!musicianId || !repertoireId) return;
      const ctx = context as { previous?: Repertoire } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(repertoireKey(musicianId, repertoireId), ctx.previous);
      }
    },
    onSettled: () => {
      if (!musicianId || !repertoireId) return;
      queryClient.invalidateQueries({ queryKey: repertoireKey(musicianId, repertoireId) });
    },
  });
}

export function useShareRepertoire(musicianId: string | null, repertoireId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!musicianId || !repertoireId) throw new Error('repertório ausente');
      return shareRepertoire(musicianId, repertoireId);
    },
    onSuccess: () => {
      if (musicianId && repertoireId) queryClient.invalidateQueries({ queryKey: repertoireKey(musicianId, repertoireId) });
    },
  });
}

export function useUnshareRepertoire(musicianId: string | null, repertoireId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!musicianId || !repertoireId) throw new Error('repertório ausente');
      return unshareRepertoire(musicianId, repertoireId);
    },
    onSuccess: () => {
      if (musicianId && repertoireId) queryClient.invalidateQueries({ queryKey: repertoireKey(musicianId, repertoireId) });
    },
  });
}

export function useInviteMusician(musicianId: string | null, repertoireId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteeMusicianId: string) => {
      if (!musicianId || !repertoireId) throw new Error('repertório ausente');
      return inviteMusician(musicianId, repertoireId, inviteeMusicianId);
    },
    onSuccess: () => {
      if (musicianId && repertoireId) queryClient.invalidateQueries({ queryKey: repertoireKey(musicianId, repertoireId) });
    },
  });
}

export function useRevokeInvite(musicianId: string | null, repertoireId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteeId: string) => {
      if (!musicianId || !repertoireId) throw new Error('repertório ausente');
      return revokeInvite(musicianId, repertoireId, inviteeId);
    },
    onSuccess: () => {
      if (musicianId && repertoireId) queryClient.invalidateQueries({ queryKey: repertoireKey(musicianId, repertoireId) });
    },
  });
}
