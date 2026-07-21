import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateBandAddress, getUpdateBandAddressErrorMessage } from '../../application/useUpdateBandAddress';
import { bandKey, myBandsKey } from '../../application/useBands';
import { validateLocation } from '../../domain/musician.validation';
import { lookupCep, formatCepInput, CepNotFoundError } from '@/shared/services/cep/viacep.api';
import type { MusicianLocation } from '../../domain/musician.types';

// Espelha useEditLocationSection.ts (músico), trocando updateMusicianProfile
// por updateBandAddress — endereço próprio da banda, não herdado do líder.
// Reaproveita o componente EditLocationSection.tsx sem alteração (props já
// são genéricos). Só o líder deve chegar aqui (ver BandLeaderSettingsSection).
export function useEditBandAddressSection(bandId: string, musicianId: string | null, initialAddress: MusicianLocation | null) {
  const queryClient = useQueryClient();

  const [city, setCity]                 = useState(initialAddress?.city ?? '');
  const [state, setState]               = useState(initialAddress?.state ?? '');
  const [cep, setCep]                   = useState(initialAddress?.zip_code ? formatCepInput(initialAddress.zip_code) : '');
  const [street, setStreet]             = useState(initialAddress?.street ?? '');
  const [number, setNumber]             = useState(initialAddress?.number ?? '');
  const [complement, setComplement]     = useState(initialAddress?.complement ?? '');
  const [neighborhood, setNeighborhood] = useState(initialAddress?.neighborhood ?? '');

  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError]     = useState<string | undefined>(undefined);
  const [error, setError]           = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);

  const lastLookupRef = useRef<string | null>(null);

  const updateAddress = useUpdateBandAddress(bandId, musicianId);

  const isDirty =
    city !== (initialAddress?.city ?? '') ||
    state !== (initialAddress?.state ?? '') ||
    cep.replace(/\D/g, '') !== (initialAddress?.zip_code ?? '') ||
    street !== (initialAddress?.street ?? '') ||
    number !== (initialAddress?.number ?? '') ||
    complement !== (initialAddress?.complement ?? '') ||
    neighborhood !== (initialAddress?.neighborhood ?? '');

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
      await updateAddress.mutateAsync({
        city:         city.trim() || null,
        state:        state.trim() || null,
        latitude:     initialAddress?.latitude ?? null,
        longitude:    initialAddress?.longitude ?? null,
        street:       street.trim() || null,
        number:       number.trim() || null,
        complement:   complement.trim() || null,
        neighborhood: neighborhood.trim() || null,
        zip_code:     cepDigits || null,
      });
      return true;
    } catch (err) {
      setError(getUpdateBandAddressErrorMessage(err));
      return false;
    } finally {
      queryClient.invalidateQueries({ queryKey: bandKey(bandId) });
      if (musicianId) queryClient.invalidateQueries({ queryKey: myBandsKey(musicianId) });
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
    isSaving: updateAddress.isPending,
    onSave,
  };
}
