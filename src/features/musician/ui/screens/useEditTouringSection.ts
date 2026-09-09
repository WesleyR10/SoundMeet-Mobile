import { useState } from 'react';
import { useCepAutofill } from '@/shared/services/cep/useCepAutofill';
import {
  useClearTouringLocation,
  useSetTouringLocation,
  getTouringErrorMessage,
} from '../../application/useTouringLocation';
import { buildTouringPayload, clampTouringDays, formatTouringExpiry } from '../../domain/touring.rules';
import { validateLocation } from '../../domain/musician.validation';
import type { MusicianProfileDetails } from '../../domain/musician.types';

const DEFAULT_TOURING_DAYS = 7;

/**
 * Seção "Modo turnê" do accordion de perfil (7.13d).
 *
 * Espelha `useEditLocationSection` — mesmo formulário de endereço, mesmo
 * autofill de CEP — com duas diferenças que importam:
 *
 * 1. **A falha de geocodificação BLOQUEIA o save.** No perfil ela é
 *    best-effort (endereço sem coordenada ainda é um endereço); aqui, sem
 *    coordenadas o modo turnê não tem função nenhuma, porque o ponto extra
 *    existe só para a busca por raio. O erro precisa aparecer.
 * 2. **Tem desligar.** O endereço base não se apaga; a turnê sim, e antes do
 *    prazo.
 */
export function useEditTouringSection(
  musicianId: string,
  profile: MusicianProfileDetails | null | undefined,
) {
  const isActive = !!profile?.is_touring;
  // Só herda o endereço quando a turnê está de fato ativa: reaproveitar a
  // cidade de uma turnê vencida sugeriria que ela continua valendo.
  const current = isActive ? profile?.touring_location ?? null : null;

  const [city, setCity]                 = useState(current?.city ?? '');
  const [state, setState]               = useState(current?.state ?? '');
  const [street, setStreet]             = useState(current?.street ?? '');
  const [number, setNumber]             = useState(current?.number ?? '');
  const [complement, setComplement]     = useState(current?.complement ?? '');
  const [neighborhood, setNeighborhood] = useState(current?.neighborhood ?? '');
  const [durationDays, setDurationDays] = useState(DEFAULT_TOURING_DAYS);

  const [error, setError]           = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);

  const { cep, onChangeCep, cepLoading, cepError, setCepError, cepDigits, isCepIncomplete } =
    useCepAutofill(current?.zip_code, { setStreet, setNeighborhood, setCity, setState });

  const setTouring = useSetTouringLocation(musicianId);
  const clearTouring = useClearTouringLocation(musicianId);

  const expiresAtLabel = formatTouringExpiry(profile?.touring_expires_at ?? null);

  const onChangeDuration = (days: number) => setDurationDays(clampTouringDays(days));

  const onSave = async () => {
    setError(null);

    // Cidade e UF são o mínimo para o geocoder ter o que resolver — e é a UF
    // que a busca por raio usa para desambiguar cidades homônimas.
    const { state: stateError } = validateLocation(city, state);
    setFieldError(stateError);
    if (stateError) return false;

    if (isCepIncomplete) {
      setCepError('CEP incompleto');
      return false;
    }

    try {
      await setTouring.mutateAsync(
        buildTouringPayload({ city, state, cep, street, number, complement, neighborhood, durationDays }),
      );
      return true;
    } catch (err) {
      // 🔴 Sem tratar isto, um endereço que o geocoder não resolve "salvaria"
      // sem nunca aparecer em busca nenhuma — o pior resultado possível, porque
      // o músico acredita estar localizável na cidade em que está tocando.
      setError(getTouringErrorMessage(err));
      return false;
    }
  };

  const onDeactivate = async () => {
    setError(null);
    try {
      await clearTouring.mutateAsync();
      return true;
    } catch (err) {
      setError(getTouringErrorMessage(err));
      return false;
    }
  };

  return {
    isActive,
    expiresAtLabel,
    city, setCity,
    state, setState,
    cep, onChangeCep, cepLoading, cepError,
    street, setStreet,
    number, setNumber,
    complement, setComplement,
    neighborhood, setNeighborhood,
    durationDays, onChangeDuration,
    fieldError,
    error,
    isSaving: setTouring.isPending,
    isDeactivating: clearTouring.isPending,
    onSave,
    onDeactivate,
    // Endereço de turnê é sempre um rascunho até o save; não entra no aviso de
    // "alterações não salvas" para não travar a saída da tela por um campo que
    // o músico só espiou.
    hasDraft: !!(city.trim() || cepDigits),
  };
}
