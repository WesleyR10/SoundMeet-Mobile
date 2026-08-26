import type { RefObject } from 'react';
import { useCardShare } from '@/shared/hooks/useCardShare';
import type { QRShareCardHandle } from '../ui/components/QRShareCard';

// A mecânica (captura, trava mútua entre share/save, pulso de sucesso, limpeza
// de timers) vive em `useCardShare` desde que o card de recap pós-show passou a
// precisar da mesma coisa. Aqui sobram só os textos do QR Code — este wrapper
// existe para que QRCodeContent.tsx não precise conhecer os labels.
export function useQRCardShare(cardRef: RefObject<QRShareCardHandle | null>) {
  return useCardShare(cardRef, {
    dialogTitle: 'Compartilhar QR Code',
    subject:     'o QR Code',
    shareError:  'Não foi possível compartilhar o QR Code.',
    saveError:   'Não foi possível salvar o QR Code.',
  });
}
