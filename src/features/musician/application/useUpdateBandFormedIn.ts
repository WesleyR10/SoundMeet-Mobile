import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBandFormedIn } from '../infrastructure/band.api';
import { bandKey, myBandsKey } from './useBands';
import { extractApiMessage } from '@/shared/services/http/types';

/**
 * Declara (ou apaga) o ano de formação da banda — só o líder.
 *
 * Mesmo desenho de `useUpdateBandAddress`: PATCH parcial em `/bands/:id` e
 * invalidação das duas chaves, porque a banda aparece no detalhe e na lista
 * "minhas bandas" e o tempo de estrada é mostrado nos dois.
 */
export function useUpdateBandFormedIn(bandId: string, musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    // `null` é valor legítimo (apagar), não ausência — por isso o tipo é
    // `number | null` e não `number | undefined`.
    mutationFn: (formedIn: number | null) => updateBandFormedIn(bandId, formedIn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bandKey(bandId) });
      if (musicianId) queryClient.invalidateQueries({ queryKey: myBandsKey(musicianId) });
    },
  });
}

export function getUpdateBandFormedInErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
