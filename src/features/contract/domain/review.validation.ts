import { z } from 'zod';
import type { ReviewableBooking } from './review.types';

/**
 * Avaliação do estabelecimento. Espelha `SubmitReviewDto` do backend — nota
 * inteira de 1 a 5 e comentário de até 1000 caracteres.
 *
 * O comentário é opcional de propósito: exigir texto derruba a taxa de resposta,
 * e a nota sozinha já move a média — que é o dado que ordena a busca.
 */
export const submitReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'Escolha de 1 a 5 estrelas.')
    .max(5, 'Escolha de 1 a 5 estrelas.'),
  comment: z
    .string()
    .trim()
    .max(1000, 'O comentário pode ter no máximo 1000 caracteres.')
    .optional(),
});

export type SubmitReviewForm = z.infer<typeof submitReviewSchema>;

/**
 * Dá para avaliar o estabelecimento deste show?
 *
 * Espelha `ReviewEligibilityService` do backend para não oferecer um botão que
 * o servidor recusaria com 403 — mesma decisão de `isActionable` nas propostas
 * e de `canSign` no contrato. São duas condições:
 *
 * 1. **Show concluído.** `completed` é o único status aceito como prova de
 *    vínculo; `confirmed` não conta, mesmo com a data já passada. Quem promove
 *    `confirmed → completed` é o job horário `CompleteConfirmedBookingsJob`, e
 *    a espera é de no máximo uma hora depois do fim do show.
 *
 * 2. 🔴 **Show individual, não de banda.** O backend deriva o autor do JWT
 *    (`author_id = musician.id`) e exige que ele seja uma das partes da
 *    reserva. Em show de banda a parte é o `band_id`, então NENHUM integrante
 *    passa na checagem — nem o líder. Não é caso de borda exótico: é todo show
 *    de banda, e oferecer o botão ali seria prometer uma ação que falha 100%
 *    das vezes.
 *
 *    Avaliação por banda depende de o backend aceitar o integrante como autor
 *    em nome dela; enquanto não aceita, a UI não finge que aceita.
 */
export function canReviewEstablishment(params: {
  booking:    ReviewableBooking | null;
  isBandShow: boolean;
}): boolean {
  if (params.isBandShow) return false;
  return params.booking?.status === 'completed';
}
