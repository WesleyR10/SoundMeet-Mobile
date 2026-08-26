// Custódia do cachê (F1.3a) — espelha `BookingEscrowPresenter`
// (`payment.presenter.ts`), lido por `GET /musicians/:id/wallet/escrow`.

/**
 * Estados da custódia.
 *
 * ```
 *   pending ──► held ──┬──► released
 *                      ├──► refunded
 *                      └──► disputed ──┬──► released
 *                                      └──► refunded
 * ```
 *
 * `disputed` **não** é terminal: contestação congela a liberação automática e
 * manda o caso para mediação, e mediação termina em alguém recebendo.
 */
export type EscrowStatus = 'pending' | 'held' | 'released' | 'refunded' | 'disputed';

/**
 * Uma custódia, do ponto de vista do músico.
 *
 * ⚠️ **Não existe `external_id` aqui, e isso é a feature.** É a referência da
 * cobrança na instituição de pagamento — a chave com que se libera e se estorna
 * dinheiro de verdade. O backend a remove no mapper de output; declarar o campo
 * aqui só criaria a expectativa de que ele deveria vir.
 */
export interface BookingEscrow {
  id:              string;
  booking_id:      string;
  /** Bruto acordado no contrato. */
  amount:          number;
  /** Comissão da plataforma — só vira receita na liberação. */
  platform_fee:    number;
  /** O que o músico recebe. É este valor que espelha em `held_balance`. */
  net_amount:      number;
  status:          EscrowStatus;
  /** ISO. Quando o pagamento entrou e ficou retido. */
  held_at:         string | null;
  released_at:     string | null;
  refunded_at:     string | null;
  /** ISO. Quando a liberação automática do provedor vence. */
  expires_at:      string | null;
  /** Motivo do estorno ou da contestação, quando houver. */
  resolution_note: string | null;
  created_at:      string;
}

export interface EscrowsPage {
  items:        BookingEscrow[];
  total:        number;
  current_page: number;
  last_page:    number;
  per_page:     number;
}
