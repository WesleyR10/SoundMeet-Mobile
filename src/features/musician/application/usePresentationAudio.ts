import { useMutation } from '@tanstack/react-query';
import {
  deletePresentationAudio,
  uploadPresentationAudio,
  type PresentationAudioFile,
} from '../infrastructure/musician.api';
import { extractApiMessage } from '@/shared/services/http/types';

/**
 * Envio e remoção do áudio de apresentação (espelho de `useUploadAvatar`).
 *
 * A tela **não** traduz o erro do servidor: as mensagens de recusa
 * (formato, tamanho, duração) já vêm em português e com o número que o músico
 * precisa para consertar — "o áudio tem 1min12 e o limite é 40 segundos" só
 * existe do lado que mediu o arquivo.
 */
export function useUploadPresentationAudio(musicianId: string | null) {
  return useMutation({
    mutationFn: (file: PresentationAudioFile) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return uploadPresentationAudio(musicianId, file);
    },
  });
}

export function useDeletePresentationAudio(musicianId: string | null) {
  return useMutation({
    mutationFn: () => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return deletePresentationAudio(musicianId);
    },
  });
}

export function getPresentationAudioErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
