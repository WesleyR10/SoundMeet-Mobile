import { z } from 'zod';
import { isValidCpf } from '@/shared/utils/cpf';
import { isValidPhoneBr } from '@/shared/utils/phone';
import { isValidEmail } from '@/shared/utils/email';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export interface PasswordRuleStatus {
  hasLength:    boolean;
  hasUppercase: boolean;
  hasNumber:    boolean;
}

// Mantido em sincronia com a regex de RegisterInput.password no backend:
// 8-72 caracteres, ao menos 1 letra maiúscula e 1 número. Usado pelo
// PasswordStrengthHint (indicador ao vivo) — independente do schema abaixo.
export function checkPasswordRules(password: string): PasswordRuleStatus {
  return {
    hasLength:    password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber:    /[0-9]/.test(password),
  };
}

export function passwordMeetsRules(password: string): boolean {
  const rules = checkPasswordRules(password);
  return rules.hasLength && rules.hasUppercase && rules.hasNumber;
}

const PASSWORD_MESSAGE = `A senha precisa ter ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} caracteres, 1 maiúscula e 1 número`;

const emailField = z.string().refine(isValidEmail, 'E-mail inválido');

// cpf/phone só são obrigatórios para role "musician" — audience é público
// casual escaneando QR, sem fricção extra no cadastro. `role` não é campo
// editável do form (vem fixo do RoleSelectionScreen via defaultValues), só
// participa do schema pra condicionar a regra de cpf/phone.
export const registerSchema = z
  .object({
    name:     z.string().trim().min(1, 'Diga como podemos te chamar').max(120, 'Nome muito longo'),
    email:    emailField,
    password: z.string().refine(passwordMeetsRules, PASSWORD_MESSAGE),
    role:     z.enum(['musician', 'audience']),
    cpf:      z.string(),
    phone:    z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== 'musician') return;
    if (!isValidCpf(data.cpf)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CPF inválido', path: ['cpf'] });
    }
    if (!isValidPhoneBr(data.phone)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Celular inválido', path: ['phone'] });
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// Login não valida complexidade de senha — essa regra é de criação de conta,
// não de autenticação (espelha LoginInput do backend).

// Usado só pelo fluxo de login social pendente (músico) — mesma regra de
// obrigatoriedade de CPF/celular do cadastro por senha.
export const completeCadastroSchema = z.object({
  cpf:   z.string().refine(isValidCpf, 'CPF inválido'),
  phone: z.string().refine(isValidPhoneBr, 'Celular inválido'),
});

export type CompleteCadastroFormValues = z.infer<typeof completeCadastroSchema>;
