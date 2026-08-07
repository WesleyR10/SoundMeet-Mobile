import { useMutation, useQueryClient } from '@tanstack/react-query';
import { extractApiMessage } from '@/shared/services/http/types';
import {
  forkChordSheet,
  applyChordEdits,
  removeChordEdit,
  updateViewSettings,
  updateNotes,
  shareChordSheet,
  unshareChordSheet,
  deletePersonalChordSheet,
  type ChordEditInput,
  type ViewSettingsPatch,
} from '../infrastructure/personal-chord-sheet.api';
import { personalChordSheetsListKey } from './usePersonalChordSheets';
import { personalChordSheetKey } from './usePersonalChordSheet';
import { personalChordSheetViewKey } from './usePersonalChordSheetView';
import type { ShareScope } from '../domain/personal-chord-sheet.types';

// Mesmo padrão de getRepertoireMutationErrorMessage: extractApiMessage já
// cobre 402 (PlanLimitExceededError) e 409 (fork duplicado) — a tela só
// precisa exibir a string no ErrorBanner.
export function getPersonalChordSheetMutationErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}

// Invalida tanto o detalhe quanto TODAS as views em cache desse fork — a
// view carrega overrides no query key (transpose/capo/complexity), então
// invalidateQueries com só o prefixo (sem overrides) já pega todas.
function invalidatePersonalChordSheet(queryClient: ReturnType<typeof useQueryClient>, musicianId: string, id: string) {
  queryClient.invalidateQueries({ queryKey: personalChordSheetKey(musicianId, id) });
  queryClient.invalidateQueries({ queryKey: ['musician', musicianId, 'personal-chord-sheets', id, 'chord-sheet'] });
}

export function useForkChordSheet(musicianId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (musicLibraryId: string) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return forkChordSheet(musicianId, musicLibraryId);
    },
    onSuccess: () => {
      if (musicianId) queryClient.invalidateQueries({ queryKey: personalChordSheetsListKey(musicianId) });
    },
  });
}

export function useApplyChordEdits(musicianId: string | null, id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ edits, mode }: { edits: ChordEditInput[]; mode?: 'append' | 'replace' }) => {
      if (!musicianId || !id) throw new Error('cifra pessoal ausente');
      return applyChordEdits(musicianId, id, edits, mode);
    },
    onSuccess: () => {
      if (musicianId && id) {
        invalidatePersonalChordSheet(queryClient, musicianId, id);
        queryClient.invalidateQueries({ queryKey: personalChordSheetsListKey(musicianId) });
      }
    },
  });
}

export function useRemoveChordEdit(musicianId: string | null, id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (editId: string) => {
      if (!musicianId || !id) throw new Error('cifra pessoal ausente');
      return removeChordEdit(musicianId, id, editId);
    },
    onSuccess: () => {
      if (musicianId && id) {
        invalidatePersonalChordSheet(queryClient, musicianId, id);
        queryClient.invalidateQueries({ queryKey: personalChordSheetsListKey(musicianId) });
      }
    },
  });
}

export function useUpdateViewSettings(musicianId: string | null, id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: ViewSettingsPatch) => {
      if (!musicianId || !id) throw new Error('cifra pessoal ausente');
      return updateViewSettings(musicianId, id, patch);
    },
    onSuccess: () => {
      if (musicianId && id) invalidatePersonalChordSheet(queryClient, musicianId, id);
    },
  });
}

export function useUpdateNotes(musicianId: string | null, id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes: string | null) => {
      if (!musicianId || !id) throw new Error('cifra pessoal ausente');
      return updateNotes(musicianId, id, notes);
    },
    onSuccess: () => {
      if (musicianId && id) queryClient.invalidateQueries({ queryKey: personalChordSheetKey(musicianId, id) });
    },
  });
}

export function useShareChordSheet(musicianId: string | null, id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scope: Exclude<ShareScope, 'private'>) => {
      if (!musicianId || !id) throw new Error('cifra pessoal ausente');
      return shareChordSheet(musicianId, id, scope);
    },
    onSuccess: () => {
      if (musicianId && id) {
        queryClient.invalidateQueries({ queryKey: personalChordSheetKey(musicianId, id) });
        queryClient.invalidateQueries({ queryKey: personalChordSheetsListKey(musicianId) });
      }
    },
  });
}

export function useUnshareChordSheet(musicianId: string | null, id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!musicianId || !id) throw new Error('cifra pessoal ausente');
      return unshareChordSheet(musicianId, id);
    },
    onSuccess: () => {
      if (musicianId && id) {
        queryClient.invalidateQueries({ queryKey: personalChordSheetKey(musicianId, id) });
        queryClient.invalidateQueries({ queryKey: personalChordSheetsListKey(musicianId) });
      }
    },
  });
}

export function useDeletePersonalChordSheet(musicianId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return deletePersonalChordSheet(musicianId, id);
    },
    onSuccess: () => {
      if (musicianId) queryClient.invalidateQueries({ queryKey: personalChordSheetsListKey(musicianId) });
    },
  });
}
