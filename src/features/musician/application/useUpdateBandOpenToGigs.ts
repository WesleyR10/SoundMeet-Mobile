import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBandOpenToGigs } from '../infrastructure/band.api';
import { bandKey, myBandsKey } from './useBands';
import { extractApiMessage } from '@/shared/services/http/types';

export function useUpdateBandOpenToGigs(bandId: string, musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (open_to_gigs: boolean) => updateBandOpenToGigs(bandId, open_to_gigs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bandKey(bandId) });
      if (musicianId) queryClient.invalidateQueries({ queryKey: myBandsKey(musicianId) });
    },
  });
}

export function getUpdateBandOpenToGigsErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
