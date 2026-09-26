import { describeLoginFailure, LOCKOUT_HINT_AFTER } from '../login-failure';

describe('describeLoginFailure', () => {
  it('401 fala de credencial, sem dizer qual das duas errou', () => {
    expect(describeLoginFailure(401, 1)).toBe('E-mail ou senha incorretos.');
  });

  it('a partir da terceira recusa seguida, menciona a proteção da conta', () => {
    expect(describeLoginFailure(401, LOCKOUT_HINT_AFTER - 1)).not.toMatch(/protegida/);
    expect(describeLoginFailure(401, LOCKOUT_HINT_AFTER)).toMatch(/protegida/);
  });

  it('429 pede para esperar — tentar de novo na hora só renova o bloqueio', () => {
    expect(describeLoginFailure(429, 0)).toMatch(/Espere um minuto/);
  });

  it('sem resposta é problema de rede, não de senha', () => {
    expect(describeLoginFailure(null, 0)).toMatch(/internet/);
  });

  it('5xx não culpa o usuário', () => {
    expect(describeLoginFailure(503, 0)).not.toMatch(/incorretos/);
  });
});
