import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acceptBandInvite } from '../infrastructure/band.api';
import { bandKey, myBandsKey } from './useBands';
import { extractApiMessage } from '@/shared/services/http/types';

// Sem body — musician_id sempre vem do JWT do usuário autenticado (não dá
// pra aceitar convite de outro). 422 se não houver convite pending pra esse
// usuário nessa banda (getAcceptBandInviteErrorMessage já sabe ler o formato
// de erro de validação de domínio, ver shared/services/http/types.ts).
// bandId é o argumento da mutation (não fixo no hook) porque MyBandsScreen
// lida com uma LISTA de convites pendentes de bandas diferentes ao mesmo tempo.
export function useAcceptBandInvite(musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bandId: string) => acceptBandInvite(bandId),
    onSuccess: (_data, bandId) => {
      queryClient.invalidateQueries({ queryKey: bandKey(bandId) });
      if (musicianId) queryClient.invalidateQueries({ queryKey: myBandsKey(musicianId) });
    },
  });
}

export function getAcceptBandInviteErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
