import type { QueryClient } from '@tanstack/react-query';
import { musicianWizardGateKey, wizardCompletedKey } from '../../application/useMusicianWizardGate';
import { useUpdateMusician, getUpdateMusicianErrorMessage } from '../../application/useUpdateMusician';
import { useUploadAvatar, getUploadAvatarErrorMessage } from '../../application/useUploadAvatar';
import { useUpdatePixKey, getUpdatePixKeyErrorMessage } from '../../application/useUpdatePixKey';
import { validateStep1, step2IsValid, validatePixKey } from '../../domain/musician.validation';
import { INSTRUMENT_OPTIONS, GENRE_OPTIONS, resolveLabels } from '../../domain/musician.constants';
import { stripDigits } from '@/shared/utils/cpf';
import { toE164Br } from '@/shared/utils/phone';
import { inferImageMimeType, inferImageFileName } from '@/shared/utils/image';
import { setWizardCompleted } from '@/shared/services/storage/wizard.storage';
import type { useMusicianWizardState } from './useMusicianWizardState';
import type { MusicianProfile } from '../../domain/musician.types';

type Wizard = ReturnType<typeof useMusicianWizardState>;

// Orquestra as chamadas assíncronas de cada step do wizard (PATCH perfil, upload
// de avatar, PATCH chave PIX) — extraído do screen para respeitar o limite de
// ~200 linhas por arquivo de tela (CLAUDE.md).
export function useMusicianWizardHandlers(
  wizard: Wizard,
  musicianId: string | null,
  queryClient: QueryClient,
) {
  const updateMusician = useUpdateMusician(musicianId);
  const uploadAvatar   = useUploadAvatar(musicianId);
  const updatePixKey   = useUpdatePixKey(musicianId);

  const step2Valid = step2IsValid(wizard.state.instruments, wizard.state.genres);

  const handleAdvanceStep1 = () => {
    const errors = validateStep1(wizard.state.stageName, wizard.state.bio);
    if (Object.keys(errors).length) {
      wizard.setFieldErrors(errors);
      return;
    }
    wizard.advanceToStep2();
  };

  const handleAdvanceStep2 = async () => {
    if (!step2Valid) {
      wizard.setStep2Error('Escolha ao menos 1 instrumento e 1 gênero para continuar.');
      return;
    }
    wizard.setStep2Error(null);

    try {
      const response = await updateMusician.mutateAsync({
        stage_name:  wizard.state.stageName.trim(),
        bio:         wizard.state.bio.trim(),
        instruments: resolveLabels(wizard.state.instruments, INSTRUMENT_OPTIONS),
        genres:      resolveLabels(wizard.state.genres, GENRE_OPTIONS),
      });
      wizard.advanceToStep3(response.qr_code);
    } catch (err) {
      wizard.setStep2Error(getUpdateMusicianErrorMessage(err));
    }
  };

  const handleUploadAvatar = async () => {
    if (!wizard.state.avatarUri) {
      wizard.setAvatarError('Escolha uma foto ou pule esta etapa.');
      return;
    }
    wizard.setAvatarError(null);

    try {
      await uploadAvatar.mutateAsync({
        uri:  wizard.state.avatarUri,
        name: inferImageFileName(wizard.state.avatarUri),
        type: inferImageMimeType(wizard.state.avatarUri),
      });
      wizard.advanceToStep4();
    } catch (err) {
      wizard.setAvatarError(getUploadAvatarErrorMessage(err));
    }
  };

  const handleSavePix = async () => {
    if (!wizard.state.pixKeyType) {
      wizard.setPixError('Escolha um tipo de chave PIX ou pule esta etapa.');
      return;
    }
    const validationError = validatePixKey(wizard.state.pixKeyType, wizard.state.pixKey);
    if (validationError) {
      wizard.setPixError(validationError);
      return;
    }
    wizard.setPixError(null);

    const pixKeyValue =
      wizard.state.pixKeyType === 'cpf'   ? stripDigits(wizard.state.pixKey) :
      wizard.state.pixKeyType === 'phone' ? toE164Br(wizard.state.pixKey) :
      wizard.state.pixKey.trim();

    try {
      await updatePixKey.mutateAsync({ pix_key: pixKeyValue, pix_key_type: wizard.state.pixKeyType });
      wizard.advanceToStep5();
    } catch (err) {
      wizard.setPixError(getUpdatePixKeyErrorMessage(err));
    }
  };

  const handleGoHome = () => {
    if (!musicianId) return;
    // Flip reativo do gate (1.14): só agora — no tap final do Step 5, não logo
    // após o PATCH — o RootNavigator troca o wizard pelas MusicianTabs.
    //
    // 🔴 MESCLA com o perfil em cache, nunca substitui. A versão anterior
    // escrevia o estado local do wizard inteiro — que, retomado no passo 3,
    // tinha nome artístico VAZIO. O gate lia "sem nome", mandava de volta ao
    // passo 1, e a tela montada seguia no passo 5: o botão não saía do lugar.
    const stageName = wizard.state.stageName.trim();
    queryClient.setQueryData<MusicianProfile>(musicianWizardGateKey(musicianId), (cached) =>
      cached && stageName ? { ...cached, stage_name: stageName } : cached,
    );

    // 1.20: persiste que o wizard chegou até o fim (Steps 3/4 puláveis já
    // vistos), senão o gate reabriria o wizard no próximo boot.
    queryClient.setQueryData(wizardCompletedKey(musicianId), true);
    void setWizardCompleted(musicianId);
  };

  return {
    step2Valid,
    isUpdatingMusician:  updateMusician.isPending,
    isUploadingAvatar:   uploadAvatar.isPending,
    isSavingPixKey:      updatePixKey.isPending,
    handleAdvanceStep1,
    handleAdvanceStep2,
    handleUploadAvatar,
    handleSavePix,
    handleGoHome,
  };
}
