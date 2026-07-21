// Subconjunto de MusicianPresenter (backend) relevante pra visão readonly do
// fã — GET /musicians/:id é @Public(). Tipo próprio (não importado de
// features/musician/domain) porque FSD proíbe features importarem umas das
// outras; a duplicação estrutural com MusicianProfile (musician feature) é
// aceitável e intencional aqui.

export interface MusicianPublicPriceRange {
  model:    'per_hour' | 'per_event';
  min:      number;
  max:      number;
  currency: string;
  notes:    string | null;
}

export interface MusicianPublicSocialLinks {
  instagram?: string;
  youtube?:   string;
  spotify?:   string;
}

export interface MusicianPublicLocation {
  city?:      string | null;
  state?:     string | null;
  latitude?:  number | null;
  longitude?: number | null;
}

export interface MusicianPublicProfileDetails {
  price_ranges: MusicianPublicPriceRange[];
  social_links: MusicianPublicSocialLinks | null;
  location?:    MusicianPublicLocation | null;
  experience:   number;
  instruments:  string[];
  genres:       string[];
}

export interface MusicianPublic {
  id:          string;
  name:        string;
  stage_name:  string | null;
  bio:         string | null;
  avatar:      string | null;
  rating:        number;
  total_ratings: number;
  is_verified:   boolean;
  is_active:     boolean;
  genres:        string[];
  instruments:   string[];
  experience_years: number;
  display_name:     string;
  is_highly_rated:  boolean;
  profile: MusicianPublicProfileDetails | null;
}

// Espelha MusicianFilter (backend) — subset relevante pra busca do fã.
// lat+lng+radius_km juntos ativam o filtro por proximidade (7.13c) e a
// ordenação por distância, mesmo contrato de EstablishmentFilter.
export interface MusicianSearchFilter {
  name?:        string;
  stage_name?:  string;
  genres?:      string[];
  is_verified?: boolean;
  lat?:         number;
  lng?:         number;
  radius_km?:   number;
}

export interface MusicianListParams {
  page?:     number;
  per_page?: number;
  sort?:     string;
  sort_dir?: 'asc' | 'desc';
  filter?:   MusicianSearchFilter;
}
