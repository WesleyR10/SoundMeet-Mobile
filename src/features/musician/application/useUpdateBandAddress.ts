import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBandAddress } from '../infrastructure/band.api';
import { bandKey, myBandsKey } from './useBands';
import { extractApiMessage } from '@/shared/services/http/types';
import type { MusicianLocation } from '../domain/musician.types';

export function useUpdateBandAddress(bandId: string, musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (address: MusicianLocation | null) => updateBandAddress(bandId, address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bandKey(bandId) });
      if (musicianId) queryClient.invalidateQueries({ queryKey: myBandsKey(musicianId) });
    },
  });
}

export function getUpdateBandAddressErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
