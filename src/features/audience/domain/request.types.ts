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
  // O músico tem conta de pagamento vinculada. `false` esconde o destaque pago
  // na tela — oferecer algo que a API vai recusar é pior que não oferecer.
  // Viaja aqui (e não no perfil) porque `musicians-module` não pode ler a
  // carteira sem criar ciclo com `PaymentModule`; ver o comentário no
  // `GetRequestSuggestionsUseCase`.
  accepts_tips: boolean;
}

// Estados do destaque pago. Espelha `RequestBoostStatusEnum` (backend).
// 🔴 A cobrança só nasce quando o MÚSICO aceita — antes disso é promessa, e
// nenhum centavo saiu da conta de ninguém. É o que dispensa estorno.
export type RequestBoostStatus =
  | 'promised'          // prometido; músico ainda não respondeu
  | 'awaiting_payment'  // aceito, cobrança PIX criada — hora de pagar
  | 'paid'              // confirmado; a dedicatória vira pública
  | 'expired'           // janela venceu sem pagamento
  | 'cancelled';        // recusado, ou cobrança não pôde ser criada

export interface RequestBoost {
  amount:      number;
  dedication:  string | null;
  status:      RequestBoostStatus;
  tip_id:      string | null;
  promised_at: string;
  charged_at:  string | null;
  paid_at:     string | null;
  cancellation_reason: string | null;
  // O que a UI deve consultar para decidir se mostra o selo — `expired` e
  // `cancelled` são pedidos comuns.
  is_boosting: boolean;
  is_public:   boolean;
}

// Cobrança do destaque — GET /requests/:id/boost/payment.
export interface RequestBoostPayment {
  request_id:      string;
  song_title:      string;
  artist:          string | null;
  amount:          number;
  dedication:      string | null;
  status:          RequestBoostStatus;
  tip_id:          string | null;
  qr_code:         string | null;
  copy_paste_code: string | null;
  expires_at:      string | null;
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
  // Destaque pago. Substitui o antigo `is_priority`, que era campo FANTASMA no
  // backend: o cliente mandava `true`, a API ecoava `true` e nada era
  // persistido. A prioridade real agora custa dinheiro e é verificada pelo
  // domínio.
  boost?: { amount: number; dedication?: string };
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
    boost?: {
      amount:      number;
      dedication:  string | null;
      status:      RequestBoostStatus;
      is_boosting: boolean;
    };
    requested_at: string;
    status: 'pending' | 'accepted' | 'rejected';
  };
}

export type VoteType = 'up' | 'down';

// Item de GET /requests/audiences/:audience_id (RequestPresenter). Só os
// campos que a Home do fã consome — o presenter devolve bem mais.
export interface AudienceRequest {
  id:         string;
  song_title: string;
  artist:     string | null;
  status:     'pending' | 'accepted' | 'rejected' | 'played';
  boost:      RequestBoost | null;
  is_boosted: boolean;
  created_at: string;
}
