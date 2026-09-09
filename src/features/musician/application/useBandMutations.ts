import { useMutation, useQueryClient } from '@tanstack/react-query';
import { extractApiMessage } from '@/shared/services/http/types';
import { createBand, deleteBand, transferBandLeadership } from '../infrastructure/band.api';
import type { CreateBandPayload } from '../domain/band.types';
import { bandKey, myBandsKey } from './useBands';

/**
 * Criar banda. O músico autenticado vira líder — quem decide isso é o backend
 * (`creator_musician_id` sai do JWT), não este payload.
 */
export function useCreateBand(musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBandPayload) => createBand(payload),
    onSuccess: () => {
      if (musicianId) {
        void queryClient.invalidateQueries({ queryKey: myBandsKey(musicianId) });
      }
    },
  });
}

/**
 * Dissolver banda.
 *
 * `removeQueries` em vez de `invalidateQueries` para a banda apagada: a linha
 * não existe mais no servidor, então revalidar renderia um 404 numa tela que o
 * usuário está deixando. A LISTA continua sendo invalidada — essa ainda existe.
 */
export function useDeleteBand(musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bandId: string) => deleteBand(bandId),
    onSuccess: (_data, bandId) => {
      queryClient.removeQueries({ queryKey: bandKey(bandId) });
      if (musicianId) {
        void queryClient.invalidateQueries({ queryKey: myBandsKey(musicianId) });
      }
    },
  });
}

/**
 * Transferir a liderança.
 *
 * ⚠️ **Quem chama deixa de ser líder na mesma chamada.** As duas queries são
 * invalidadas porque o `role` do próprio usuário muda dentro do agregado — sem
 * isso, a tela continuaria oferecendo ações de líder a quem acabou de deixar de
 * ser um, e o servidor responderia 403 numa ação que a UI prometeu.
 */
export function useTransferBandLeadership(bandId: string, musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newLeaderMusicianId: string) =>
      transferBandLeadership(bandId, newLeaderMusicianId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bandKey(bandId) });
      if (musicianId) {
        void queryClient.invalidateQueries({ queryKey: myBandsKey(musicianId) });
      }
    },
  });
}

export function getBandMutationErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
