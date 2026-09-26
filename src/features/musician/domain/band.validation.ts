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
 * Ano de formação ("tempo de estrada").
 *
 * 🔴 **O teto é o ANO CORRENTE, calculado a cada validação.** Um schema com
 * `.max(new Date().getFullYear())` fixaria o limite no momento em que o módulo
 * é carregado — e app mobile fica dias com o mesmo bundle na memória. Na virada
 * do ano o usuário passaria a receber "ano inválido" ao digitar o ano em que
 * está, e ninguém reproduziria isso em desenvolvimento.
 *
 * ⚠️ **Espelha `formation-year.ts` do backend.** Divergir aqui faz o app
 * recusar o que a API aceita (ou pior: aceitar o que ela recusa, e o usuário
 * leva 422 depois de preencher).
 */
export const FORMATION_YEAR_MIN = 1900;

export function formationYearMax(now: Date = new Date()): number {
  return now.getFullYear();
}

/**
 * Lê o que foi digitado e devolve o ano, `null` (apagar) ou uma mensagem.
 *
 * Campo de texto e não seletor de data: o dado é um ANO, e um date picker
 * pediria dia e mês que ninguém sabe — precisão falsa num campo que o
 * estabelecimento lê como credencial.
 */
export type FormationYearParse =
  | { ok: true; value: number | null }
  | { ok: false; message: string };

export function parseFormationYear(
  raw: string,
  now: Date = new Date(),
): FormationYearParse {
  const trimmed = raw.trim();

  // Vazio é "apagar", operação legítima: quem digitou errado precisa de
  // caminho de volta ao "não informado".
  if (trimmed === '') return { ok: true, value: null };

  // `Number` aceita "2019.5" e " 2019 "; a regex barra antes de chegar lá.
  if (!/^\d{4}$/.test(trimmed)) {
    return { ok: false, message: 'Digite o ano com 4 dígitos (ex.: 2019)' };
  }

  const year = Number(trimmed);
  const max = formationYearMax(now);

  if (year < FORMATION_YEAR_MIN) {
    return { ok: false, message: `O ano precisa ser ${FORMATION_YEAR_MIN} ou depois` };
  }

  if (year > max) {
    return { ok: false, message: 'A banda não pode ter se formado no futuro' };
  }

  return { ok: true, value: year };
}

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
