import { useMutation } from '@tanstack/react-query';
import { updatePixKey } from '../infrastructure/musician-wallet.api';
import { extractApiMessage } from '@/shared/services/http/types';
import type { UpdatePixKeyPayload } from '../domain/musician.types';

export function useUpdatePixKey(musicianId: string | null) {
  return useMutation({
    mutationFn: (payload: UpdatePixKeyPayload) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return updatePixKey(musicianId, payload);
    },
  });
}

export function getUpdatePixKeyErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
