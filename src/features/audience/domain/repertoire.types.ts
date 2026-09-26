// Catálogo de músicas que o fã usa para escolher o que pedir.
//
// Espelha `SongCatalogItemPresenter` / `SongCatalogPresenter`
// (music-library-module) — que são allowlists explícitas, não `...entry`. O
// que NÃO existe aqui não é esquecimento: `chords`, `chord_sheet`,
// `renderable_chord_sheet`, `lyrics` e `notes` nunca saem daquela rota (risco
// de licenciamento no conteúdo de cifra; `notes` é anotação privada), e o
// DONO de cada linha também não — a resposta diz "a plataforma tem esta
// música", nunca "fulano toca esta música". Se um campo desses aparecer na
// resposta um dia, é bug do backend — não adicionar aqui.

/**
 * Onde a busca aconteceu — decidido pelo MÚSICO, no servidor.
 *
 * `platform`  — ele aceita pedidos de qualquer música; a busca varre tudo que
 *               a plataforma já cifrou.
 * `repertoire` — ele só aceita o próprio repertório.
 *
 * 🔴 A tela não escolhe o escopo, e não adianta tentar: mandar um pedido fora
 * do repertório de quem desligou o switch é recusado pelo servidor
 * (`CreateRequestUseCase`). O escopo aqui existe para EXPLICAR ao fã, não para
 * decidir nada.
 */
export type SongCatalogScope = 'platform' | 'repertoire';

export interface SongCatalogItem {
  title:  string;
  artist: string;
  genre:  string | null;
  /** Quantos músicos da plataforma têm a música. Não diz quais. */
  musicians_count: number;
  /**
   * A linha DESTE músico para a música, quando ele já a tem. É o que o pedido
   * envia em `library_id`. Nulo significa que ele ainda não a cadastrou — o
   * pedido segue por título e artista, e continua válido.
   */
  library_id: string | null;
}

export interface SongCatalogResponse {
  scope: SongCatalogScope;
  items: SongCatalogItem[];
}
