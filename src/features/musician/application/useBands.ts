import { useQuery } from '@tanstack/react-query';
import { getBand, listMyBands } from '../infrastructure/band.api';

export const myBandsKey = (musicianId: string) => ['musician', 'bands', 'mine', musicianId] as const;
export const bandKey = (bandId: string) => ['musician', 'bands', bandId] as const;

export function useMyBands(musicianId: string | null) {
  return useQuery({
    queryKey:  musicianId ? myBandsKey(musicianId) : ['musician', 'bands', 'mine', 'disabled'],
    queryFn:   () => listMyBands(musicianId!),
    enabled:   !!musicianId,
    staleTime: 60 * 1_000,
  });
}

export function useBand(bandId: string | null) {
  return useQuery({
    queryKey:  bandId ? bandKey(bandId) : ['musician', 'bands', 'disabled'],
    queryFn:   () => getBand(bandId!),
    enabled:   !!bandId,
    staleTime: 60 * 1_000,
  });
}
