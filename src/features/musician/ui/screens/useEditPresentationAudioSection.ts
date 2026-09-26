import { useState } from 'react';
import {
  getPresentationAudioErrorMessage,
  useDeletePresentationAudio,
  useUploadPresentationAudio,
} from '../../application/usePresentationAudio';
import type { PresentationAudio } from '../../domain/musician.types';

/**
 * Estado da seção "Áudio de apresentação".
 *
 * Mesmo desenho de `useEditAvailabilitySection`: a ação salva sozinha, sem
 * botão "Salvar" separado — escolher o arquivo JÁ é a confirmação, e um passo
 * extra depois do seletor do sistema seria fricção sem propósito.
 *
 * 🔴 **O estado local nasce do servidor e é substituído pela RESPOSTA do
 * servidor**, nunca pelo que acabamos de mandar. A URL final é montada pelo
 * backend (chave uuid + base pública do storage) e a duração é a que ELE mediu
 * — otimizar para o valor local deixaria a tela mostrando uma URL que não
 * existe e uma duração que pode divergir por arredondamento.
 */
export function useEditPresentationAudioSection(
  musicianId: string,
  initial: PresentationAudio | null,
) {
  const [audio, setAudio] = useState<PresentationAudio | null>(initial);
  const [error, setError] = useState<string | null>(null);

  const upload = useUploadPresentationAudio(musicianId);
  const remove = useDeletePresentationAudio(musicianId);

  const onPick = async (file: { uri: string; name: string; type: string }) => {
    setError(null);
    try {
      const updated = await upload.mutateAsync(file);
      setAudio(updated.presentation_audio);
    } catch (err) {
      // A mensagem do servidor já vem em português e com o número que o músico
      // precisa ("o áudio tem 1min12 e o limite é 40 segundos"). Traduzir aqui
      // trocaria o diagnóstico exato por um genérico.
      setError(getPresentationAudioErrorMessage(err));
    }
  };

  const onRemove = async () => {
    setError(null);
    try {
      const updated = await remove.mutateAsync();
      setAudio(updated.presentation_audio);
    } catch (err) {
      setError(getPresentationAudioErrorMessage(err));
    }
  };

  return {
    audio,
    error,
    setError,
    onPick,
    onRemove,
    isSaving: upload.isPending || remove.isPending,
  };
}
