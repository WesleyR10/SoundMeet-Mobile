import { formatPhoneBr, isValidPhoneBr, toE164Br } from '../phone';

describe('isValidPhoneBr', () => {
  it('aceita celular com 11 dígitos (DDD + 9 + 8 dígitos)', () => {
    expect(isValidPhoneBr('(11) 99999-9999')).toBe(true);
    expect(isValidPhoneBr('11999999999')).toBe(true);
  });

  it('aceita fixo com 10 dígitos (DDD + 8 dígitos)', () => {
    expect(isValidPhoneBr('(11) 3333-4444')).toBe(true);
  });

  it('rejeita menos de 10 dígitos', () => {
    expect(isValidPhoneBr('999999999')).toBe(false);
  });

  it('rejeita mais de 11 dígitos', () => {
    expect(isValidPhoneBr('119999999999')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(isValidPhoneBr('')).toBe(false);
  });
});

describe('formatPhoneBr', () => {
  it('formata celular (11 dígitos) como (DD) 9NNNN-NNNN', () => {
    expect(formatPhoneBr('11999999999')).toBe('(11) 99999-9999');
  });

  it('formata fixo (10 dígitos) como (DD) NNNN-NNNN', () => {
    expect(formatPhoneBr('1133334444')).toBe('(11) 3333-4444');
  });

  it('trunca em 11 dígitos', () => {
    expect(formatPhoneBr('119999999999999')).toBe('(11) 99999-9999');
  });

  it('é idempotente sobre uma string já formatada', () => {
    expect(formatPhoneBr('(11) 99999-9999')).toBe('(11) 99999-9999');
  });
});

describe('toE164Br', () => {
  it('prefixa +55 e mantém só os dígitos (formato exigido pelo PixKey do backend)', () => {
    expect(toE164Br('(11) 99999-9999')).toBe('+5511999999999');
  });

  it('aplica o mesmo prefixo mesmo já vindo em dígitos crus', () => {
    expect(toE164Br('11999999999')).toBe('+5511999999999');
  });
});
