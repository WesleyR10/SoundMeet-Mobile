// Espelha MusicLibraryPresenter do backend (music-library-module), só os
// campos que a UI de cifra pessoal precisa (título/artista pro
// enriquecimento de cards — ver personal-chord-sheet.types.ts — e
// has_chord_sheet pra saber se já existe cifra da IA pra forkar).

export interface MusicLibraryItem {
  id:              string;
  musician_id:     string;
  title:           string;
  artist:          string;
  genre:           string | null;
  display_name:    string;
  has_chord_sheet: boolean;
  is_hard:         boolean;
  created_at:      string;
  updated_at:      string;
}
