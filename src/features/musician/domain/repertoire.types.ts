// Espelha RepertoirePresenter/RepertoireOutput do backend (repertoire-module)
// campo a campo. Domínio puro, sem imports de RN/Expo.
//
// Não existe um agregado "Song" separado no backend — dentro de um
// repertório, uma música é um RepertoireSong (join row apontando pra um item
// da MusicLibrary via music_library_id), já com title/artist/duration
// denormalizados pelo servidor. Ver Docs/roadmap-mobile.md Bloco 7.

export interface RepertoireSong {
  song_id:                    string;
  music_library_id:           string;
  position:                   number;
  title:                      string;
  artist:                     string;
  custom_notes:                string | null;
  duration_override_seconds:  number | null;
  duration_seconds:           number | null;
  effective_duration_seconds: number | null;
  // Se o Play Mode tem letra/acordes para exibir. Vem calculado pelo backend
  // (RepertoireSongPresenter) — o app não deriva isso sozinho.
  has_chord_sheet:            boolean;
}

export interface RepertoireInvitee {
  id:          string;
  musician_id: string;
  invited_at:  string;
}

export interface Repertoire {
  repertoire_id:                    string;
  musician_id:                      string;
  name:                             string;
  songs:                            RepertoireSong[];
  song_count:                       number;
  estimated_show_duration_minutes:  number | null;
  is_shared:                        boolean;
  share_token:                      string | null;
  share_token_expires_at:           string | null;
  invitees:                         RepertoireInvitee[];
  created_at:                       string;
  updated_at:                       string;
}

export type RepertoireSortField = 'name' | 'created_at';
export type SortDirection = 'asc' | 'desc';
