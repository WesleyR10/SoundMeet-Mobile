// Tipos do fluxo de pedido musical visto pelo fã. Espelha
// MakeMusicRequestPresenter/RequestSuggestionsPresenter (audiences-module/
// requests-module) — não importa de features/musician/domain/request.types.ts
// (FSD: nunca importar feature X de feature Y), mesmo havendo sobreposição.

export interface SongRequestSuggestion {
  song_title: string;
  artist?:    string;
  count:      number;
}

export interface RequestSuggestionsResult {
  musician_id: string;
  genres:      string[];
  suggestions: SongRequestSuggestion[];
}

// Payload de POST /audiences/:id/music-requests — wrapper gamificado
// (cria o pedido + credita pontos numa chamada só). event_id é opcional no
// DTO mas OBRIGATÓRIO em runtime (CanMakeRequestPolicy exige participação no
// evento via attend-event antes) — ver SongRequestScreen.
export interface MakeMusicRequestPayload {
  musician_id: string;
  song_title:  string;
  artist_name: string;
  genre?:      string;
  difficulty?: string;
  event_id:    string;
  establishment_id?: string;
  message?:    string;
  is_priority?: boolean;
}

export interface MakeMusicRequestResult {
  points_earned: number;
  new_badges:    string[];
  new_level?:    number;
  request_metadata: {
    musician_id: string;
    song_title:  string;
    artist_name: string;
    genre?:      string;
    difficulty?: string;
    event_id?:   string;
    establishment_id?: string;
    message?:    string;
    is_priority?: boolean;
    requested_at: string;
    status: 'pending' | 'accepted' | 'rejected';
  };
}

export type VoteType = 'up' | 'down';
