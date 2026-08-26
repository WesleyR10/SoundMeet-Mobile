// Ponte Spotify do fã — espelha os presenters de `spotify.presenter.ts`.

/**
 * Status do vínculo.
 *
 * ⚠️ **Não existe token aqui, e isso é a feature.** O backend nunca expõe
 * access/refresh: quem renova é o servidor, e o cliente só precisa decidir
 * entre "Conectar" e "Salvar no Spotify".
 */
export interface SpotifyLinkStatus {
  linked:          boolean;
  /** Id público da conta autorizada, para o fã reconhecê-la. */
  spotify_user_id: string | null;
  linked_at:       string | null;
}

/** Uma faixa sugerida — o fã confirma antes de salvar. */
export interface SpotifyTrackCandidate {
  id:          string;
  title:       string;
  artist:      string;
  album:       string | null;
  artwork_url: string | null;
  preview_url: string | null;
}

/**
 * Resultado da busca.
 *
 * `linked` e `found` são estados distintos de propósito — a UI mostra
 * "conectar sua conta" para um e "não achamos essa faixa" para o outro.
 * Colapsar num `null` obrigaria a tela a adivinhar qual mensagem exibir.
 */
export interface SpotifyTrackSearchResult {
  linked: boolean;
  found:  boolean;
  track?: SpotifyTrackCandidate;
}

export interface SpotifySaveResult {
  linked: boolean;
  saved:  boolean;
}
