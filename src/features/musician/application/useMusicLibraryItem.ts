import { useQuery } from '@tanstack/react-query';
import { getMusicLibraryItem } from '../infrastructure/music-library.api';

export const musicLibraryItemKey = (id: string) => ['music-library', 'items', id] as const;

// staleTime: Infinity — título/artista de um item de biblioteca são
// efetivamente imutáveis (ver plano §2). Cada card de cifra pessoal dispara
// a própria query por music_library_id; o TanStack Query dedupe automático
// quando o mesmo id aparece em mais de um card.
export function useMusicLibraryItem(id: string | null) {
  return useQuery({
    queryKey:  id ? musicLibraryItemKey(id) : ['music-library', 'items', 'disabled'],
    queryFn:   () => getMusicLibraryItem(id!),
    enabled:   !!id,
    staleTime: Infinity,
  });
}
