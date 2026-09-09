import {
  canSubmitBatch,
  pruneSelection,
  summarizeBatchOutcome,
} from '../request-batch.rules';
import { BATCH_RESPOND_MAX_ITEMS } from '../request.types';
import type { BatchRespondResult, MusicRequest } from '../request.types';

function makeResult(overrides: Partial<BatchRespondResult> = {}): BatchRespondResult {
  return { succeeded: [], failed: [], ...overrides };
}

// Só o id importa para estas regras — o resto do MusicRequest é ruído aqui.
const req = (id: string) => ({ id }) as MusicRequest;

describe('summarizeBatchOutcome', () => {
  /*
   * 🔴 O teste que existe para impedir a regressão mais cara desta tela:
   * tratar 200 como "todos responderam". A rota é best-effort e devolve 200
   * com `failed` preenchido — se alguém "simplificar" isto para um booleano,
   * o músico perde os pedidos que continuaram pendentes e não fica sabendo.
   */
  it('não considera sucesso um lote com falhas, mesmo com succeeded preenchido', () => {
    const outcome = summarizeBatchOutcome(
      makeResult({
        succeeded: [req('a'), req('b')],
        failed: [{ request_id: 'c', reason: 'Pedido já respondido.' }],
      }),
    );

    expect(outcome.allSucceeded).toBe(false);
    expect(outcome.failures).toEqual({ c: 'Pedido já respondido.' });
    expect(outcome.retryIds).toEqual(['c']);
  });

  it('preserva o motivo de CADA pedido, não só a contagem', () => {
    const outcome = summarizeBatchOutcome(
      makeResult({
        failed: [
          { request_id: 'a', reason: 'Pedido já respondido.' },
          { request_id: 'b', reason: 'Pedido expirado.' },
        ],
      }),
    );

    expect(outcome.failures).toEqual({
      a: 'Pedido já respondido.',
      b: 'Pedido expirado.',
    });
    expect(outcome.retryIds).toEqual(['a', 'b']);
  });

  it('só encerra a seleção quando o lote inteiro passa', () => {
    const outcome = summarizeBatchOutcome(makeResult({ succeeded: [req('a'), req('b')] }));

    expect(outcome.allSucceeded).toBe(true);
    expect(outcome.retryIds).toEqual([]);
    expect(outcome.failures).toEqual({});
  });

  it('lote inteiro falhando não vira sucesso por succeeded vazio', () => {
    const outcome = summarizeBatchOutcome(
      makeResult({ failed: [{ request_id: 'a', reason: 'Pedido de outro músico.' }] }),
    );

    expect(outcome.allSucceeded).toBe(false);
  });
});

describe('pruneSelection', () => {
  it('descarta selecionados que sumiram da fila', () => {
    const pruned = pruneSelection(new Set(['a', 'b', 'c']), ['a', 'c']);
    expect([...pruned]).toEqual(['a', 'c']);
  });

  it('devolve seleção vazia quando a fila esvazia', () => {
    expect([...pruneSelection(new Set(['a']), [])]).toEqual([]);
  });

  it('não inventa seleção a partir da fila', () => {
    // Pedido novo chegando durante o show não pode entrar num lote que o
    // músico nunca marcou.
    expect([...pruneSelection(new Set(['a']), ['a', 'novo'])]).toEqual(['a']);
  });
});

describe('canSubmitBatch', () => {
  it('recusa lote vazio — @ArrayMinSize(1) devolveria 422 e nada seria respondido', () => {
    expect(canSubmitBatch(0)).toBe(false);
  });

  it(`aceita exatamente ${BATCH_RESPOND_MAX_ITEMS} e recusa um a mais`, () => {
    expect(canSubmitBatch(BATCH_RESPOND_MAX_ITEMS)).toBe(true);
    expect(canSubmitBatch(BATCH_RESPOND_MAX_ITEMS + 1)).toBe(false);
  });

  it('aceita o lote mínimo', () => {
    expect(canSubmitBatch(1)).toBe(true);
  });
});
