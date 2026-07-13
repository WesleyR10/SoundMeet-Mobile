import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useMusicianWallet, musicianWalletKey } from '../../application/useMusicianWallet';
import { useUpdatePixKey, getUpdatePixKeyErrorMessage } from '../../application/useUpdatePixKey';
import { validatePixKey, type PixKeyType } from '../../domain/musician.validation';
import { formatCpf } from '@/shared/utils/cpf';
import { formatPhoneBr, toE164Br } from '@/shared/utils/phone';

// Estado local (não RHF) — mesma filosofia de StepFourPix/useMusicianWizardState:
// GET da carteira só prefila o texto da chave (backend nunca persiste
// pix_key_type — não dá pra inferir o chip certo por heurística de formato,
// então o tipo começa sem seleção mesmo com chave já cadastrada).
export function useEditWalletSection(musicianId: string, musicianEmail: string, musicianPhone: string | null) {
  const queryClient = useQueryClient();
  const authCpf = useAuthStore((s) => s.user?.cpf ?? null);

  const { data: wallet, isPending: isLoadingWallet } = useMusicianWallet(musicianId);

  const [pixKeyType, setPixKeyType] = useState<PixKeyType | null>(null);
  const [pixKey, setPixKey]         = useState(wallet?.pix_key ?? '');
  const [initialized, setInitialized] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);

  // Prefill assíncrono: só na 1ª vez que o GET resolve (evita sobrescrever o
  // que a pessoa já está digitando se o cache revalidar em background).
  useEffect(() => {
    if (initialized || wallet === undefined) return;
    if (wallet.pix_key) setPixKey(wallet.pix_key);
    setInitialized(true);
  }, [wallet, initialized]);

  const updatePixKeyMutation = useUpdatePixKey(musicianId);

  const isDirty = initialized && pixKey !== (wallet?.pix_key ?? '');

  const handleSelectType = (type: PixKeyType) => {
    setPixKeyType(type);
    if (type === pixKeyType) return;
    if (type === 'cpf' && authCpf) setPixKey(formatCpf(authCpf));
    else if (type === 'phone' && musicianPhone) setPixKey(formatPhoneBr(musicianPhone));
    else if (type === 'email' && musicianEmail) setPixKey(musicianEmail);
    else setPixKey('');
  };

  const handleChangeKey = (v: string) => {
    if (pixKeyType === 'cpf') setPixKey(formatCpf(v));
    else if (pixKeyType === 'phone') setPixKey(formatPhoneBr(v));
    else setPixKey(v);
  };

  const onSave = async () => {
    setError(null);
    if (!pixKeyType) {
      setFieldError('Escolha o tipo da chave PIX');
      return false;
    }
    const validationError = validatePixKey(pixKeyType, pixKey);
    setFieldError(validationError);
    if (validationError) return false;

    // Backend (PixKey VO) exige E.164 pra chave tipo celular (+5511999999999)
    // — validatePixKey acima valida o formato local (10-11 dígitos exibido no
    // campo); a conversão é só no payload enviado, igual ao wizard
    // (useMusicianWizardHandlers.ts).
    const pixKeyValue = pixKeyType === 'phone' ? toE164Br(pixKey) : pixKey;

    try {
      await updatePixKeyMutation.mutateAsync({ pix_key: pixKeyValue, pix_key_type: pixKeyType });
      return true;
    } catch (err) {
      setError(getUpdatePixKeyErrorMessage(err));
      return false;
    } finally {
      queryClient.invalidateQueries({ queryKey: musicianWalletKey(musicianId) });
    }
  };

  return {
    pixKeyType, pixKey,
    onChangeType: handleSelectType,
    onChangeKey:  handleChangeKey,
    fieldError,
    error,
    isDirty,
    isLoadingWallet,
    isSaving: updatePixKeyMutation.isPending,
    onSave,
  };
}
