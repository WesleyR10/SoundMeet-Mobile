import { MAX_TOURING_DAYS, MIN_TOURING_DAYS } from './musician.types';
import type { MusicianProfileDetails, SetTouringLocationPayload } from './musician.types';

/**
 * Regras do modo turnê (7.13d).
 *
 * O agregado do backend é a autoridade sobre expiração (`isTouring` é computado
 * na leitura). Nada aqui recalcula esse estado — só o apresenta.
 */

export type TouringFormValues = {
  city:         string;
  state:        string;
  cep:          string;
  street:       string;
  number:       string;
  complement:   string;
  neighborhood: string;
  durationDays: number;
};

/** Espelha `@Min(1) @Max(30)` do DTO — fora disso o backend devolve 422. */
export function clampTouringDays(days: number): number {
  if (!Number.isFinite(days)) return MIN_TOURING_DAYS;
  return Math.min(MAX_TOURING_DAYS, Math.max(MIN_TOURING_DAYS, Math.round(days)));
}

/**
 * 🔴 O payload é **snake_case**, ao contrário do `PATCH /musicians/:id/profile`,
 * que é camelCase. `SetMusicianTouringLocationInput` estende `LocationInput`, e
 * com `forbidNonWhitelisted` ligado um `zipCode` aqui não é descartado em
 * silêncio: derruba a requisição inteira com 422. Centralizar a montagem numa
 * função testada é o que impede a confusão de voltar.
 */
export function buildTouringPayload(values: TouringFormValues): SetTouringLocationPayload {
  const cepDigits = values.cep.replace(/\D/g, '');
  return {
    city:         values.city.trim() || null,
    state:        values.state.trim() || null,
    street:       values.street.trim() || null,
    number:       values.number.trim() || null,
    complement:   values.complement.trim() || null,
    neighborhood: values.neighborhood.trim() || null,
    zip_code:     cepDigits || null,
    duration_days: clampTouringDays(values.durationDays),
  };
}

/**
 * Data em que a turnê acaba, por extenso e curta ("14 de out").
 *
 * A UI mostra a DATA, não os dias restantes: "até 14 de out" é acionável na
 * hora; "faltam 23 dias" obriga o músico a fazer conta para saber se cobre o
 * show da semana que vem.
 */
export function formatTouringExpiry(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/** Resumo para o cabeçalho do accordion. */
export function touringSubtitle(profile: MusicianProfileDetails | null | undefined): string {
  // `is_touring` já embute a expiração — não derivar de `touring_expires_at`,
  // ou passam a existir duas respostas para "estou de turnê?".
  if (!profile?.is_touring) return 'Desligado';
  const city = profile.touring_location?.city;
  const until = formatTouringExpiry(profile.touring_expires_at);
  const where = city ? `Em ${city}` : 'Ativo';
  return until ? `${where} até ${until}` : where;
}
