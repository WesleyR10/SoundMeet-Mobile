// Espelha EventPresenter/EventMusicianPresenter do backend (events-module).
// GET .../events, .../events/:id e .../events/:id/performers são @Public();
// POST .../events/:id/attendees aceita role audience via JWT (sem body).

export type EventStatus = 'draft' | 'active' | 'cancelled' | 'finished' | string;

export interface EventItem {
  id:               string;
  establishment_id: string;
  name:             string;
  description:      string | null;
  start_at:         string;
  end_at:           string;
  status:           EventStatus;
  max_capacity:     number | null;
  current_capacity: number;
  is_public:        boolean;
  cover_charge:     number | null;
}

// EventMusicianPresenter — performer escalado (músico ou banda) do evento.
export interface EventPerformer {
  id:          string;
  event_id:    string;
  musician_id: string | null;
  band_id:     string | null;
  fee:         number | null;
  status:      string;
  start_at:    string | null;
  end_at:      string | null;
}

export interface EventFilter {
  status?:    string;
  date_gte?:  string;
  date_lte?:  string;
  is_public?: boolean;
}
