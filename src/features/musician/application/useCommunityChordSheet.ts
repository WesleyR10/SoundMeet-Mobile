import { useQuery } from '@tanstack/react-query';
import { getCommunityChordSheet } from '../infrastructure/community-chord-sheet.api';

export const communityChordSheetKey = (id: string) => ['community', 'personal-chord-sheets', id] as const;

export function useCommunityChordSheet(id: string | null) {
  return useQuery({
    queryKey:  id ? communityChordSheetKey(id) : ['community', 'personal-chord-sheets', 'disabled'],
    queryFn:   () => getCommunityChordSheet(id!),
    enabled:   !!id,
    staleTime: 60 * 1_000,
  });
}
