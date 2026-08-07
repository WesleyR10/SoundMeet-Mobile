import { useQuery } from '@tanstack/react-query';
import { listPersonalChordSheets } from '../infrastructure/personal-chord-sheet.api';
import type { PersonalChordSheetSortField, SortDirection, ReconcileStatus } from '../domain/personal-chord-sheet.types';

export const personalChordSheetsListKey = (musicianId: string) =>
  ['musician', musicianId, 'personal-chord-sheets'] as const;

export function usePersonalChordSheets(
  musicianId: string | null,
  params?: {
    page?: number; per_page?: number; sort?: PersonalChordSheetSortField; sort_dir?: SortDirection;
    music_library_id?: string; reconcile_status?: ReconcileStatus;
  },
) {
  return useQuery({
    queryKey: musicianId
      ? [...personalChordSheetsListKey(musicianId), params ?? {}]
      : ['musician', 'personal-chord-sheets', 'disabled'],
    queryFn:   () => listPersonalChordSheets(musicianId!, params),
    enabled:   !!musicianId,
    staleTime: 30 * 1_000,
  });
}

// Deriva "já existe fork pra essa música?" reaproveitando o mesmo endpoint de
// lista com o filtro music_library_id — usado pelo botão de fork no
// PlayModeTopBar pra decidir entre "criar" e "abrir o existente". Query
// própria (não compõe usePersonalChordSheets) pra poder ficar `enabled:
// false` de verdade quando musicLibraryId ainda não chegou, em vez de buscar
// a lista inteira sem filtro.
export function usePersonalChordSheetExists(musicianId: string | null, musicLibraryId: string | null) {
  const query = useQuery({
    queryKey: musicianId && musicLibraryId
      ? [...personalChordSheetsListKey(musicianId), { music_library_id: musicLibraryId, per_page: 1 }]
      : ['musician', 'personal-chord-sheets', 'exists-disabled'],
    queryFn:   () => listPersonalChordSheets(musicianId!, { music_library_id: musicLibraryId!, per_page: 1 }),
    enabled:   !!musicianId && !!musicLibraryId,
    staleTime: 30 * 1_000,
  });
  const existingId = query.data?.data[0]?.personal_chord_sheet_id ?? null;
  return { ...query, existingId };
}
