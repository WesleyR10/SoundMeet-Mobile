import { boostStatusLabel, isBoostVisible } from '../request-boost.rules';
import type { RequestBoost, RequestBoostStatus } from '../request.types';

function makeBoost(overrides: Partial<RequestBoost> = {}): RequestBoost {
  return {
    amount: 10,
    dedication: null,
    status: 'promised',
    tip_id: null,
    promised_at: '2026-08-27T20:00:00.000Z',
    charged_at: null,
    paid_at: null,
    cancellation_reason: null,
    is_boosting: true,
    is_public: false,
    ...overrides,
  };
}

describe('boostStatusLabel', () => {
  /*
   * 🔴 O teste que existe para impedir a regressão mais cara deste fluxo:
   * transformar "a confirmar" em "recebido". Se alguém trocar a copy achando
   * que aceitar já é receber, isto falha.
   */
  it('nunca anuncia dinheiro recebido antes do pagamento', () => {
    const naoRecebidos: RequestBoostStatus[] = ['promised', 'awaiting_payment'];

    for (const status of naoRecebidos) {
      const label = boostStatusLabel(status);
      expect(label).toBe('a confirmar');
      expect(label).not.toMatch(/recebid|confirmado$/);
    }
  });

  it('só "paid" é confirmado', () => {
    expect(boostStatusLabel('paid')).toBe('confirmado');
  });

  it('estados terminais sem pagamento não viram destaque', () => {
    expect(boostStatusLabel('expired')).toBe('sem destaque');
    expect(boostStatusLabel('cancelled')).toBe('sem destaque');
  });
});

describe('isBoostVisible', () => {
  it('esconde pedido sem destaque', () => {
    expect(isBoostVisible(null)).toBe(false);
  });

  it('mostra enquanto o destaque vale', () => {
    expect(isBoostVisible(makeBoost({ status: 'promised' }))).toBe(true);
    expect(
      isBoostVisible(makeBoost({ status: 'paid', is_boosting: true })),
    ).toBe(true);
  });

  /*
   * `is_boosting` vem do backend e já considera o status — o teste garante que
   * a UI respeita esse campo em vez de reimplementar a regra.
   */
  it('esconde destaque vencido ou cancelado', () => {
    expect(
      isBoostVisible(makeBoost({ status: 'expired', is_boosting: false })),
    ).toBe(false);
    expect(
      isBoostVisible(makeBoost({ status: 'cancelled', is_boosting: false })),
    ).toBe(false);
  });
});
