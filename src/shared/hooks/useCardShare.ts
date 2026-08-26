import { useEffect, useRef, useState, type RefObject } from 'react';
import { shareImageAsync, saveImageToGalleryAsync } from '@/shared/services/media/imageShare';

const SUCCESS_PULSE_MS = 1800;

/**
 * Contrato mínimo de um card capturável. Estruturalmente compatível com
 * `QRShareCardHandle` e `ShowRecapCardHandle` — TS é estrutural, então nenhum
 * dos dois precisa importar este tipo para caber aqui.
 */
export type CaptureCardHandle = {
  capture: () => Promise<string>;
};

export type CardShareLabels = {
  /** Título do share sheet (Android). */
  dialogTitle: string;
  /** Sujeito do alerta de permissão de galeria: "Precisamos salvar {subject}". */
  subject: string;
  shareError: string;
  saveError: string;
};

// Hook fino de orquestração — sem TanStack Query porque não há estado de
// servidor aqui, só capacidade nativa de device (ver imageShare.ts). Mantém
// somente os estados de loading/erro/sucesso-transiente; a lógica de
// share/save em si vive nas funções puras importadas.
//
// Genérico desde o card de recap pós-show (B1): a mecânica de captura,
// trava mútua e pulso de sucesso é idêntica em qualquer card compartilhável —
// só os textos mudam.
export function useCardShare(
  cardRef: RefObject<CaptureCardHandle | null>,
  labels: CardShareLabels,
) {
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
  // concorrentes do mesmo card, cada uma congelando/descongelando animações
  // por conta própria — a segunda poderia reativar a animação antes da
  // primeira captura terminar.
  const shareCard = async () => {
    if (!cardRef.current || isSharing || isSaving) return;
    setIsSharing(true);
    setBannerError(null);
    try {
      const uri = await cardRef.current.capture();
      await shareImageAsync(uri, { dialogTitle: labels.dialogTitle });
      setJustShared(true);
      shareTimer.current = setTimeout(() => setJustShared(false), SUCCESS_PULSE_MS);
    } catch {
      setBannerError(labels.shareError);
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
      const result = await saveImageToGalleryAsync(uri, { subject: labels.subject });
      if (result === 'saved') {
        setJustSaved(true);
        saveTimer.current = setTimeout(() => setJustSaved(false), SUCCESS_PULSE_MS);
      }
    } catch {
      setBannerError(labels.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  return { shareCard, isSharing, justShared, saveCard, isSaving, justSaved, bannerError };
}
