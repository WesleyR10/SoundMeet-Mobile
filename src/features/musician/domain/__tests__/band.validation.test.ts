import {
  BAND_NAME_MAX,
  confirmsBandDeletion,
  createBandSchema,
  parseFormationYear,
} from '../band.validation';

describe('createBandSchema', () => {
  it('aceita o mínimo: nome e um gênero', () => {
    const result = createBandSchema.safeParse({ name: 'Trio da Esquina', genres: ['samba'] });
    expect(result.success).toBe(true);
  });

  it('apara espaço em volta do nome', () => {
    const result = createBandSchema.safeParse({ name: '  Trio  ', genres: ['mpb'] });
    expect(result.success && result.data.name).toBe('Trio');
  });

  /*
   * 🔴 Gênero é obrigatório aqui e NÃO no backend (`@IsArray()` aceita lista
   * vazia). O filtro de descoberta do estabelecimento é `hasSome` sobre este
   * array: banda sem gênero nasce invisível para quem contrata, sem nenhum erro
   * que denuncie isso.
   */
  it('recusa banda sem nenhum gênero', () => {
    const result = createBandSchema.safeParse({ name: 'Trio', genres: [] });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toBe(
      'Escolha pelo menos um gênero',
    );
  });

  it('recusa nome curto demais ou longo demais', () => {
    expect(createBandSchema.safeParse({ name: 'X', genres: ['rock'] }).success).toBe(false);
    expect(
      createBandSchema.safeParse({ name: 'a'.repeat(BAND_NAME_MAX + 1), genres: ['rock'] }).success,
    ).toBe(false);
  });
});

describe('confirmsBandDeletion', () => {
  /*
   * A confirmação prova INTENÇÃO, não digitação: `DELETE /bands/:id` é
   * irreversível e o backend só checa liderança. Exigir capitalização exata
   * transformaria a barreira em obstáculo e levaria o líder a desistir de uma
   * ação legítima — ou, pior, a colar o nome sem ler.
   */
  it('ignora caixa e espaço em volta', () => {
    expect(confirmsBandDeletion('  trio da esquina ', 'Trio da Esquina')).toBe(true);
    expect(confirmsBandDeletion('TRIO DA ESQUINA', 'Trio da Esquina')).toBe(true);
  });

  it('recusa nome parcial, vazio ou de outra banda', () => {
    expect(confirmsBandDeletion('Trio', 'Trio da Esquina')).toBe(false);
    expect(confirmsBandDeletion('', 'Trio da Esquina')).toBe(false);
    expect(confirmsBandDeletion('Outra Banda', 'Trio da Esquina')).toBe(false);
  });
});

describe('parseFormationYear', () => {
  const em = (year: number) => new Date(year, 5, 15);

  it('aceita um ano válido', () => {
    expect(parseFormationYear('2019', em(2026))).toEqual({ ok: true, value: 2019 });
  });

  it('vazio é APAGAR, não erro — precisa haver caminho de volta', () => {
    expect(parseFormationYear('', em(2026))).toEqual({ ok: true, value: null });
    expect(parseFormationYear('   ', em(2026))).toEqual({ ok: true, value: null });
  });

  it('aceita o ano corrente — banda formada este mês é caso real', () => {
    expect(parseFormationYear('2026', em(2026))).toEqual({ ok: true, value: 2026 });
  });

  it('🔴 recusa o ano que vem', () => {
    const result = parseFormationYear('2027', em(2026));
    expect(result.ok).toBe(false);
  });

  it('recusa antes de 1900', () => {
    expect(parseFormationYear('1899', em(2026)).ok).toBe(false);
  });

  it.each(['19', '20190', '2019.5', 'abc', '2o19', '-2019'])(
    'recusa %s — não é um ano de 4 dígitos',
    (raw) => {
      expect(parseFormationYear(raw, em(2026)).ok).toBe(false);
    },
  );

  it('🔴 o teto acompanha o relógio, não o load do módulo', () => {
    // Com `.max(getFullYear())` fixado na carga, este caso passaria a falhar
    // na virada do ano — num bundle que fica dias na memória do aparelho.
    expect(parseFormationYear('2031', em(2031))).toEqual({ ok: true, value: 2031 });
    expect(parseFormationYear('2031', em(2030)).ok).toBe(false);
  });
});
