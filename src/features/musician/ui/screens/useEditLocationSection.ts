import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateMusicianProfile, getUpdateMusicianProfileErrorMessage } from '../../application/useUpdateMusicianProfile';
import { musicianProfileKey } from '../../application/useMusician';
import { validateLocation } from '../../domain/musician.validation';
import { useCepAutofill } from '@/shared/services/cep/useCepAutofill';
import type { MusicianLocation } from '../../domain/musician.types';

// Estado local simples (não RHF) — mesma filosofia de useEditWalletSection.ts:
// a seção "Localização" salva sozinha, fora do editProfileSchema/form grande.
// CEP com autofill ViaCEP (item 9 do feedback jul/2026): completar 8 dígitos
// dispara a consulta e preenche rua/bairro/cidade/UF (todos editáveis) —
// número/complemento ficam com o usuário. Endereço é a BASE do músico, não
// posição fixa: shows em outras cidades não dependem dele (busca usa cidade/geo).
export function useEditLocationSection(musicianId: string, initialLocation: MusicianLocation | undefined) {
  const queryClient = useQueryClient();

  const [city, setCity]                 = useState(initialLocation?.city ?? '');
  const [state, setState]               = useState(initialLocation?.state ?? '');
  const [street, setStreet]             = useState(initialLocation?.street ?? '');
  const [number, setNumber]             = useState(initialLocation?.number ?? '');
  const [complement, setComplement]     = useState(initialLocation?.complement ?? '');
  const [neighborhood, setNeighborhood] = useState(initialLocation?.neighborhood ?? '');

  const [error, setError]               = useState<string | null>(null);
  const [fieldError, setFieldError]     = useState<string | undefined>(undefined);

  const { cep, onChangeCep, cepLoading, cepError, setCepError, cepDigits, isCepIncomplete } =
    useCepAutofill(initialLocation?.zip_code, { setStreet, setNeighborhood, setCity, setState });

  const updateProfile = useUpdateMusicianProfile(musicianId);

  const isDirty =
    city !== (initialLocation?.city ?? '') ||
    state !== (initialLocation?.state ?? '') ||
    cepDigits !== (initialLocation?.zip_code ?? '') ||
    street !== (initialLocation?.street ?? '') ||
    number !== (initialLocation?.number ?? '') ||
    complement !== (initialLocation?.complement ?? '') ||
    neighborhood !== (initialLocation?.neighborhood ?? '');

  // Latitude/longitude nunca são coletadas nesta tela, mas changeLocation no
  // backend substitui o VO inteiro — sempre repassar os valores atuais para
  // não zerar coordenadas existentes.
  const onSave = async () => {
    setError(null);
    const { state: stateError } = validateLocation(city, state);
    setFieldError(stateError);
    if (stateError) return false;

    if (isCepIncomplete) {
      setCepError('CEP incompleto');
      return false;
    }

    try {
      await updateProfile.mutateAsync({
        location: {
          city:         city.trim() || null,
          state:        state.trim() || null,
          latitude:     initialLocation?.latitude ?? null,
          longitude:    initialLocation?.longitude ?? null,
          street:       street.trim() || null,
          number:       number.trim() || null,
          complement:   complement.trim() || null,
          neighborhood: neighborhood.trim() || null,
          zip_code:     cepDigits || null,
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
    cep, onChangeCep, cepLoading, cepError,
    street, setStreet,
    number, setNumber,
    complement, setComplement,
    neighborhood, setNeighborhood,
    fieldError,
    error,
    isDirty,
    isSaving: updateProfile.isPending,
    onSave,
  };
}
