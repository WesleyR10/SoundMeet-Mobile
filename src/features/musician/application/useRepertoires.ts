import { useQuery } from '@tanstack/react-query';
import { listRepertoires } from '../infrastructure/repertoire.api';
import type { RepertoireSortField, SortDirection } from '../domain/repertoire.types';

export const repertoiresListKey = (musicianId: string) => ['musician', musicianId, 'repertoires'] as const;

export function useRepertoires(
  musicianId: string | null,
  params?: { page?: number; per_page?: number; sort?: RepertoireSortField; sort_dir?: SortDirection; name?: string },
) {
  return useQuery({
    queryKey:  musicianId ? [...repertoiresListKey(musicianId), params ?? {}] : ['musician', 'repertoires', 'disabled'],
    queryFn:   () => listRepertoires(musicianId!, params),
    enabled:   !!musicianId,
    staleTime: 30 * 1_000,
  });
}
