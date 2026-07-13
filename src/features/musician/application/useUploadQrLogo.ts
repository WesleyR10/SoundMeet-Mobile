import { useMutation } from '@tanstack/react-query';
import { uploadQrLogo, type QrLogoFile } from '../infrastructure/musician.api';
import { extractApiMessage } from '@/shared/services/http/types';

export function useUploadQrLogo(musicianId: string | null) {
  return useMutation({
    mutationFn: (file: QrLogoFile) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return uploadQrLogo(musicianId, file);
    },
  });
}

export function getUploadQrLogoErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
