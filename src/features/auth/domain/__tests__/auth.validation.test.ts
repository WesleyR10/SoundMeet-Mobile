import {
  checkPasswordRules,
  completeCadastroSchema,
  loginSchema,
  passwordMeetsRules,
  registerSchema,
} from '../auth.validation';

describe('checkPasswordRules / passwordMeetsRules', () => {
  it('exige 8-72 caracteres, 1 maiúscula e 1 número — todas as regras satisfeitas', () => {
    const rules = checkPasswordRules('Senha123');
    expect(rules).toEqual({ hasLength: true, hasUppercase: true, hasNumber: true });
    expect(passwordMeetsRules('Senha123')).toBe(true);
  });

  it('reprova senha sem maiúscula', () => {
    expect(passwordMeetsRules('senha123')).toBe(false);
  });

  it('reprova senha sem número', () => {
    expect(passwordMeetsRules('SenhaForte')).toBe(false);
  });

  it('reprova senha curta demais (< 8 caracteres)', () => {
    expect(passwordMeetsRules('Abc123')).toBe(false);
  });

  it('reprova senha longa demais (> 72 caracteres)', () => {
    const tooLong = 'A1' + 'a'.repeat(71); // 73 caracteres
    expect(passwordMeetsRules(tooLong)).toBe(false);
  });

  it('aceita exatamente no limite de 72 caracteres', () => {
    const exactly72 = 'A1' + 'a'.repeat(70); // 72 caracteres
    expect(exactly72).toHaveLength(72);
    expect(passwordMeetsRules(exactly72)).toBe(true);
  });
});

describe('registerSchema — cpf/phone condicionais por role', () => {
  const base = {
    name: 'Fã Casual',
    email: 'fa@example.com',
    password: 'Senha123',
  };

  it('audience: cpf/phone vazios passam (sem fricção pro público casual)', () => {
    const result = registerSchema.safeParse({ ...base, role: 'audience', cpf: '', phone: '' });
    expect(result.success).toBe(true);
  });

  it('musician: cpf/phone vazios são rejeitados (anti multi-conta)', () => {
    const result = registerSchema.safeParse({ ...base, role: 'musician', cpf: '', phone: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toEqual(expect.arrayContaining(['cpf', 'phone']));
    }
  });

  it('musician: cpf/phone válidos passam', () => {
    const result = registerSchema.safeParse({
      ...base,
      role: 'musician',
      cpf: '529.982.247-25',
      phone: '(11) 99999-9999',
    });
    expect(result.success).toBe(true);
  });

  it('musician: CPF com dígito verificador inválido é rejeitado mesmo com formato correto', () => {
    const result = registerSchema.safeParse({
      ...base,
      role: 'musician',
      cpf: '529.982.247-26', // um dígito a mais que o CPF válido de teste
      phone: '(11) 99999-9999',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita e-mail malformado independente do role', () => {
    const result = registerSchema.safeParse({ ...base, email: 'nao-e-email', role: 'audience', cpf: '', phone: '' });
    expect(result.success).toBe(false);
  });

  it('rejeita nome vazio', () => {
    const result = registerSchema.safeParse({ ...base, name: '  ', role: 'audience', cpf: '', phone: '' });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema — sem regra de complexidade de senha', () => {
  it('aceita qualquer senha não vazia (não é regra de criação de conta)', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'x' });
    expect(result.success).toBe(true);
  });

  it('rejeita senha vazia', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('rejeita e-mail inválido', () => {
    const result = loginSchema.safeParse({ email: 'invalido', password: 'x' });
    expect(result.success).toBe(false);
  });
});

describe('completeCadastroSchema — login social pendente do músico', () => {
  it('exige CPF e celular válidos (mesma regra do cadastro por senha)', () => {
    const result = completeCadastroSchema.safeParse({
      cpf: '529.982.247-25',
      phone: '(11) 99999-9999',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita CPF inválido', () => {
    const result = completeCadastroSchema.safeParse({
      cpf: '111.111.111-11',
      phone: '(11) 99999-9999',
    });
    expect(result.success).toBe(false);
  });
});
