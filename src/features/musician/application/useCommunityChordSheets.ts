import { useQuery } from '@tanstack/react-query';
import { listCommunityChordSheets } from '../infrastructure/community-chord-sheet.api';
import type { PersonalChordSheetSortField, SortDirection } from '../domain/personal-chord-sheet.types';

export const communityChordSheetsListKey = ['community', 'personal-chord-sheets'] as const;

// 404 (kill-switch PERSONAL_CHORD_SHEET_COMMUNITY_ENABLED=false) chega como
// isError normal do TanStack Query — a tela trata isso como "comunidade
// indisponível" checando o status do erro, não como falha genérica (ver
// CommunityChordSheetListScreen).
export function useCommunityChordSheets(
  params?: { page?: number; per_page?: number; sort?: PersonalChordSheetSortField; sort_dir?: SortDirection; music_library_id?: string },
) {
  return useQuery({
    queryKey:  [...communityChordSheetsListKey, params ?? {}],
    queryFn:   () => listCommunityChordSheets(params),
    staleTime: 60 * 1_000,
  });
}
