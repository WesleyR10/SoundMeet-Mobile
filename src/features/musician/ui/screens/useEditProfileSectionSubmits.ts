import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { UseFormGetValues, UseFormTrigger } from 'react-hook-form';
import { useUpdateMusician, getUpdateMusicianErrorMessage } from '../../application/useUpdateMusician';
import { useUpdateMusicianProfile, getUpdateMusicianProfileErrorMessage } from '../../application/useUpdateMusicianProfile';
import { musicianProfileKey } from '../../application/useMusician';
import { musicianWizardGateKey } from '../../application/useMusicianWizardGate';
import { resolveLabels, INSTRUMENT_OPTIONS, GENRE_OPTIONS } from '../../domain/musician.constants';
import type { EditProfileFormValues } from '../../domain/musician.validation';
import type { PriceRangeModel } from '../../domain/musician.types';

type Args = {
  musicianId:    string;
  getValues:     UseFormGetValues<EditProfileFormValues>;
  trigger:       UseFormTrigger<EditProfileFormValues>;
  instrumentIds: string[];
  genreIds:      string[];
};

// Extraído de useEditProfileForm.ts (limite de ~200 linhas/arquivo, mesmo
// padrão de useMusicianWizardState.ts/useMusicianWizardHandlers.ts) — 1 hook
// por seção salvável do accordion, cada um chamando só o(s) endpoint(s) do seu
// tópico (mapeamento seção→endpoint documentado no plano de implementação).
//
// Erro é estado local por seção (não `mutation.error` direto): updateMusician/
// updateProfile são instâncias únicas reaproveitadas por várias seções
// (ex.: Identidade e Tags chamam updateMusician), então o `.error` do
// TanStack Query persistiria de uma seção pra outra até a próxima chamada
// bem-sucedida — cada onSaveX limpa e seta seu próprio erro no catch.
export function useEditProfileSectionSubmits({ musicianId, getValues, trigger, instrumentIds, genreIds }: Args) {
  const queryClient = useQueryClient();

  const updateMusician = useUpdateMusician(musicianId);
  const updateProfile  = useUpdateMusicianProfile(musicianId);

  const [identityError, setIdentityError]     = useState<string | null>(null);
  const [tagsError, setTagsError]             = useState<string | null>(null);
  const [experienceError, setExperienceError] = useState<string | null>(null);
  const [priceError, setPriceError]           = useState<string | null>(null);
  const [socialError, setSocialError]         = useState<string | null>(null);

  const invalidateProfile = () => queryClient.invalidateQueries({ queryKey: musicianProfileKey(musicianId) });

  const onSaveIdentity = async (): Promise<boolean> => {
    setIdentityError(null);
    const valid = await trigger(['stageName', 'bio']);
    if (!valid) return false;
    const { stageName, bio } = getValues();
    try {
      await updateMusician.mutateAsync({ stage_name: stageName, bio: bio ?? '' });
      return true;
    } catch (err) {
      setIdentityError(getUpdateMusicianErrorMessage(err));
      return false;
    } finally {
      invalidateProfile();
    }
  };

  const onSaveTags = async (): Promise<boolean> => {
    setTagsError(null);
    const instrumentLabels = resolveLabels(instrumentIds, INSTRUMENT_OPTIONS);
    const genreLabels      = resolveLabels(genreIds, GENRE_OPTIONS);
    try {
      await updateMusician.mutateAsync({ instruments: instrumentLabels, genres: genreLabels });
      await updateProfile.mutateAsync({ instruments: instrumentLabels, genres: genreLabels });
      return true;
    } catch (err) {
      setTagsError(getUpdateMusicianProfileErrorMessage(err));
      return false;
    } finally {
      invalidateProfile();
      queryClient.invalidateQueries({ queryKey: musicianWizardGateKey(musicianId) });
    }
  };

  const onSaveExperience = async (): Promise<boolean> => {
    setExperienceError(null);
    const valid = await trigger(['experienceYears']);
    if (!valid) return false;
    const { experienceYears } = getValues();
    try {
      await updateProfile.mutateAsync({ experience: experienceYears });
      return true;
    } catch (err) {
      setExperienceError(getUpdateMusicianProfileErrorMessage(err));
      return false;
    } finally {
      invalidateProfile();
    }
  };

  const onSavePrice = async (): Promise<boolean> => {
    setPriceError(null);
    const valid = await trigger(['priceModel', 'priceMin', 'priceMax', 'priceNotes']);
    if (!valid) return false;
    const { priceModel, priceMin, priceMax, priceNotes } = getValues();
    try {
      await updateProfile.mutateAsync({
        priceRange: priceModel
          ? { model: priceModel as PriceRangeModel, min: Number(priceMin), max: Number(priceMax), currency: 'BRL', notes: priceNotes || null }
          : null,
      });
      return true;
    } catch (err) {
      setPriceError(getUpdateMusicianProfileErrorMessage(err));
      return false;
    } finally {
      invalidateProfile();
    }
  };

  const onSaveSocial = async (): Promise<boolean> => {
    setSocialError(null);
    const valid = await trigger(['instagram', 'youtube', 'spotify']);
    if (!valid) return false;
    const { instagram, youtube, spotify } = getValues();
    try {
      await updateProfile.mutateAsync({
        socialLinks: {
          instagram: instagram || undefined,
          youtube:   youtube || undefined,
          spotify:   spotify || undefined,
        },
      });
      return true;
    } catch (err) {
      setSocialError(getUpdateMusicianProfileErrorMessage(err));
      return false;
    } finally {
      invalidateProfile();
    }
  };

  return {
    identity:   { onSave: onSaveIdentity,   isSaving: updateMusician.isPending,                     error: identityError },
    tags:       { onSave: onSaveTags,       isSaving: updateMusician.isPending || updateProfile.isPending, error: tagsError },
    experience: { onSave: onSaveExperience, isSaving: updateProfile.isPending,                       error: experienceError },
    price:      { onSave: onSavePrice,      isSaving: updateProfile.isPending,                       error: priceError },
    social:     { onSave: onSaveSocial,     isSaving: updateProfile.isPending,                       error: socialError },
  };
}
