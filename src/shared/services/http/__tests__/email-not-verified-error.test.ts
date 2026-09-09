import { isEmailNotVerifiedError } from '../types';

// Função pura — mesmo nível de teste de `plan-limit-error.test.ts`.
//
// Existe porque a WithdrawSheet precisa distinguir "confirme seu e-mail" de
// qualquer outra recusa: a saída é REENVIAR o link, e "tentar novamente" nunca
// resolveria. O saque é a única ação do produto que tira dinheiro do sistema em
// definitivo, então é onde o gate mora.

function axiosError(status: number, data: Record<string, unknown> = {}) {
  return {
    isAxiosError: true,
    response: { status, data: { statusCode: status, message: 'x', ...data } },
  };
}

describe('isEmailNotVerifiedError', () => {
  it('reconhece 403 com code EMAIL_NOT_VERIFIED', () => {
    expect(isEmailNotVerifiedError(axiosError(403, { code: 'EMAIL_NOT_VERIFIED' }))).toBe(true);
  });

  /*
   * 🔴 O teste que importa. 403 sozinho é "proibido" genérico e sai de qualquer
   * ownership guard do backend. Se a checagem olhasse só o status, o app
   * ofereceria "reenviar e-mail" para quem tentou mexer no recurso de outra
   * pessoa — e o texto sugeriria que o problema é do e-mail dela.
   */
  it('NÃO confunde com um 403 comum de ownership', () => {
    expect(isEmailNotVerifiedError(axiosError(403))).toBe(false);
    expect(isEmailNotVerifiedError(axiosError(403, { code: 'OUTRA_COISA' }))).toBe(false);
  });

  it('não reage ao code certo com status errado', () => {
    // O par status+code é o contrato; um só dos dois não é o mesmo erro.
    expect(isEmailNotVerifiedError(axiosError(422, { code: 'EMAIL_NOT_VERIFIED' }))).toBe(false);
  });

  it('não confunde com 402 (limite de plano)', () => {
    expect(isEmailNotVerifiedError(axiosError(402))).toBe(false);
  });

  it('sobrevive a não-erros e a erro sem response', () => {
    expect(isEmailNotVerifiedError(null)).toBe(false);
    expect(isEmailNotVerifiedError(new Error('rede'))).toBe(false);
    expect(isEmailNotVerifiedError({ isAxiosError: true })).toBe(false);
  });
});
