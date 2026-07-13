import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useUploadAvatar, getUploadAvatarErrorMessage } from '../../application/useUploadAvatar';
import { musicianProfileKey } from '../../application/useMusician';
import { inferImageFileName, inferImageMimeType } from '@/shared/utils/image';
import { resolveIds, INSTRUMENT_OPTIONS, GENRE_OPTIONS } from '../../domain/musician.constants';
import { editProfileSchema, type EditProfileFormValues } from '../../domain/musician.validation';
import { useEditProfileSectionSubmits } from './useEditProfileSectionSubmits';
import { useEditLocationSection } from './useEditLocationSection';
import { useEditWalletSection } from './useEditWalletSection';
import { useEditQRCodeSection } from './useEditQRCodeSection';
import type { MusicianProfile } from '../../domain/musician.types';

function toDefaultValues(musician: MusicianProfile): EditProfileFormValues {
  const priceRange = musician.profile?.price_range ?? null;
  const socialLinks = musician.profile?.social_links ?? null;

  return {
    stageName:       musician.stage_name ?? '',
    bio:             musician.bio ?? '',
    experienceYears: musician.profile?.experience ?? musician.experience_years ?? 0,
    priceModel:      priceRange?.model ?? null,
    priceMin:        priceRange ? String(priceRange.min) : '',
    priceMax:        priceRange ? String(priceRange.max) : '',
    priceNotes:      priceRange?.notes ?? '',
    instagram:       socialLinks?.instagram ?? '',
    youtube:         socialLinks?.youtube ?? '',
    spotify:         socialLinks?.spotify ?? '',
  };
}

// Orquestra o accordion de EditProfileScreen.tsx: 1 useForm continua sendo a
// fonte única de tipo/validação para os campos "RHF" (Identidade/Experiência/
// Preço/Redes sociais), mas o submit não é mais único — cada seção salva
// sozinha via useEditProfileSectionSubmits/useEditLocationSection/
// useEditWalletSection. Extraído de um onSubmit monolítico (ver histórico) —
// limite de ~200 linhas/arquivo, mesmo padrão de useMusicianWizardState.ts.
export function useEditProfileForm(musician: MusicianProfile, musicianId: string) {
  const queryClient = useQueryClient();

  const [avatarUri, setAvatarUri] = useState<string | null>(musician.avatar);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const initialInstrumentIds = useRef(resolveIds(musician.instruments, INSTRUMENT_OPTIONS)).current;
  const initialGenreIds      = useRef(resolveIds(musician.genres, GENRE_OPTIONS)).current;
  const [instrumentIds, setInstrumentIds] = useState<string[]>(initialInstrumentIds);
  const [genreIds, setGenreIds]           = useState<string[]>(initialGenreIds);

  const { control, getValues, trigger, formState } = useForm<EditProfileFormValues>({
    resolver:      zodResolver(editProfileSchema),
    defaultValues: toDefaultValues(musician),
  });

  const uploadAvatar = useUploadAvatar(musicianId);

  const toggleInstrument = (id: string) =>
    setInstrumentIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  const toggleGenre = (id: string) =>
    setGenreIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  // Avatar sobe imediatamente ao escolher — independente de qualquer seção do
  // accordion, mesma UX do StepThreePhoto no wizard.
  const handleChangeAvatar = async (uri: string) => {
    setAvatarUri(uri);
    setBannerError(null);
    try {
      await uploadAvatar.mutateAsync({ uri, name: inferImageFileName(uri), type: inferImageMimeType(uri) });
      queryClient.invalidateQueries({ queryKey: musicianProfileKey(musicianId) });
    } catch (err) {
      setBannerError(getUploadAvatarErrorMessage(err));
    }
  };

  const sections = useEditProfileSectionSubmits({ musicianId, getValues, trigger, instrumentIds, genreIds });
  const location = useEditLocationSection(musicianId, musician.profile?.location);
  const wallet    = useEditWalletSection(musicianId, musician.email, musician.phone);
  const qrCode    = useEditQRCodeSection(musicianId, musician);

  const sameIds = (a: string[], b: string[]) =>
    a.length === b.length && [...a].sort().join() === [...b].sort().join();
  const tagsDirty = !sameIds(instrumentIds, initialInstrumentIds) || !sameIds(genreIds, initialGenreIds);

  // Agregado usado pelo aviso de "alterações não salvas" ao sair — não indica
  // QUAL seção está suja, só SE alguma está (formState.isDirty cobre os 4
  // campos RHF; tags/localização/carteira têm estado local próprio).
  const isDirty = formState.isDirty || tagsDirty || location.isDirty || wallet.isDirty || qrCode.isDirty;

  return {
    control,
    avatarUri,
    handleChangeAvatar,
    instrumentIds,
    toggleInstrument,
    genreIds,
    toggleGenre,
    bannerError,
    sections,
    location,
    wallet,
    qrCode,
    isDirty,
  };
}
