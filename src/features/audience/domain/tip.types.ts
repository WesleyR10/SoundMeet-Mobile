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

// Gateway ainda é PixGatewayMock (roadmap.md Bloco 1.6) — qr_code/
// copy_paste_code não são uma cobrança PIX real ainda.
export interface SendTipResult {
  id:     string;
  status: string;
  qr_code?:         string;
  copy_paste_code?: string;
}
