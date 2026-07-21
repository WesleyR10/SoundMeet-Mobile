// Espelha AvailabilityPresenter / GetFreeBusyOutput do backend
// (scheduling-module) — agenda de disponibilidade do músico (item 9, jul/2026).

export interface AvailabilityRule {
  id:           string;
  /** 0 = domingo … 6 = sábado (convenção JS/Luxon `% 7` do backend). */
  weekday:      number;
  /** HH:mm no fuso do músico. */
  start_time:   string;
  end_time:     string;
  is_available: boolean;
}

export interface Unavailability {
  id:       string;
  start_at: string; // ISO
  end_at:   string; // ISO
  reason:   string | null;
}

export interface MusicianAvailability {
  id:                     string;
  musician_id:            string | null;
  timezone:               string;
  default_buffer_minutes: number;
  max_shows_per_day:      number | null;
  weekly_rules:           AvailabilityRule[];
  unavailabilities:       Unavailability[];
  is_active:              boolean;
}

/** Payload de PUT rules — substitui TODAS as regras semanais. */
export interface WeeklyRuleInput {
  weekday:      number;
  start_time:   string;
  end_time:     string;
  is_available: boolean;
}

export interface AddUnavailabilityPayload {
  start_at: string; // ISO
  end_at:   string; // ISO
  reason?:  string | null;
}

export interface BusyInterval {
  start_at:    string; // ISO
  end_at:      string; // ISO
  kind:        'booking' | 'unavailability';
  booking_id?: string;
  reason?:     string | null;
  status?:     string;
}

export interface FreeBusy {
  target_type: 'musician' | 'band';
  target_id:   string;
  start_at:    string;
  end_at:      string;
  busy:        BusyInterval[];
}

export const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const;
export const WEEKDAY_LABELS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;
