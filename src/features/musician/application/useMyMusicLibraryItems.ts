import { useQuery } from '@tanstack/react-query';
import { listMyMusicLibraryItems } from '../infrastructure/music-library.api';

export const myMusicLibraryItemsKey = ['music-library', 'items', 'mine'] as const;

// Usado pelo picker de AddPersonalChordSheetScreen (escolher música pra
// forkar) e pela checagem "já tenho essa música?" do fluxo de import da
// comunidade. Sempre a PRÓPRIA biblioteca — o backend deriva musician_id do
// JWT, sem param explícito.
export function useMyMusicLibraryItems(params?: { page?: number; per_page?: number; title?: string; artist?: string }) {
  return useQuery({
    queryKey:  [...myMusicLibraryItemsKey, params ?? {}],
    queryFn:   () => listMyMusicLibraryItems(params),
    staleTime: 30 * 1_000,
  });
}
