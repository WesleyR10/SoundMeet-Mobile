import { z } from 'zod';
import { isValidCnpj } from '@/shared/utils/cnpj';
import { isValidCpf, stripDigits } from '@/shared/utils/cpf';
import { isValidEmail } from '@/shared/utils/email';

/**
 * Dados do pagador no checkout de assinatura.
 *
 * 🔴 **O CPF não vem do perfil, e isso é do backend, não um esquecimento
 * daqui.** `MusicianPresenter` expõe `cnpj` (MEI) mas **nunca** o CPF — ele é
 * PII que o presenter não devolve nem para o dono. O nome e o e-mail são
 * pré-preenchidos; o documento tem que ser digitado.
 *
 * 🔴 **Validamos com dígito verificador, mais rígido que o backend.** Lá o
 * campo é `@Matches(/^[\d.\-/]{11,18}$/)` — regex frouxo, sem checksum, e o
 * `soundmeet-web` espelhou essa frouxidão. Aqui não: um CPF digitado errado
 * passa pelo backend, cria a assinatura no Asaas e falha **lá**, num momento em
 * que o músico já saiu do app e não tem como associar o erro ao que digitou.
 * Recusar antes é a diferença entre um campo vermelho e um upgrade que não
 * acontece sem explicação.
 */
export const checkoutPayerSchema = z.object({
  payer_name: z
    .string()
    .trim()
    .min(3, 'Informe o nome completo do pagador')
    .max(120, 'Nome muito longo'),
  payer_email: z
    .string()
    .trim()
    .refine(isValidEmail, 'E-mail inválido'),
  payer_cpf_cnpj: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const digits = stripDigits(value);
      // O campo aceita os dois documentos, então o comprimento é quem decide
      // qual checksum aplicar — `isValidCnpj` sozinho reprovaria todo CPF.
      if (digits.length === 11) {
        if (!isValidCpf(value)) ctx.addIssue({ code: 'custom', message: 'CPF inválido' });
        return;
      }
      if (digits.length === 14) {
        if (!isValidCnpj(value)) ctx.addIssue({ code: 'custom', message: 'CNPJ inválido' });
        return;
      }
      ctx.addIssue({ code: 'custom', message: 'Informe um CPF (11 dígitos) ou CNPJ (14)' });
    }),
});

export type CheckoutPayerForm = z.infer<typeof checkoutPayerSchema>;
