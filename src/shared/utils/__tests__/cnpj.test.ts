import { formatCnpj, isValidCnpj } from '../cnpj';

describe('isValidCnpj', () => {
  it('aceita CNPJ com dígitos verificadores corretos', () => {
    expect(isValidCnpj('11222333000181')).toBe(true);
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
  });

  it('recusa dígito verificador errado', () => {
    expect(isValidCnpj('11222333000199')).toBe(false);
  });

  it('recusa comprimento diferente de 14', () => {
    expect(isValidCnpj('1122233300018')).toBe(false);
    expect(isValidCnpj('112223330001811')).toBe(false);
    expect(isValidCnpj('')).toBe(false);
  });

  // Sequência repetida passa na conta dos dígitos mas não é CNPJ real —
  // mesma armadilha tratada em isValidCpf.
  it('recusa sequência de dígitos repetidos', () => {
    expect(isValidCnpj('11111111111111')).toBe(false);
    expect(isValidCnpj('00000000000000')).toBe(false);
  });

  it('recusa CPF informado no campo de CNPJ', () => {
    expect(isValidCnpj('52998224725')).toBe(false);
  });
});

describe('formatCnpj', () => {
  it('aplica a máscara completa', () => {
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('mascara parcialmente enquanto o usuário digita', () => {
    expect(formatCnpj('11')).toBe('11');
    expect(formatCnpj('11222')).toBe('11.222');
    expect(formatCnpj('112223330')).toBe('11.222.333/0');
  });

  it('descarta o que passar de 14 dígitos', () => {
    expect(formatCnpj('1122233300018199')).toBe('11.222.333/0001-81');
  });

  it('ignora caracteres não numéricos', () => {
    expect(formatCnpj('11.222.333/0001-81')).toBe('11.222.333/0001-81');
  });
});
