import { getWithdrawEligibility, type Wallet } from '../tip.types';

function makeWallet(overrides: Partial<Wallet> = {}): Wallet {
  return {
    id: 'wallet-1',
    musician_id: 'musician-1',
    balance: 0,
    total_earned: 0,
    total_withdrawn: 0,
    pix_key: null,
    min_withdrawal_amount_brl: 110,
    withdrawal_days: 5,
    ...overrides,
  };
}

describe('getWithdrawEligibility', () => {
  it('não elegível quando o saldo está abaixo do mínimo — missingAmount é a diferença exata', () => {
    const wallet = makeWallet({ balance: 40, min_withdrawal_amount_brl: 110 });

    const result = getWithdrawEligibility(wallet);

    expect(result.isEligible).toBe(false);
    expect(result.missingAmount).toBe(70);
  });

  it('elegível quando o saldo é exatamente igual ao mínimo (limite inclusivo)', () => {
    const wallet = makeWallet({ balance: 110, min_withdrawal_amount_brl: 110 });

    const result = getWithdrawEligibility(wallet);

    expect(result.isEligible).toBe(true);
    expect(result.missingAmount).toBe(0);
  });

  it('elegível quando o saldo excede o mínimo — missingAmount nunca fica negativo', () => {
    const wallet = makeWallet({ balance: 500, min_withdrawal_amount_brl: 110 });

    const result = getWithdrawEligibility(wallet);

    expect(result.isEligible).toBe(true);
    expect(result.missingAmount).toBe(0);
  });

  it('reflete o mínimo/prazo do plano do músico (FREE R$110/5d vs PRO R$50/1d)', () => {
    const freeWallet = makeWallet({ balance: 60, min_withdrawal_amount_brl: 110, withdrawal_days: 5 });
    const proWallet = makeWallet({ balance: 60, min_withdrawal_amount_brl: 50, withdrawal_days: 1 });

    expect(getWithdrawEligibility(freeWallet).isEligible).toBe(false);
    const pro = getWithdrawEligibility(proWallet);
    expect(pro.isEligible).toBe(true);
    expect(pro.withdrawalDays).toBe(1);
  });

  it('missingAmount usa arredondamento de ponto flutuante consistente (centavos)', () => {
    const wallet = makeWallet({ balance: 34.9, min_withdrawal_amount_brl: 50 });

    const result = getWithdrawEligibility(wallet);

    expect(result.missingAmount).toBeCloseTo(15.1, 2);
  });
});
