import { useMutation, useQueryClient } from '@tanstack/react-query';
import { declineBandInvite } from '../infrastructure/band.api';
import { bandKey, myBandsKey } from './useBands';
import { extractApiMessage } from '@/shared/services/http/types';

// bandId é o argumento da mutation (não fixo no hook) — mesmo racional de
// useAcceptBandInvite.ts (lista de convites de bandas diferentes).
export function useDeclineBandInvite(musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bandId: string) => declineBandInvite(bandId),
    onSuccess: (_data, bandId) => {
      queryClient.invalidateQueries({ queryKey: bandKey(bandId) });
      if (musicianId) queryClient.invalidateQueries({ queryKey: myBandsKey(musicianId) });
    },
  });
}

export function getDeclineBandInviteErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
