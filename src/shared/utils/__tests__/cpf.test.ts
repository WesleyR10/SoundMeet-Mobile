import { formatCpf, isValidCpf, stripDigits } from '../cpf';

describe('stripDigits', () => {
  it('remove tudo que não é dígito', () => {
    expect(stripDigits('123.456.789-09')).toBe('12345678909');
    expect(stripDigits('(11) 99999-9999')).toBe('11999999999');
    expect(stripDigits('abc')).toBe('');
  });
});

describe('isValidCpf', () => {
  it('aceita um CPF válido conhecido (algoritmo módulo 11 correto)', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('52998224725')).toBe(true);
  });

  it('rejeita CPF com dígito verificador errado', () => {
    expect(isValidCpf('529.982.247-26')).toBe(false);
  });

  it('rejeita CPF com todos os dígitos iguais (mesmo passando no cálculo ingênuo)', () => {
    // 111.111.111-11 etc. são matematicamente "válidos" num cálculo módulo 11
    // solto — a checagem de dígitos repetidos existe exatamente pra barrar isso.
    expect(isValidCpf('111.111.111-11')).toBe(false);
    expect(isValidCpf('00000000000')).toBe(false);
  });

  it('rejeita comprimento diferente de 11 dígitos', () => {
    expect(isValidCpf('123456789')).toBe(false);
    expect(isValidCpf('123456789012')).toBe(false);
    expect(isValidCpf('')).toBe(false);
  });

  it('aceita tanto com máscara quanto só dígitos', () => {
    expect(isValidCpf('529.982.247-25')).toBe(isValidCpf('52998224725'));
  });
});

describe('formatCpf', () => {
  it('formata 11 dígitos crus no padrão 000.000.000-00', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
  });

  it('é idempotente sobre uma string já formatada', () => {
    expect(formatCpf('529.982.247-25')).toBe('529.982.247-25');
  });

  it('trunca em 11 dígitos — nunca formata além do CPF (proteção contra colar um CNPJ por engano)', () => {
    expect(formatCpf('5299822472599999')).toBe('529.982.247-25');
  });

  it('formata parcialmente durante a digitação (menos de 11 dígitos)', () => {
    expect(formatCpf('529')).toBe('529');
    expect(formatCpf('529982')).toBe('529.982');
    expect(formatCpf('529982247')).toBe('529.982.247');
  });
});
