// Espelha SendTipPresenter/SendTipDto do payment-module (POST /tips) — NÃO o
// wrapper POST /audiences/:id/tips (audience-module), que não retorna
// qr_code/copy_paste_code. Ver soundmeet-mobile/Docs/roadmap-mobile.md 11.10.

// Espelha o enum PaymentMethod (backend, core/payment/domain/tip-enums.ts) —
// NÃO tem 'debit_card' (SendTipDto.payment_method é @IsEnum(PaymentMethod),
// um valor fora do enum causa 422).
export type TipPaymentMethod = 'pix' | 'credit_card' | 'wallet';

export interface SendTipPayload {
  musician_id: string;
  amount:      number;
  message?:    string;
  payment_method: TipPaymentMethod;
  event_id?:   string;
  is_anonymous?: boolean;
}

// qr_code / copy_paste_code vêm do Mercado Pago (Orders API) quando o
// músico tem conta vinculada; sem vínculo a API recusa com erro acionável.
export interface SendTipResult {
  id:     string;
  status: string;
  qr_code?:         string;
  copy_paste_code?: string;
}

export type TipStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// GET /tips/:id — visão do próprio pagador (AudienceTipPresenter no backend).
// Não confundir com a visão do músico na carteira, que é outro presenter.
export interface TipDetail {
  id:              string;
  status:          TipStatus;
  amount:          number;
  musician_id:     string | null;
  band_id:         string | null;
  event_id:        string | null;
  message:         string | null;
  qr_code:         string | null;
  copy_paste_code: string | null;
  created_at:      string;
  updated_at:      string;
}
