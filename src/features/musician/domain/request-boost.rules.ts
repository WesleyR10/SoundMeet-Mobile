import type { RequestBoost, RequestBoostStatus } from './request.types';

/**
 * Como o destaque é rotulado no card do músico.
 *
 * 🔴 A regra que esta função existe para travar: **`awaiting_payment` nunca é
 * "recebido"**. Nesse estado a cobrança existe e o fã ainda não pagou —
 * anunciar como receita é a mesma falha que somar `held_balance` ao saldo
 * sacável da carteira, e num card no meio do show ninguém iria conferir.
 *
 * Fica no domínio (e não dentro do componente) porque é uma regra de negócio
 * sobre dinheiro, e este projeto não tem biblioteca de teste de componente —
 * dentro do JSX ela seria intestável e um ajuste de copy poderia inverter o
 * sentido sem nada falhar.
 */
export function boostStatusLabel(status: RequestBoostStatus): string {
  switch (status) {
    case 'paid':
      return 'confirmado';
    case 'promised':
    case 'awaiting_payment':
      return 'a confirmar';
    case 'expired':
    case 'cancelled':
      // Estes nem chegam a ser exibidos (ver `isBoostVisible`), mas um rótulo
      // honesto aqui evita que um call site novo invente outro.
      return 'sem destaque';
  }
}

/**
 * O selo de destaque deve aparecer?
 *
 * `expired` e `cancelled` são pedidos comuns: mostrar o selo daria crédito
 * visual por uma posição que ninguém pagou.
 */
export function isBoostVisible(boost: RequestBoost | null): boolean {
  return boost?.is_boosting === true;
}
