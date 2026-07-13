import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateQRCustomization, getUpdateQRCustomizationErrorMessage } from '../../application/useUpdateQRCustomization';
import { useUploadQrLogo, getUploadQrLogoErrorMessage } from '../../application/useUploadQrLogo';
import { musicianProfileKey } from '../../application/useMusician';
import { inferImageFileName, inferImageMimeType } from '@/shared/utils/image';
import { hasSufficientQrContrast } from '@/shared/utils/colorContrast';
import type { MusicianProfile } from '../../domain/musician.types';

// Campo de texto vazio é ambíguo: "nunca teve valor" e "usuário apagou o que
// tinha" parecem iguais no input. Resolvemos comparando com o valor inicial —
// só vira `null` (reset explícito no backend, ver QRCustomizationPatch) quando
// havia algo e o campo foi esvaziado; campo que já nasceu vazio e continua
// vazio não vira `null` (não há nada a resetar, evita PATCH sem efeito).
function toPatchValue(current: string, initial: string | undefined): string | null | undefined {
  if (current !== '') return current;
  return initial ? null : undefined;
}

// Estado local (não RHF) — mesma filosofia de useEditWalletSection.ts/
// useEditLocationSection.ts: seção do accordion que salva sozinha. Diferente
// da carteira (que precisa de um GET próprio pra prefilar), aqui o prefill já
// vem pronto em `musician.qr_customization`/`musician.plan_tier` (GetMusicianUseCase).
export function useEditQRCodeSection(musicianId: string, musician: MusicianProfile) {
  const queryClient = useQueryClient();

  const initial = musician.qr_customization;
  const [foregroundColor, setForegroundColor] = useState(initial?.foreground_color ?? '');
  const [backgroundColor, setBackgroundColor] = useState(initial?.background_color ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [logoUri, setLogoUri] = useState<string | null>(initial?.logo_url ?? null);
  const [error, setError] = useState<string | null>(null);

  // plan_tier só vem populado pelo GET (useMusician) — nunca undefined nesta
  // tela na prática, mas trata ausência como "não travar" pra não esconder a
  // seção por engano caso o campo demore a chegar.
  const isLocked = musician.plan_tier !== undefined && musician.plan_tier !== 'pro';

  const updateCustomization = useUpdateQRCustomization(musicianId);
  const uploadLogo = useUploadQrLogo(musicianId);

  const isDirty =
    foregroundColor !== (initial?.foreground_color ?? '') ||
    backgroundColor !== (initial?.background_color ?? '') ||
    label !== (initial?.label ?? '');

  // Aviso não-bloqueante — quem de fato barra a combinação é o backend
  // (QRCode.validate(), 422). Aqui é só feedback instantâneo no preview, sem
  // esperar o round-trip de "Salvar" pra descobrir que o QR ficaria ilegível.
  const hasLowContrast =
    !!foregroundColor && !!backgroundColor && !hasSufficientQrContrast(foregroundColor, backgroundColor);

  // Logo sobe imediatamente ao escolher — mesma UX do avatar
  // (handleChangeAvatar em useEditProfileForm.ts) — não fica pendente de "Salvar".
  const onChangeLogo = async (uri: string) => {
    setLogoUri(uri);
    setError(null);
    try {
      await uploadLogo.mutateAsync({ uri, name: inferImageFileName(uri), type: inferImageMimeType(uri) });
    } catch (err) {
      setError(getUploadQrLogoErrorMessage(err));
    } finally {
      queryClient.invalidateQueries({ queryKey: musicianProfileKey(musicianId) });
    }
  };

  // Remoção não passa pelo upload — customize aceita `logo_url: null` para
  // reverter ao QR sem logo, preservando cores/label já definidos (merge).
  const onRemoveLogo = async () => {
    setError(null);
    try {
      await updateCustomization.mutateAsync({ logo_url: null });
      setLogoUri(null);
    } catch (err) {
      setError(getUpdateQRCustomizationErrorMessage(err));
    } finally {
      queryClient.invalidateQueries({ queryKey: musicianProfileKey(musicianId) });
    }
  };

  const onSave = async (): Promise<boolean> => {
    setError(null);
    try {
      await updateCustomization.mutateAsync({
        foreground_color: toPatchValue(foregroundColor, initial?.foreground_color),
        background_color: toPatchValue(backgroundColor, initial?.background_color),
        label: toPatchValue(label, initial?.label),
      });
      return true;
    } catch (err) {
      setError(getUpdateQRCustomizationErrorMessage(err));
      return false;
    } finally {
      queryClient.invalidateQueries({ queryKey: musicianProfileKey(musicianId) });
    }
  };

  return {
    foregroundColor, setForegroundColor,
    backgroundColor, setBackgroundColor,
    label, setLabel,
    logoUri,
    onChangeLogo,
    onRemoveLogo,
    isUploadingLogo: uploadLogo.isPending,
    isLocked,
    isDirty,
    hasLowContrast,
    isSaving: updateCustomization.isPending,
    error,
    onSave,
  };
}
