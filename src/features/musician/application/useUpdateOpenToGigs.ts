import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOpenToGigs } from '../infrastructure/musician.api';
import { musicianProfileKey } from './useMusician';
import { extractApiMessage } from '@/shared/services/http/types';

export function useUpdateOpenToGigs(musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (open_to_gigs: boolean) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return updateOpenToGigs(musicianId, open_to_gigs);
    },
    onSuccess: () => {
      if (musicianId) queryClient.invalidateQueries({ queryKey: musicianProfileKey(musicianId) });
    },
  });
}

export function getUpdateOpenToGigsErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
