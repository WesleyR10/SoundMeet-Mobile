import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateMusicianProfile, getUpdateMusicianProfileErrorMessage } from '../../application/useUpdateMusicianProfile';
import { musicianProfileKey } from '../../application/useMusician';
import { validateLocation } from '../../domain/musician.validation';
import type { MusicianLocation } from '../../domain/musician.types';

// Estado local simples (não RHF) — mesma filosofia de useEditWalletSection.ts:
// a seção "Localização" salva sozinha, fora do editProfileSchema/form grande.
export function useEditLocationSection(musicianId: string, initialLocation: MusicianLocation | undefined) {
  const queryClient = useQueryClient();

  const [city, setCity]   = useState(initialLocation?.city ?? '');
  const [state, setState] = useState(initialLocation?.state ?? '');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);

  const updateProfile = useUpdateMusicianProfile(musicianId);

  const isDirty = city !== (initialLocation?.city ?? '') || state !== (initialLocation?.state ?? '');

  // Latitude/longitude nunca são coletadas nesta tela, mas changeLocation no
  // backend substitui o VO inteiro — precisamos sempre repassar os valores
  // atuais para não zerar coordenadas existentes (hoje sempre null na prática,
  // mas é a garantia correta caso uma fonte futura de lat/lng passe a existir).
  const onSave = async () => {
    setError(null);
    const { state: stateError } = validateLocation(city, state);
    setFieldError(stateError);
    if (stateError) return false;

    try {
      await updateProfile.mutateAsync({
        location: {
          city:      city.trim() || null,
          state:     state.trim() || null,
          latitude:  initialLocation?.latitude ?? null,
          longitude: initialLocation?.longitude ?? null,
        },
      });
      return true;
    } catch (err) {
      setError(getUpdateMusicianProfileErrorMessage(err));
      return false;
    } finally {
      queryClient.invalidateQueries({ queryKey: musicianProfileKey(musicianId) });
    }
  };

  return {
    city, setCity,
    state, setState,
    fieldError,
    error,
    isDirty,
    isSaving: updateProfile.isPending,
    onSave,
  };
}
