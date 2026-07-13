// Feature nova (jul/2026) — visualização de repertório compartilhado
// publicamente (link soundmeet://repertoire/shared/:token), acessível tanto
// por músico quanto por fã já logados (decisão: exige conta, mas não
// vínculo/relação com o dono do repertório — ver Docs/roadmap-mobile.md).
// Tipos próprios (não importados de features/musician/domain/
// repertoire.types.ts) — FSD proíbe uma feature importar de outra; mesmo
// precedente já usado em features/audience/domain/musician-public.types.ts.

export interface SharedRepertoireSong {
  song_id:                    string;
  music_library_id:           string;
  position:                   number;
  title:                      string;
  artist:                     string;
  custom_notes:                string | null;
  effective_duration_seconds: number | null;
}

export interface SharedRepertoire {
  repertoire_id:                    string;
  name:                             string;
  songs:                            SharedRepertoireSong[];
  song_count:                       number;
  estimated_show_duration_minutes:  number | null;
}
