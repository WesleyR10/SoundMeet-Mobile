import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { inferImageFileName, inferImageMimeType } from '@/shared/utils/image';
import { musicianProfileKey } from './useMusician';
import type { MusicianProfile } from '../domain/musician.types';
import { getUploadAvatarErrorMessage, useUploadAvatar } from './useUploadAvatar';

/**
 * Trocar a foto direto no Perfil, sem passar por "Editar perfil".
 *
 * A foto escolhida aparece NA HORA (prévia local) e o envio corre por trás. Se
 * falhar, a prévia some e a foto anterior volta — mostrar a nova com um erro
 * ao lado diria duas coisas contraditórias (mesma decisão do
 * `useEditProfileForm`).
 *
 * Sem etapa de "Salvar foto": o recorte nativo (`allowsEditing`, 1:1) já é a
 * confirmação — quem enquadrou e tocou em "Escolher" decidiu.
 */
export function useQuickAvatarChange(musicianId: string | null) {
  const queryClient = useQueryClient();
  const upload = useUploadAvatar(musicianId);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const change = async (uri: string): Promise<{ ok: true } | { ok: false; message: string }> => {
    if (!musicianId) return { ok: false, message: 'Sessão sem perfil de músico.' };
    setPreviewUri(uri);
    try {
      const updated = await upload.mutateAsync({
        uri,
        name: inferImageFileName(uri),
        type: inferImageMimeType(uri),
      });
      // Mescla SÓ a foto (a resposta do upload pode não trazer o perfil com
      // todos os aninhados) e recarrega por trás — sem piscar a foto antiga.
      queryClient.setQueryData<MusicianProfile>(musicianProfileKey(musicianId), (cached) =>
        cached ? { ...cached, avatar: updated.avatar } : cached,
      );
      void queryClient.invalidateQueries({ queryKey: musicianProfileKey(musicianId) });
      return { ok: true };
    } catch (err) {
      return { ok: false, message: getUploadAvatarErrorMessage(err) };
    } finally {
      setPreviewUri(null);
    }
  };

  return { change, previewUri, uploading: upload.isPending };
}
