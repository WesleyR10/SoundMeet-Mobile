import { catalogGenre, catalogLibraryId, stillMatchesPick } from '../song-request.rules';
import type { SongCatalogItem } from '../repertoire.types';

const LIBRARY_ID = 'c0ffee00-0000-4000-8000-000000000001';

function item(overrides: Partial<SongCatalogItem> = {}): SongCatalogItem {
  return {
    title:           'Garota de Ipanema',
    artist:          'Tom Jobim',
    genre:           'bossa-nova',
    musicians_count: 4,
    library_id:      LIBRARY_ID,
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

describe('catalogLibraryId', () => {
  it('devolve o library_id quando a escolha continua válida', () => {
    expect(catalogLibraryId(item(), 'Garota de Ipanema', 'Tom Jobim')).toBe(LIBRARY_ID);
  });

  // 🔴 O caso mais importante: um `library_id` herdado de um item que não é
  // mais o que está sendo pedido amarraria o pedido à música errada da
  // biblioteca do artista.
  it('devolve null assim que o texto deixa de corresponder ao item', () => {
    expect(catalogLibraryId(item(), 'Outra música', 'Tom Jobim')).toBeNull();
  });

  // Entrada do catálogo da plataforma que ESTE músico ainda não tem: legítima,
  // e o pedido segue por título e artista.
  it('devolve null quando o músico ainda não tem a música na biblioteca', () => {
    expect(catalogLibraryId(item({ library_id: null }), 'Garota de Ipanema', 'Tom Jobim')).toBeNull();
  });

  it('devolve null quando o fã digitou tudo à mão', () => {
    expect(catalogLibraryId(null, 'Qualquer coisa', 'Alguém')).toBeNull();
  });
});
