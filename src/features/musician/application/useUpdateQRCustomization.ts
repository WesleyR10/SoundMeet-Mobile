import { useMutation } from '@tanstack/react-query';
import { customizeQrCode } from '../infrastructure/musician.api';
import { extractApiMessage } from '@/shared/services/http/types';
import type { QRCustomizationPatch } from '../domain/musician.types';

export function useUpdateQRCustomization(musicianId: string | null) {
  return useMutation({
    mutationFn: (payload: QRCustomizationPatch) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return customizeQrCode(musicianId, payload);
    },
  });
}

export function getUpdateQRCustomizationErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
