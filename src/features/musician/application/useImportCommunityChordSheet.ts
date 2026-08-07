import { useMutation, useQueryClient } from '@tanstack/react-query';
import { extractApiMessage } from '@/shared/services/http/types';
import { importCommunityChordSheet } from '../infrastructure/community-chord-sheet.api';
import { personalChordSheetsListKey } from './usePersonalChordSheets';

export function getImportChordSheetErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}

export function useImportCommunityChordSheet(musicianId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceId, targetMusicLibraryId }: { sourceId: string; targetMusicLibraryId: string }) =>
      importCommunityChordSheet(sourceId, targetMusicLibraryId),
    onSuccess: () => {
      if (musicianId) queryClient.invalidateQueries({ queryKey: personalChordSheetsListKey(musicianId) });
    },
  });
}
