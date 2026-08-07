// Espelha UserBadgePresenter/UserPointsPresenter do backend (gamification-module)
// campo a campo. Fica em shared/ (não em features/musician/domain/) porque é
// consumido tanto pela Home do músico (Bloco 10) quanto, futuramente, pela
// Home/gamificação do fã (Bloco 11.11) — FSD proíbe features importarem
// infrastructure/ umas das outras.

export interface UserBadge {
  id:                  string;
  user_id:             string;
  badge_type:          string;
  progress:            number;
  is_unlocked:         boolean;
  unlocked_at:         string | null;
  progress_percentage: number;
  remaining_points:    number;
  badge_description:   string;
}

export interface UserLevelInfo {
  level:     number;
  name:      string;
  min_points: number;
  max_points: number | null;
  benefits:  string[];
}

export interface UserPoints {
  id:                  string;
  user_id:             string;
  total_points:        number;
  total_scans:         number;
  total_requests:      number;
  total_tips:          number;
  total_social_shares: number;
  current_level:       number;
  level_info:          UserLevelInfo;
  progress_to_next_level: number;
  is_top_fan:          boolean;
  is_active_supporter: boolean;
  // Só vêm preenchidos em GET /gamification/leaderboard (backend 7.16b) —
  // GET /gamification/users/:id/points (o próprio usuário) não populava e
  // continua sem popular, então undefined lá é esperado, não um bug.
  nickname?: string | null;
  avatar?:   string | null;
}
