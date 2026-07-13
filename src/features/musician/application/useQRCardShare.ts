import { useEffect, useRef, useState, type RefObject } from 'react';
import { shareQrCardAsync, saveQrCardToGalleryAsync } from '@/shared/services/media/qrShare';
import type { QRShareCardHandle } from '../ui/components/QRShareCard';

const SUCCESS_PULSE_MS = 1800;

// Hook fino de orquestração — sem TanStack Query porque não há estado de
// servidor aqui, só capacidade nativa de device (ver qrShare.ts). Mantém
// somente os estados de loading/erro/sucesso-transiente; a lógica de
// share/save em si vive nas funções puras importadas.
export function useQRCardShare(cardRef: RefObject<QRShareCardHandle | null>) {
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);
  const [justShared, setJustShared] = useState(false);
  const [justSaved, setJustSaved]   = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (shareTimer.current) clearTimeout(shareTimer.current);
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  // isSharing/isSaving também servem de trava mútua: sem isso, um duplo toque
  // quase simultâneo em "Compartilhar" e "Salvar" dispararia duas capturas
  // concorrentes do mesmo QRShareCard, cada uma congelando/descongelando o
  // QRFrame por conta própria — a segunda poderia reativar a animação antes
  // da primeira captura terminar.
  const shareCard = async () => {
    if (!cardRef.current || isSharing || isSaving) return;
    setIsSharing(true);
    setBannerError(null);
    try {
      const uri = await cardRef.current.capture();
      await shareQrCardAsync(uri);
      setJustShared(true);
      shareTimer.current = setTimeout(() => setJustShared(false), SUCCESS_PULSE_MS);
    } catch {
      setBannerError('Não foi possível compartilhar o QR Code.');
    } finally {
      setIsSharing(false);
    }
  };

  const saveCard = async () => {
    if (!cardRef.current || isSharing || isSaving) return;
    setIsSaving(true);
    setBannerError(null);
    try {
      const uri = await cardRef.current.capture();
      const result = await saveQrCardToGalleryAsync(uri);
      if (result === 'saved') {
        setJustSaved(true);
        saveTimer.current = setTimeout(() => setJustSaved(false), SUCCESS_PULSE_MS);
      }
    } catch {
      setBannerError('Não foi possível salvar o QR Code.');
    } finally {
      setIsSaving(false);
    }
  };

  return { shareCard, isSharing, justShared, saveCard, isSaving, justSaved, bannerError };
}
