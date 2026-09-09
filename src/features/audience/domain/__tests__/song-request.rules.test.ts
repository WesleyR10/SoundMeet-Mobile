import { catalogGenre, stillMatchesPick } from '../song-request.rules';
import type { PublicRepertoireItem } from '../repertoire.types';

function item(overrides: Partial<PublicRepertoireItem> = {}): PublicRepertoireItem {
  return {
    id:               'c0ffee00-0000-4000-8000-000000000001',
    musician_id:      'c0ffee00-0000-4000-8000-000000000002',
    title:            'Garota de Ipanema',
    artist:           'Tom Jobim',
    genre:            'bossa-nova',
    difficulty:       3,
    duration_seconds: 210,
    ...overrides,
  };
}

describe('stillMatchesPick', () => {
  it('casa quando título e artista continuam iguais ao item escolhido', () => {
    expect(stillMatchesPick(item(), 'Garota de Ipanema', 'Tom Jobim')).toBe(true);
  });

  it('não casa quando o fã editou o título', () => {
    expect(stillMatchesPick(item(), 'Garota de Ipanema (ao vivo)', 'Tom Jobim')).toBe(false);
  });

  it('não casa quando o fã editou o artista', () => {
    expect(stillMatchesPick(item(), 'Garota de Ipanema', 'João Gilberto')).toBe(false);
  });

  // A comparação é exata de propósito — ver o comentário da regra.
  it('não casa por diferença de caixa nem de espaço em branco', () => {
    expect(stillMatchesPick(item(), 'garota de ipanema', 'Tom Jobim')).toBe(false);
    expect(stillMatchesPick(item(), 'Garota de Ipanema ', 'Tom Jobim')).toBe(false);
  });

  it('nunca casa sem item escolhido (texto livre puro)', () => {
    expect(stillMatchesPick(null, 'Garota de Ipanema', 'Tom Jobim')).toBe(false);
  });
});

describe('catalogGenre', () => {
  it('devolve o gênero do catálogo quando a escolha continua válida', () => {
    expect(catalogGenre(item(), 'Garota de Ipanema', 'Tom Jobim')).toBe('bossa-nova');
  });

  // 🔴 O caso que a regra existe para impedir: gênero herdado de um item que
  // não é mais o que está sendo pedido.
  it('devolve null assim que o texto deixa de corresponder ao item', () => {
    expect(catalogGenre(item(), 'Outra música', 'Tom Jobim')).toBeNull();
  });

  it('devolve null quando o item do catálogo não tem gênero', () => {
    expect(catalogGenre(item({ genre: null }), 'Garota de Ipanema', 'Tom Jobim')).toBeNull();
  });

  it('devolve null quando o fã digitou tudo à mão', () => {
    expect(catalogGenre(null, 'Qualquer coisa', 'Alguém')).toBeNull();
  });
});
