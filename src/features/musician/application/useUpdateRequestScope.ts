import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateRequestScope } from '../infrastructure/musician.api';
import { musicianProfileKey } from './useMusician';
import { extractApiMessage } from '@/shared/services/http/types';

export function useUpdateRequestScope(musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (acceptsOutsideRepertoire: boolean) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return updateRequestScope(musicianId, acceptsOutsideRepertoire);
    },
    onSuccess: () => {
      if (musicianId) queryClient.invalidateQueries({ queryKey: musicianProfileKey(musicianId) });
    },
  });
}

export function getUpdateRequestScopeErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
