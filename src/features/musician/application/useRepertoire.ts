import { useQuery } from '@tanstack/react-query';
import { getRepertoire } from '../infrastructure/repertoire.api';

export const repertoireKey = (musicianId: string, repertoireId: string) =>
  ['musician', musicianId, 'repertoires', repertoireId] as const;

export function useRepertoire(musicianId: string | null, repertoireId: string | null) {
  return useQuery({
    queryKey:  musicianId && repertoireId ? repertoireKey(musicianId, repertoireId) : ['musician', 'repertoires', 'disabled'],
    queryFn:   () => getRepertoire(musicianId!, repertoireId!),
    enabled:   !!musicianId && !!repertoireId,
    staleTime: 15 * 1_000,
  });
}
