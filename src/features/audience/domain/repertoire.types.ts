// Repertório PÚBLICO de um músico, visto por quem vai pedir uma música.
//
// Espelha `PublicMusicLibraryItemPresenter` (music-library-module) — que é uma
// allowlist explícita, não um `...output` com `delete`. O que NÃO existe aqui
// não é esquecimento: `chords`, `chord_sheet`, `renderable_chord_sheet`,
// `lyrics` e `notes` nunca saem daquela rota (risco de licenciamento no
// conteúdo de cifra; `notes` é anotação privada do músico). Se um campo desses
// aparecer na resposta um dia, é bug do backend — não adicionar aqui.
export interface PublicRepertoireItem {
  id:               string;
  musician_id:      string;
  title:            string;
  artist:           string;
  genre:            string | null;
  // 1 a 5. O backend o expõe para o fã "calibrar o pedido" — nunca revela cifra.
  difficulty:       number;
  duration_seconds: number | null;
}

export interface PublicRepertoirePage {
  data: PublicRepertoireItem[];
  meta: { current_page: number; per_page: number; last_page: number; total: number };
}
