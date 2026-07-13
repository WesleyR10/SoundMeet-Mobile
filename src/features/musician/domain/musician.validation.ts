import { z } from 'zod';
import { isValidCpf } from '@/shared/utils/cpf';
import { isValidPhoneBr } from '@/shared/utils/phone';
import { isValidEmail } from '@/shared/utils/email';

export const STAGE_NAME_SOFT_MAX = 40;
export const BIO_SOFT_MAX        = 160;

export interface Step1FieldErrors {
  stageName?: string;
}

const step1Schema = z.object({
  stageName: z.string().trim()
    .min(1, 'Como o público vai te conhecer no palco?')
    .max(STAGE_NAME_SOFT_MAX, 'Nome artístico muito longo'),
});

// Assinatura preservada (consumida por useMusicianWizardHandlers.ts) — só o
// motor de validação virou Zod, o wizard em si (reducer multi-step + botão
// "Avançar" fora do form) não usa react-hook-form (ver nota em StepFourPix).
export function validateStep1(stageName: string, bio: string): Step1FieldErrors {
  void bio; // sem regra própria além do soft cap exibido no contador (truncado no onChangeText)
  const result = step1Schema.safeParse({ stageName });
  if (result.success) return {};
  return { stageName: result.error.issues[0]?.message };
}

export function step2IsValid(instruments: string[], genres: string[]): boolean {
  return instruments.length >= 1 && genres.length >= 1;
}

export type PixKeyType = 'cpf' | 'phone' | 'email' | 'random';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const pixKeySchema = z.object({
  pixKeyType: z.enum(['cpf', 'phone', 'email', 'random']),
  pixKey:     z.string().trim().min(1, 'Informe a chave PIX'),
}).superRefine((data, ctx) => {
  switch (data.pixKeyType) {
    case 'cpf':
      if (!isValidCpf(data.pixKey)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CPF inválido', path: ['pixKey'] });
      }
      break;
    case 'phone':
      if (!isValidPhoneBr(data.pixKey)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Celular inválido', path: ['pixKey'] });
      }
      break;
    case 'email':
      if (!isValidEmail(data.pixKey)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'E-mail inválido', path: ['pixKey'] });
      }
      break;
    case 'random':
      if (!UUID_RE.test(data.pixKey)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Chave aleatória inválida', path: ['pixKey'] });
      }
      break;
  }
});

export function validatePixKey(type: PixKeyType, value: string): string | null {
  const result = pixKeySchema.safeParse({ pixKeyType: type, pixKey: value });
  if (result.success) return null;
  return result.error.issues[0]?.message ?? null;
}

export const BIO_EXTENDED_MAX  = BIO_SOFT_MAX;
export const PRICE_NOTES_MAX   = 120;

// Tela standalone (1 form, 1 submit) → Zod + react-hook-form, padrão de
// LoginScreen/RegisterScreen (item 1.21 do roadmap-mobile). priceMin/priceMax
// ficam como string (valor bruto do TextInput) e só viram number no adapter de
// submit do EditProfileScreen — evita gymnastics de coerce em campo condicional
// (só obrigatório quando priceModel !== null). Único separador decimal aceito
// é "." (o teclado decimal-pad não expõe tecla de vírgula) — sem suporte a
// separador de milhar, para não ambiguar "1.500" (mil e quinhentos vs. 1,5).
export const editProfileSchema = z.object({
  stageName: z.string().trim()
    .min(1, 'Como o público vai te conhecer no palco?')
    .max(STAGE_NAME_SOFT_MAX, 'Nome artístico muito longo'),
  bio: z.string().trim().max(BIO_EXTENDED_MAX, 'Bio muito longa').optional().or(z.literal('')),
  // Sem z.coerce aqui: o stepper de EditExperienceSection já entrega number
  // direto via field.onChange (nunca vem de um TextInput) — coerce criaria
  // um descompasso entre o tipo de entrada e saída do schema no zodResolver.
  experienceYears: z.number().min(0, 'Não pode ser negativo').max(100, 'Valor muito alto'),
  priceModel: z.enum(['per_hour', 'per_event']).nullable(),
  priceMin:   z.string().trim(),
  priceMax:   z.string().trim(),
  priceNotes: z.string().trim().max(PRICE_NOTES_MAX, 'Nota muito longa').optional().or(z.literal('')),
  instagram: z.string().trim().optional().or(z.literal('')),
  youtube:   z.string().trim().optional().or(z.literal('')),
  spotify:   z.string().trim().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (!data.priceModel) return;

  const min = Number(data.priceMin);
  const max = Number(data.priceMax);

  if (!data.priceMin || Number.isNaN(min) || min < 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe um valor mínimo válido', path: ['priceMin'] });
  }
  if (!data.priceMax || Number.isNaN(max) || max < 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe um valor máximo válido', path: ['priceMax'] });
  }
  if (!Number.isNaN(min) && !Number.isNaN(max) && max < min) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'O valor máximo deve ser maior ou igual ao mínimo', path: ['priceMax'] });
  }
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;

// Seção "Localização" do accordion (Bloco 2) salva sozinha, fora do RHF do
// editProfileSchema — mesma filosofia de pixKeySchema/validatePixKey (estado
// local simples em useEditLocationSection.ts, não outro campo do form grande).
export interface LocationFieldErrors {
  state?: string;
}

const locationSchema = z.object({
  city:  z.string().trim().max(80, 'Nome de cidade muito longo').optional().or(z.literal('')),
  state: z.string().trim().max(2, 'Use a sigla do estado (ex.: SP)').optional().or(z.literal('')),
});

export function validateLocation(city: string, state: string): LocationFieldErrors {
  const result = locationSchema.safeParse({ city, state });
  if (result.success) return {};
  const stateIssue = result.error.issues.find((i) => i.path[0] === 'state');
  return { state: stateIssue?.message };
}
