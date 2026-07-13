import { useMutation } from '@tanstack/react-query';
import { updateMusicianProfile } from '../infrastructure/musician.api';
import { extractApiMessage } from '@/shared/services/http/types';
import type { UpdateMusicianProfilePayload } from '../domain/musician.types';

export function useUpdateMusicianProfile(musicianId: string | null) {
  return useMutation({
    mutationFn: (payload: UpdateMusicianProfilePayload) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return updateMusicianProfile(musicianId, payload);
    },
  });
}

export function getUpdateMusicianProfileErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
