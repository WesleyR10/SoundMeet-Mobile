import { useQuery } from '@tanstack/react-query';
import { getRepertoireCount } from '../infrastructure/music-library.api';

export const repertoireCountKey = (musicianId: string) => ['musician', musicianId, 'repertoire-count'] as const;

// Contagem real de músicas na biblioteca — tile "Repertório" da Home
// (Bloco 10.3). musicianId só entra na query key (cache por sessão); a
// chamada em si não precisa do id (ver music-library.api.ts).
export function useRepertoireCount(musicianId: string | null) {
  return useQuery({
    queryKey:  musicianId ? repertoireCountKey(musicianId) : ['musician', 'repertoire-count', 'disabled'],
    queryFn:   getRepertoireCount,
    enabled:   !!musicianId,
    staleTime: 60 * 1_000,
  });
}
