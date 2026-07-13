import { useMutation } from '@tanstack/react-query';
import { updateMusician } from '../infrastructure/musician.api';
import { extractApiMessage } from '@/shared/services/http/types';
import type { WizardMusicianPayload } from '../domain/musician.types';

export function useUpdateMusician(musicianId: string | null) {
  return useMutation({
    mutationFn: (payload: WizardMusicianPayload) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return updateMusician(musicianId, payload);
    },
  });
}

export function getUpdateMusicianErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
