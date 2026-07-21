import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateMusicianProfile, getUpdateMusicianProfileErrorMessage } from '../../application/useUpdateMusicianProfile';
import { musicianProfileKey } from '../../application/useMusician';
import { validateLocation } from '../../domain/musician.validation';
import { lookupCep, formatCepInput, CepNotFoundError } from '@/shared/services/cep/viacep.api';
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
  const [cep, setCep]                   = useState(initialLocation?.zip_code ? formatCepInput(initialLocation.zip_code) : '');
  const [street, setStreet]             = useState(initialLocation?.street ?? '');
  const [number, setNumber]             = useState(initialLocation?.number ?? '');
  const [complement, setComplement]     = useState(initialLocation?.complement ?? '');
  const [neighborhood, setNeighborhood] = useState(initialLocation?.neighborhood ?? '');

  const [cepLoading, setCepLoading]     = useState(false);
  const [cepError, setCepError]         = useState<string | undefined>(undefined);
  const [error, setError]               = useState<string | null>(null);
  const [fieldError, setFieldError]     = useState<string | undefined>(undefined);

  // Evita consulta duplicada pro mesmo CEP (ex.: blur + re-render).
  const lastLookupRef = useRef<string | null>(null);

  const updateProfile = useUpdateMusicianProfile(musicianId);

  const isDirty =
    city !== (initialLocation?.city ?? '') ||
    state !== (initialLocation?.state ?? '') ||
    cep.replace(/\D/g, '') !== (initialLocation?.zip_code ?? '') ||
    street !== (initialLocation?.street ?? '') ||
    number !== (initialLocation?.number ?? '') ||
    complement !== (initialLocation?.complement ?? '') ||
    neighborhood !== (initialLocation?.neighborhood ?? '');

  const onChangeCep = (raw: string) => {
    const masked = formatCepInput(raw);
    setCep(masked);
    setCepError(undefined);

    const digits = masked.replace(/\D/g, '');
    if (digits.length !== 8 || lastLookupRef.current === digits) return;

    lastLookupRef.current = digits;
    setCepLoading(true);
    lookupCep(digits)
      .then((address) => {
        // Autofill valida o CEP e corrige o endereço — campos continuam
        // editáveis (ViaCEP não traz número/complemento).
        if (address.street) setStreet(address.street);
        if (address.neighborhood) setNeighborhood(address.neighborhood);
        if (address.city) setCity(address.city);
        if (address.state) setState(address.state);
      })
      .catch((err) => {
        setCepError(err instanceof CepNotFoundError ? 'CEP não encontrado' : 'Falha ao consultar o CEP');
        lastLookupRef.current = null;
      })
      .finally(() => setCepLoading(false));
  };

  // Latitude/longitude nunca são coletadas nesta tela, mas changeLocation no
  // backend substitui o VO inteiro — sempre repassar os valores atuais para
  // não zerar coordenadas existentes.
  const onSave = async () => {
    setError(null);
    const { state: stateError } = validateLocation(city, state);
    setFieldError(stateError);
    if (stateError) return false;

    const cepDigits = cep.replace(/\D/g, '');
    if (cepDigits.length > 0 && cepDigits.length !== 8) {
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
