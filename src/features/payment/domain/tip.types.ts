// Espelha TipStatus (backend, core/payment/domain/tip-enums.ts).
export type TipStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Espelha TipPresenter (payment.presenter.ts) — GET /musicians/:id/wallet/tips.
// Sem nome do fã: TipOutput só expõe audience_id; o nome só é resolvido pelo
// backend no payload de tip.received (notificação), não na listagem.
export interface Tip {
  id: string;
  audience_id: string;
  musician_id?: string | null;
  band_id?: string | null;
  event_id?: string | null;
  amount: number;
  message?: string | null;
  payment_method: 'pix' | 'credit_card' | 'wallet';
  status: TipStatus;
  is_anonymous: boolean;
  show_in_wall: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipsPage {
  items: Tip[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

// Espelha MusicianWalletPresenter (payment.presenter.ts) — GET /musicians/:id/wallet.
// Feature própria (não reaproveita MusicianWallet de features/musician — ver
// nota de arquitetura em wallet.api.ts): superset com os campos de
// elegibilidade de saque (Gate 4C.2, backend Bloco 5).
export interface Wallet {
  id: string;
  musician_id: string;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  pix_key: string | null;
  min_withdrawal_amount_brl: number;
  withdrawal_days: number;
}

export interface WithdrawEligibility {
  isEligible: boolean;
  missingAmount: number;
  minWithdrawalAmount: number;
  withdrawalDays: number;
}

export function getWithdrawEligibility(wallet: Wallet): WithdrawEligibility {
  const missingAmount = Math.max(0, wallet.min_withdrawal_amount_brl - wallet.balance);
  return {
    isEligible: missingAmount === 0,
    missingAmount,
    minWithdrawalAmount: wallet.min_withdrawal_amount_brl,
    withdrawalDays: wallet.withdrawal_days,
  };
}
