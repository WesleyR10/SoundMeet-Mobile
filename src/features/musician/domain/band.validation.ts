import { z } from 'zod';

export const BAND_NAME_MAX = 60;
export const BAND_DESCRIPTION_MAX = 240;

/**
 * Criação de banda.
 *
 * Só o essencial: o backend aceita mais (`avatar`, `priceRange`, `address`,
 * `members`), mas cada um deles tem tela própria depois — e um formulário de
 * criação que peça tudo é onde o líder desiste antes de a banda existir.
 *
 * `genres` é obrigatório com pelo menos um item porque é o que faz a banda ser
 * **encontrável**: o filtro de descoberta do estabelecimento é `hasSome` sobre
 * esse array. Banda sem gênero nasce invisível para quem contrata, e o backend
 * não impõe o mínimo (`@IsArray()` aceita lista vazia).
 */
export const createBandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Dê um nome à banda')
    .max(BAND_NAME_MAX, `Máximo de ${BAND_NAME_MAX} caracteres`),
  description: z
    .string()
    .trim()
    .max(BAND_DESCRIPTION_MAX, `Máximo de ${BAND_DESCRIPTION_MAX} caracteres`)
    .optional(),
  genres: z.array(z.string()).min(1, 'Escolha pelo menos um gênero'),
});

export type CreateBandForm = z.infer<typeof createBandSchema>;

/**
 * Confirmação de dissolução.
 *
 * 🔴 `DELETE /bands/:id` é irreversível e o backend só checa liderança — nada
 * impede apagar por engano uma banda com histórico de shows. Exigir o nome
 * digitado é a única barreira entre um toque errado e a perda do registro;
 * comparação sem diferenciar maiúsculas porque o objetivo é provar intenção,
 * não testar digitação.
 */
export function confirmsBandDeletion(typed: string, bandName: string): boolean {
  return typed.trim().toLocaleLowerCase() === bandName.trim().toLocaleLowerCase();
}
