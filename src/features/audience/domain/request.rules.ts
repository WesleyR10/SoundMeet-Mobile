import type { AudienceRequest, RequestBoostStatus } from './request.types';

/**
 * Como o pedido é rotulado no histórico do fã.
 *
 * Espelho intencional de `features/musician/domain/request-boost.rules.ts`, não
 * import: a regra de ouro do FSD proíbe `features/audience` importar de
 * `features/musician`, e as duas telas dizem coisas diferentes sobre o mesmo
 * dado — o músico lê "a confirmar" como *ele* vai receber, o fã lê como *ele*
 * ainda precisa pagar.
 *
 * Fica no domínio (e não no JSX) porque este projeto não tem biblioteca de
 * teste de componente: dentro do componente, um ajuste de copy poderia inverter
 * o sentido de um estado de dinheiro sem nada falhar.
 */

export type RequestTone = 'pending' | 'positive' | 'negative' | 'live';

export function requestStatusLabel(request: AudienceRequest): string {
  switch (request.status) {
    case 'pending':
      return 'Aguardando o músico';
    case 'accepted':
      return 'Aceito';
    case 'played':
      return 'Tocado';
    case 'rejected':
      return 'Recusado';
  }
}

export function requestStatusTone(request: AudienceRequest): RequestTone {
  switch (request.status) {
    case 'pending':
      return 'pending';
    case 'accepted':
      return 'positive';
    case 'played':
      return 'live';
    case 'rejected':
      return 'negative';
  }
}

/**
 * O que dizer sobre o destaque pago, do ponto de vista de quem prometeu o
 * valor. `null` = não há destaque a mostrar.
 *
 * 🔴 **`awaiting_payment` é uma AÇÃO PENDENTE DO FÃ, não um aviso.** É o único
 * estado em que existe cobrança e o dinheiro não saiu — dizer "destaque de
 * R$10" ali faria o fã acreditar que já pagou, e a dedicatória nunca subiria ao
 * palco. É por isso que esta função devolve `actionable`.
 *
 * 🔴 **`promised` também não é pago**, mas não é ação: a cobrança só nasce
 * quando o músico aceita. Cobrar antes disso seria cobrar por uma fila em que
 * ele talvez nem entre.
 */
export type BoostBadge = {
  label: string;
  amount: number;
  /** O fã precisa fazer algo agora (concluir o PIX)? */
  actionable: boolean;
};

export function boostBadge(request: AudienceRequest): BoostBadge | null {
  const boost = request.boost;
  if (!boost || !boost.is_boosting) return null;

  const label: Record<RequestBoostStatus, string | null> = {
    paid: 'Destaque confirmado',
    awaiting_payment: 'Conclua o PIX',
    promised: 'Destaque reservado',
    // `is_boosting` já filtra os dois abaixo; rótulo honesto para o caso de um
    // call site novo chegar aqui por outro caminho.
    expired: null,
    cancelled: null,
  };

  const text = label[boost.status];
  if (!text) return null;

  return {
    label: text,
    amount: boost.amount,
    actionable: boost.status === 'awaiting_payment',
  };
}
