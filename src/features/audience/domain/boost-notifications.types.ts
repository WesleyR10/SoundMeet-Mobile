// Payloads do NotificationsGateway na direção do FÃ. Espelham
// `notification.payloads.ts` (backend, notifications-module).

// Músico aceitou um pedido com destaque — hora de pagar.
export interface RequestBoostPaymentReadyEvent {
  request_id:      string;
  tip_id:          string;
  musician_id:     string;
  song_title:      string;
  amount:          number;
  qr_code:         string | null;
  copy_paste_code: string | null;
  expires_at:      string | null;
  occurred_at:     string;
}

// Pagamento confirmado — gatilho da celebração. Traz a dedicatória porque a
// partir deste instante ela é pública.
export interface RequestBoostPaidEvent {
  request_id:  string;
  tip_id:      string;
  musician_id: string;
  song_title:  string;
  dedication:  string | null;
  amount:      number;
  occurred_at: string;
}

// Gorjeta avulsa confirmada (fora de um pedido).
//
// ⚠️ Um pedido com destaque dispara ESTE e `request.boost.paid`. O app
// deduplica por `tip_id` e fica com o primeiro que chegar — sem isso a
// celebração tocaria duas vezes.
export interface TipConfirmedEvent {
  tip_id:      string;
  musician_id: string | null;
  band_id:     string | null;
  amount:      number;
  message:     string | null;
  occurred_at: string;
}

// Forma normalizada que a celebração consome, venha de qual evento vier.
export interface CelebrationPayload {
  tip_id:      string;
  amount:      number;
  song_title:  string | null;
  dedication:  string | null;
  musician_id: string | null;
}
