import { BATCH_RESPOND_MAX_ITEMS } from './request.types';
import type { BatchRespondResult } from './request.types';

/**
 * Regras do modo "responder em lote".
 *
 * Moram no domínio, e não na tela, porque são exatamente as duas que decidem
 * se o músico recebe a verdade sobre o que aconteceu com a fila dele. A tela
 * só as aplica.
 */

export type BatchOutcome = {
  /** request_id -> motivo, para marcar cada card que não passou. */
  failures: Record<string, string>;
  /** Os que continuam pendentes — viram a nova seleção, prontos para retentar. */
  retryIds: string[];
  /** true só quando o lote inteiro passou; é o único caso que encerra a seleção. */
  allSucceeded: boolean;
};

/**
 * 🔴 A rota é best-effort e responde 200 mesmo com parte do lote falhando.
 * Tratar a resposta como sucesso binário é o defeito clássico deste padrão: o
 * músico acha que respondeu 30 e respondeu 27, e os 3 restantes seguem
 * pendentes sem ninguém saber.
 */
export function summarizeBatchOutcome(result: BatchRespondResult): BatchOutcome {
  const failures: Record<string, string> = {};
  for (const failure of result.failed) {
    failures[failure.request_id] = failure.reason;
  }

  return {
    failures,
    retryIds: result.failed.map((f) => f.request_id),
    allSucceeded: result.failed.length === 0,
  };
}

/**
 * Remove da seleção os pedidos que sumiram da fila — respondidos noutro
 * aparelho, expirados, recarregados. Sem isso a barra conta itens que não
 * estão na tela e o próximo lote gasta uma das 6 chamadas/min do throttle
 * carregando ids condenados a falhar.
 */
export function pruneSelection(selected: Set<string>, aliveIds: Iterable<string>): Set<string> {
  const alive = new Set(aliveIds);
  return new Set([...selected].filter((id) => alive.has(id)));
}

/**
 * O lote pode ser enviado? Espelha `@ArrayMinSize(1)` e
 * `@ArrayMaxSize(BATCH_RESPOND_MAX_ITEMS)` do `BatchRespondRequestsDto`: fora
 * dessa faixa o backend devolve 422 e NENHUM pedido é respondido.
 */
export function canSubmitBatch(count: number): boolean {
  return count >= 1 && count <= BATCH_RESPOND_MAX_ITEMS;
}
