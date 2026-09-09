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

// Destaque pago, como o MÚSICO o vê na fila.
//
// 🔴 `awaiting_payment` NÃO é dinheiro recebido: a cobrança existe, o fã ainda
// não pagou. A UI diz "a confirmar" — mesma disciplina que mantém `held_balance`
// fora de `balance` na carteira. `dedication` chega crua porque o músico
// precisa lê-la para decidir se aceita; quem redige para o público é o backend.
export type RequestBoostStatus =
  | 'promised'
  | 'awaiting_payment'
  | 'paid'
  | 'expired'
  | 'cancelled';

export interface RequestBoost {
  amount:      number;
  dedication:  string | null;
  status:      RequestBoostStatus;
  tip_id:      string | null;
  promised_at: string;
  charged_at:  string | null;
  paid_at:     string | null;
  cancellation_reason: string | null;
  is_boosting: boolean;
  is_public:   boolean;
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
  boost:      RequestBoost | null;
  is_boosted: boolean;
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

// POST /requests/batch-respond — teto espelhado de BATCH_RESPOND_MAX_ITEMS
// (batch-respond-to-requests.use-case.ts). Duplicado aqui de propósito: o
// cliente precisa bloquear a seleção ANTES de gastar a chamada, e o backend
// continua sendo quem decide (422 se passar).
export const BATCH_RESPOND_MAX_ITEMS = 50;

// Espelha o @MaxLength(500) de BatchRespondRequestsDto.rejection_reason.
// Truncar no cliente evita gastar a chamada inteira do lote — e o throttle
// dedicado da rota é de 6/min, então cada 422 evitado conta.
export const REJECTION_REASON_MAX_LENGTH = 500;

// A rota é BEST-EFFORT: um item que falha não anula os demais. Por isso o
// relatório vem particionado, e `failed` traz o motivo POR pedido — é o que
// permite à tela devolver só os que falharam para a fila, em vez de somem.
export interface BatchRespondFailure {
  request_id: string;
  reason:     string;
}

export interface BatchRespondResult {
  succeeded: MusicRequest[];
  failed:    BatchRespondFailure[];
}
