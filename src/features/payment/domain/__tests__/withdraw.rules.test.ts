import type { Wallet } from '../tip.types';
import {
  getWithdrawAvailability,
  newIdempotencyKey,
  parseWithdrawAmount,
  shouldReuseIdempotencyKey,
} from '../withdraw.rules';

function makeWallet(overrides: Partial<Wallet> = {}): Wallet {
  return {
    id: 'wallet-1',
    musician_id: 'musician-1',
    balance: 300,
    total_earned: 900,
    total_withdrawn: 600,
    pix_key: 'joao@exemplo.com',
    held_balance: 0,
    mp_linked: true,
    min_withdrawal_amount_brl: 50,
    withdrawal_days: 2,
    ...overrides,
  };
}

describe('getWithdrawAvailability', () => {
  it('libera quando há chave PIX e saldo acima do mínimo', () => {
    expect(getWithdrawAvailability(makeWallet())).toEqual({
      blocker: null,
      maxAmount: 300,
      minAmount: 50,
    });
  });

  it('bloqueia por falta de chave PIX antes de qualquer regra de valor', () => {
    // A ordem importa: sem destino, "saldo insuficiente" mandaria o músico
    // esperar dinheiro entrar quando o que falta é cadastrar a chave.
    const wallet = makeWallet({ pix_key: null, balance: 0 });
    expect(getWithdrawAvailability(wallet).blocker).toBe('no-pix-key');
  });

  it('distingue saldo zerado de saldo abaixo do mínimo', () => {
    expect(getWithdrawAvailability(makeWallet({ balance: 0 })).blocker).toBe('no-balance');
    expect(getWithdrawAvailability(makeWallet({ balance: 10 })).blocker).toBe('below-minimum');
  });

  /*
   * 🔴 O teste que protege a invariante mais cara da carteira: cachê em
   * custódia não é sacável. Se alguém somar `held_balance` ao teto achando que
   * é "o dinheiro do músico", o app passa a oferecer um saque que o provedor
   * recusa — e isto falha.
   */
  it('NUNCA soma held_balance ao teto sacável', () => {
    const wallet = makeWallet({ balance: 40, held_balance: 500 });
    const availability = getWithdrawAvailability(wallet);
    expect(availability.maxAmount).toBe(40);
    expect(availability.blocker).toBe('below-minimum');
  });
});

describe('parseWithdrawAmount', () => {
  const availability = getWithdrawAvailability(makeWallet());

  it('aceita inteiro, vírgula e ponto como separador decimal', () => {
    // O `decimal-pad` manda separador diferente por plataforma — o usuário
    // não escolheu qual.
    expect(parseWithdrawAmount('100', availability)).toEqual({ ok: true, value: 100 });
    expect(parseWithdrawAmount('99,90', availability)).toEqual({ ok: true, value: 99.9 });
    expect(parseWithdrawAmount('99.90', availability)).toEqual({ ok: true, value: 99.9 });
  });

  /*
   * 🔴 Três casas decimais derrubariam o `Money` do backend com
   * `InvalidMoneyError`, e o erro que chegaria à tela seria de validação de
   * agregado — não uma frase acionável.
   */
  it('recusa mais de duas casas decimais', () => {
    expect(parseWithdrawAmount('10,999', availability)).toEqual({
      ok: false,
      reason: 'too-many-decimals',
    });
  });

  it('recusa vazio, texto e valores não positivos', () => {
    expect(parseWithdrawAmount('   ', availability).ok).toBe(false);
    expect(parseWithdrawAmount('abc', availability)).toEqual({ ok: false, reason: 'not-a-number' });
    expect(parseWithdrawAmount('-10', availability)).toEqual({ ok: false, reason: 'not-a-number' });
    expect(parseWithdrawAmount('0', availability)).toEqual({ ok: false, reason: 'not-a-number' });
  });

  it('recusa abaixo do mínimo do plano e acima do saldo', () => {
    expect(parseWithdrawAmount('49,99', availability)).toEqual({
      ok: false,
      reason: 'below-minimum',
    });
    expect(parseWithdrawAmount('300,01', availability)).toEqual({
      ok: false,
      reason: 'above-balance',
    });
  });

  it('aceita exatamente o mínimo e exatamente o saldo', () => {
    expect(parseWithdrawAmount('50', availability)).toEqual({ ok: true, value: 50 });
    expect(parseWithdrawAmount('300', availability)).toEqual({ ok: true, value: 300 });
  });
});

describe('newIdempotencyKey', () => {
  it('não repete entre chamadas no mesmo milissegundo', () => {
    const keys = new Set(Array.from({ length: 500 }, () => newIdempotencyKey()));
    expect(keys.size).toBe(500);
  });

  /*
   * 🔴 A chave não pode ser derivável de dado público. O backend procura por
   * ela SEM escopo de músico, então uma chave previsível permitiria colidir de
   * propósito com o saque de outra pessoa.
   */
  it('não contém dado derivável do músico nem do valor', () => {
    const key = newIdempotencyKey();
    expect(key).toMatch(/^wd_[a-z0-9]+_[a-z0-9]{10,}$/);
  });
});

describe('shouldReuseIdempotencyKey', () => {
  /*
   * 🔴 O par de testes que sustenta o fluxo inteiro. Trocar os dois lados
   * reabre o pagamento duplicado que o SM-023 fechou no backend.
   */
  it('reusa a chave quando o servidor não respondeu (a transferência pode ter saído)', () => {
    expect(shouldReuseIdempotencyKey(new Error('Network Error'))).toBe(true);
    expect(shouldReuseIdempotencyKey({ message: 'timeout of 15000ms exceeded' })).toBe(true);
  });

  it('descarta a chave quando o servidor recusou de forma conclusiva', () => {
    expect(shouldReuseIdempotencyKey({ response: { status: 422 } })).toBe(false);
    expect(shouldReuseIdempotencyKey({ response: { status: 409 } })).toBe(false);
  });
});
