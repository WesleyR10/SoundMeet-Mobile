// Espelha EstablishmentPresenter/EstablishmentProfilePresenter do backend
// (establishments-module). GET /establishments e GET /establishments/:id são
// @Public() — não exigem role audience, mas o fã é quem consome no mobile.

export type EstablishmentType = 'bar' | 'restaurant' | 'club';

export interface EstablishmentPriceRange {
  model:    'per_hour' | 'per_event';
  min:      number;
  max:      number;
  currency: string;
  notes:    string | null;
}

export interface EstablishmentMenuPdf {
  id:          string;
  url:         string;
  uploaded_at: string;
}

export interface EstablishmentProfile {
  id:               string;
  establishment_id: string;
  capacity:         number | null;
  location:         Record<string, unknown>;
  amenities:        string[];
  preferred_genres: string[];
  operating_hours:  Record<string, unknown> | null;
  price_range:      EstablishmentPriceRange | null;
  social_links:     Record<string, unknown> | null;
  menu_pdfs:        EstablishmentMenuPdf[];
}

export interface Establishment {
  id:          string;
  name:        string;
  description: string | null;
  avatar:      string | null;
  email:       string;
  phone:       string | null;
  website:     string | null;
  establishment_type: EstablishmentType;
  rating:        number;
  total_ratings: number;
  is_active:     boolean;
  is_verified:   boolean;
  is_open_now:   boolean;
  profile:       EstablishmentProfile | null;
  is_highly_rated: boolean;
  is_popular:      boolean;
  is_bar:          boolean;
  is_restaurant:   boolean;
  is_club:         boolean;
}

// Espelha EstablishmentFilter (backend) — passado como `filter[...]` na
// query (nested object, não params soltos). Geo/raio implementado no backend
// em jul/2026 (roadmap 7.13): lat+lng+radius_km juntos ativam o filtro por
// proximidade e a ordenação por distância.
export interface EstablishmentFilter {
  name?:             string;
  location_city?:    string;
  amenities?:        string[];
  preferred_genres?: string[];
  capacity_min?:     number;
  capacity_max?:     number;
  is_verified?:      boolean;
  lat?:              number;
  lng?:              number;
  radius_km?:        number;
}

export interface EstablishmentListParams {
  page?:     number;
  per_page?: number;
  sort?:     string;
  sort_dir?: 'asc' | 'desc';
  filter?:   EstablishmentFilter;
}

export interface PaginationMeta {
  current_page: number;
  per_page:     number;
  last_page:    number;
  total:        number;
}
