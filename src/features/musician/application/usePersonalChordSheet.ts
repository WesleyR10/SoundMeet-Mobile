import { useQuery } from '@tanstack/react-query';
import { getPersonalChordSheet } from '../infrastructure/personal-chord-sheet.api';

export const personalChordSheetKey = (musicianId: string, id: string) =>
  ['musician', musicianId, 'personal-chord-sheets', id] as const;

// Detalhe cru (com edits[]) — usado quando a tela precisa da lista de
// edit_id brutos (ex.: ConflictsReviewSheet, que casa outcomes.edit_id
// contra isso pra oferecer "descartar"). O corpo renderizado da cifra vem de
// usePersonalChordSheetView, não daqui.
export function usePersonalChordSheet(musicianId: string | null, id: string | null) {
  return useQuery({
    queryKey:  musicianId && id ? personalChordSheetKey(musicianId, id) : ['musician', 'personal-chord-sheets', 'disabled'],
    queryFn:   () => getPersonalChordSheet(musicianId!, id!),
    enabled:   !!musicianId && !!id,
    staleTime: 30 * 1_000,
  });
}
