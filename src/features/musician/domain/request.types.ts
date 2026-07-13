// Espelha RequestPresenter/RequestOutput do backend (requests-module) campo a
// campo. Domínio puro, sem imports de RN/Expo.

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'played';
export type RequestPriority = 'low' | 'medium' | 'high';

// earnedAt é camelCase mesmo — inconsistência real do presenter do backend
// (todo o resto do payload é snake_case). Tipado como está, não "corrigido".
export interface PointsValue {
  value:        number;
  source:       string;
  description?: string;
  metadata?:    Record<string, unknown>;
  earnedAt:     string;
}

export interface MusicRequest {
  id:          string;
  event_id:    string;
  audience_id: string;
  musician_id: string;
  library_id:  string | null;
  song_title:  string;
  artist:      string | null;
  message:     string | null;
  status:      RequestStatus;
  rejection_reason: string | null;
  votes_count: number;
  created_at:  string;
  updated_at:  string;
  played_at:    string | null;
  responded_at: string | null;
  is_pending:   boolean;
  is_accepted:  boolean;
  is_played:    boolean;
  is_rejected:  boolean;
  is_responded: boolean;
  has_message:  boolean;
  display_title: string;
  age_in_minutes: number;
  is_recent: boolean;
  is_old:    boolean;
  is_urgent: boolean;
  priority:  RequestPriority;
  points_value: PointsValue;
  is_special_request: boolean;
  can_be_accepted: boolean;
  can_be_rejected: boolean;
  is_within_response_time: boolean;
}

// GET /requests/musicians/:musician_id — resposta de MusicianRequestsPresenter
export interface MusicianRequestsResult {
  requests: MusicRequest[];
  total_count: number;
  pending_count: number;
}

export type RespondToRequestAction = 'accept' | 'reject';
