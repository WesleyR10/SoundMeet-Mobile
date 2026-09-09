import { BAND_NAME_MAX, confirmsBandDeletion, createBandSchema } from '../band.validation';

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
