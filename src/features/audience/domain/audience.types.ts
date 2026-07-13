// Espelha AudiencePresenter do backend (audiences-module) campo a campo.
// Domínio puro, sem imports de RN/Expo. Não importar de features/musician —
// mesmo havendo sobreposição conceitual (points/level/badges), cada feature
// mantém seu próprio tipo (regra FSD: nunca importar feature X de feature Y).

export interface AudiencePoints {
  total:         number;
  monthly:       number;
  last_updated:  string;
}

export interface AudienceLevel {
  level:      number;
  name:       string;
  min_points: number;
  max_points: number;
  benefits:   string[];
}

export interface AudiencePreferences {
  favorite_genres:       string[];
  favorite_artists:      string[];
  favorite_instruments:  string[];
  preferred_languages:   string[];
  notification_settings: Record<string, unknown> | null;
  privacy_settings:      Record<string, unknown> | null;
  music_discovery_settings: Record<string, unknown> | null;
}

export interface AudienceProfile {
  id:        string;
  email:     string;
  name:      string;
  nickname:  string | null;
  avatar:    string | null;
  phone:     string | null;
  badges?:   string[];
  points:    AudiencePoints;
  level:     AudienceLevel;
  preferences: AudiencePreferences;
  is_active: boolean;
  display_name: string;
  current_level: number;
  level_name:    string;
  points_to_next_level: number;
  max_requests_per_event: number;
  has_vip_access: boolean;
  can_access_exclusive_content: boolean;
  is_profile_complete: boolean;
  is_highly_engaged: boolean;
  is_new_user: boolean;
}

// Payload de PATCH /audiences/:id/complete-profile (onboarding progressivo,
// sem wizard — "Coleta de dados do fã" em roadmap-mobile.md).
export interface CompleteAudienceProfilePayload {
  name?:      string;
  nickname?:  string;
  avatar?:    string;
  phone?:     string;
  favorite_genres?:      string[];
  favorite_artists?:     string[];
  favorite_instruments?: string[];
  notification_settings?: Record<string, unknown>;
  privacy_settings?:       Record<string, unknown>;
  discovery_settings?:     Record<string, unknown>;
}

// Payload de POST /audiences/:id/scan-qr — qr_code precisa bater o regex
// soundmeet://musician/<uuid> (ScanQRUseCase, backend); ver QRScannerScreen.
export interface ScanQrPayload {
  qr_code:     string;
  musician_id?: string;
  establishment_id?: string;
  event_id?: string;
  location?: { latitude: number; longitude: number };
  metadata?: Record<string, unknown>;
}

// Espelha Points.toJSON() (backend, points.vo.ts) — ScanQRPresenter faz
// `points_earned = output.points_earned.toJSON()`, então é um objeto, não um
// número puro (ao contrário de MakeMusicRequestResult/SendTipResult, onde
// points_earned É um number — só o scan-qr usa o VO diretamente).
export interface PointsEarned {
  value:      number;
  source:     string;
  sourceDisplayName: string;
  description?: string;
  metadata?:  Record<string, unknown>;
  earnedAt:   string;
  isRecent:   boolean;
}

export interface ScanQrResult {
  audience:      AudienceProfile;
  points_earned: PointsEarned;
  new_badges:    string[];
  new_level?:    number;
  scan_metadata: {
    qr_code: string;
    musician_id?: string;
    establishment_id?: string;
    event_id?: string;
    location?: { latitude: number; longitude: number };
    scanned_at: string;
  };
}
