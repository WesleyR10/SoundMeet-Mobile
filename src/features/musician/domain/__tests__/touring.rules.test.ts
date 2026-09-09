import {
  buildTouringPayload,
  clampTouringDays,
  formatTouringExpiry,
  touringSubtitle,
  type TouringFormValues,
} from '../touring.rules';
import { MAX_TOURING_DAYS } from '../musician.types';
import type { MusicianLocation, MusicianProfileDetails } from '../musician.types';

function makeValues(overrides: Partial<TouringFormValues> = {}): TouringFormValues {
  return {
    city: 'Salvador',
    state: 'BA',
    cep: '40010-000',
    street: 'Rua Chile',
    number: '12',
    complement: '',
    neighborhood: 'Centro',
    durationDays: 7,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<MusicianProfileDetails> = {}): MusicianProfileDetails {
  return {
    id: 'p1',
    musician_id: 'm1',
    price_ranges: [],
    location: {} as MusicianLocation,
    touring_location: null,
    touring_expires_at: null,
    is_touring: false,
    social_links: null,
    experience: 0,
    instruments: [],
    genres: [],
    ...overrides,
  };
}

describe('buildTouringPayload', () => {
  /*
   * 🔴 O teste que existe para impedir o erro mais caro deste endpoint.
   * `PATCH /musicians/:id/profile` usa camelCase; ESTE usa snake_case. Com
   * `forbidNonWhitelisted` ligado, um `zipCode` aqui não é ignorado — devolve
   * 422 e o modo turnê simplesmente não liga.
   */
  it('usa snake_case nas chaves que o LocationInput exige', () => {
    const payload = buildTouringPayload(makeValues());

    expect(payload).toHaveProperty('zip_code');
    expect(payload).toHaveProperty('duration_days');
    expect(payload).not.toHaveProperty('zipCode');
    expect(payload).not.toHaveProperty('durationDays');
  });

  it('normaliza o CEP para 8 dígitos, sem máscara', () => {
    expect(buildTouringPayload(makeValues({ cep: '40010-000' })).zip_code).toBe('40010000');
  });

  it('manda null — não string vazia — para campo não preenchido', () => {
    const payload = buildTouringPayload(makeValues({ complement: '   ', cep: '' }));
    expect(payload.complement).toBeNull();
    expect(payload.zip_code).toBeNull();
  });

  it('trima o que o usuário digitou', () => {
    expect(buildTouringPayload(makeValues({ city: '  Recife  ' })).city).toBe('Recife');
  });

  it('nunca deixa duration_days sair da faixa aceita pelo DTO', () => {
    expect(buildTouringPayload(makeValues({ durationDays: 999 })).duration_days).toBe(MAX_TOURING_DAYS);
    expect(buildTouringPayload(makeValues({ durationDays: 0 })).duration_days).toBe(1);
  });
});

describe('clampTouringDays', () => {
  it(`prende em [1, ${MAX_TOURING_DAYS}]`, () => {
    expect(clampTouringDays(-5)).toBe(1);
    expect(clampTouringDays(0)).toBe(1);
    expect(clampTouringDays(15)).toBe(15);
    expect(clampTouringDays(MAX_TOURING_DAYS)).toBe(MAX_TOURING_DAYS);
    expect(clampTouringDays(MAX_TOURING_DAYS + 1)).toBe(MAX_TOURING_DAYS);
  });

  it('arredonda fracionário e sobrevive a NaN', () => {
    expect(clampTouringDays(7.4)).toBe(7);
    expect(clampTouringDays(Number.NaN)).toBe(1);
  });
});

describe('formatTouringExpiry', () => {
  it('devolve null para ausente ou inválido, em vez de "Invalid Date"', () => {
    expect(formatTouringExpiry(null)).toBeNull();
    expect(formatTouringExpiry('não é data')).toBeNull();
  });

  it('formata a data de término', () => {
    expect(formatTouringExpiry('2026-10-14T12:00:00.000Z')).toContain('14');
  });
});

describe('touringSubtitle', () => {
  /*
   * `is_touring` é computado no backend já com a expiração aplicada. Se a UI
   * passar a derivar o estado de `touring_expires_at`, passam a existir duas
   * respostas para "estou de turnê?" — e elas divergem no fuso do aparelho.
   */
  it('respeita is_touring=false mesmo com data futura no payload', () => {
    const subtitle = touringSubtitle(
      makeProfile({
        is_touring: false,
        touring_expires_at: '2099-01-01T00:00:00.000Z',
        touring_location: { city: 'Recife' } as MusicianLocation,
      }),
    );
    expect(subtitle).toBe('Desligado');
  });

  it('mostra cidade e data quando ativo', () => {
    const subtitle = touringSubtitle(
      makeProfile({
        is_touring: true,
        touring_expires_at: '2026-10-14T12:00:00.000Z',
        touring_location: { city: 'Salvador' } as MusicianLocation,
      }),
    );
    expect(subtitle).toContain('Salvador');
    expect(subtitle).toContain('14');
  });

  it('não quebra sem perfil', () => {
    expect(touringSubtitle(undefined)).toBe('Desligado');
  });
});
