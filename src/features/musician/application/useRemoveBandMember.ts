import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeBandMember } from '../infrastructure/band.api';
import { bandKey, myBandsKey } from './useBands';
import { extractApiMessage } from '@/shared/services/http/types';

// Mesma chamada serve pra "expulsar membro aceito" e "cancelar convite
// pendente" — não existe endpoint separado de cancelar (ver band.api.ts).
export function useRemoveBandMember(bandId: string, musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetMusicianId: string) => removeBandMember(bandId, targetMusicianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bandKey(bandId) });
      if (musicianId) queryClient.invalidateQueries({ queryKey: myBandsKey(musicianId) });
    },
  });
}

export function getRemoveBandMemberErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
