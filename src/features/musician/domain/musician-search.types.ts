// Subconjunto mínimo de MusicianPresenter — só o que a busca de convite
// precisa mostrar (não é um "perfil público" completo como
// features/audience/domain/musician-public.types.ts, que serve outro caso
// de uso e não pode ser importado daqui — FSD proíbe cruzar features).
export interface MusicianSearchResult {
  id:           string;
  stage_name:   string | null;
  display_name: string;
  avatar:       string | null;
  instruments:  string[];
}
