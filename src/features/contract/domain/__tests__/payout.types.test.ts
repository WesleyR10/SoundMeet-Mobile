import { payoutFeePercentage, type ContractPayout } from '../payout.types';

function payout(amount: number, platform_fee: number): ContractPayout {
  return { amount, platform_fee, net_amount: amount - platform_fee };
}

describe('payoutFeePercentage', () => {
  it('deriva o percentual dos valores congelados', () => {
    expect(payoutFeePercentage(payout(1500, 150))).toBe(10);
  });

  it('reflete uma taxa diferente da vigente hoje', () => {
    // O que vale para um show contratado é o percentual do dia da emissão. Se
    // a tabela mudou depois, é ESTE número que precisa aparecer na tela.
    expect(payoutFeePercentage(payout(1000, 80))).toBe(8);
  });

  it('não divide por zero em show de permuta', () => {
    expect(payoutFeePercentage(payout(0, 0))).toBe(0);
  });
});
