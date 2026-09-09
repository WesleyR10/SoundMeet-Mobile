import type { Wallet } from './tip.types';

/**
 * Regras puras do saque PIX.
 *
 * Moram aqui, e não dentro do sheet, pelo mesmo motivo de
 * `features/musician/domain/request-boost.rules.ts`: são decisões sobre
 * dinheiro, o projeto não tem biblioteca de teste de componente, e dentro do
 * JSX elas seriam intestáveis — um ajuste de copy poderia inverter o sentido
 * sem nada falhar.
 */

/** Por que o saque não pode ser pedido agora. `null` = pode. */
export type WithdrawBlocker =
  | 'no-pix-key'
  | 'below-minimum'
  | 'no-balance';

export type WithdrawAvailability = {
  blocker: WithdrawBlocker | null;
  /** Teto do que cabe pedir: o saldo sacável, sempre em reais. */
  maxAmount: number;
  minAmount: number;
};

/**
 * O que o músico pode sacar agora.
 *
 * 🔴 **`held_balance` fica de fora, sempre.** Cachê em custódia é dinheiro
 * recebido e ainda não liberado; somá-lo aqui ofereceria um saque que o
 * provedor recusa — a mesma invariante que o backend guarda em
 * `MusicianWallet` (`held_balance` nunca entra em `balance`).
 *
 * A ordem dos impedimentos é a ordem em que o usuário consegue resolvê-los:
 * sem chave PIX não adianta falar de valor, porque não há destino.
 */
export function getWithdrawAvailability(wallet: Wallet): WithdrawAvailability {
  const minAmount = wallet.min_withdrawal_amount_brl;
  const maxAmount = wallet.balance;

  const blocker: WithdrawBlocker | null = !wallet.pix_key
    ? 'no-pix-key'
    : maxAmount <= 0
      ? 'no-balance'
      : maxAmount < minAmount
        ? 'below-minimum'
        : null;

  return { blocker, maxAmount, minAmount };
}

/** Por que o valor digitado não serve. `null` = serve. */
export type AmountRejection =
  | 'empty'
  | 'not-a-number'
  | 'too-many-decimals'
  | 'below-minimum'
  | 'above-balance';

export type ParsedAmount =
  | { ok: true; value: number }
  | { ok: false; reason: AmountRejection };

/**
 * Lê o valor digitado pelo músico.
 *
 * 🔴 **Mais de duas casas decimais é recusado aqui, não no servidor.** O
 * `Money` do backend lança `InvalidMoneyError` para `10.999`, e o erro que
 * chegaria à tela seria de validação de agregado, não uma frase que diga o que
 * fazer. Recusar antes é o que transforma isso em "use no máximo dois
 * centavos".
 *
 * Aceita vírgula **e** ponto porque o teclado numérico do Android manda ponto e
 * o do iOS manda vírgula no mesmo `decimal-pad` — o usuário não escolheu.
 */
export function parseWithdrawAmount(
  text: string,
  availability: WithdrawAvailability,
): ParsedAmount {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };

  const normalized = trimmed.replace(',', '.');
  if (!/^\d+(\.\d{0,})?$/.test(normalized)) {
    return { ok: false, reason: 'not-a-number' };
  }

  const decimals = normalized.split('.')[1];
  if (decimals && decimals.length > 2) {
    return { ok: false, reason: 'too-many-decimals' };
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, reason: 'not-a-number' };
  }

  if (value < availability.minAmount) return { ok: false, reason: 'below-minimum' };
  if (value > availability.maxAmount) return { ok: false, reason: 'above-balance' };

  return { ok: true, value };
}

/**
 * Uma chave de idempotência nova.
 *
 * 🔴 **Precisa ser IMPREVISÍVEL, não só única.** O backend procura a chave sem
 * escopo de músico (`findByIdempotencyKey`), então uma chave derivada de dado
 * público — `saque-<musician_id>-<valor>`, um contador — poderia colidir de
 * propósito com o saque de outra pessoa. Aleatoriedade aqui custa uma linha.
 *
 * Não é UUID porque a coluna é `String` e nenhuma lib de UUID está instalada;
 * `expo-crypto` seria dependência **nativa** nova, e o custo é um rebuild do
 * EAS por um identificador opaco.
 */
export function newIdempotencyKey(): string {
  const random = () => Math.random().toString(36).slice(2, 12);
  return `wd_${Date.now().toString(36)}_${random()}${random()}`;
}

/**
 * O pedido que falhou deve ser **reenviado com a mesma chave** ou tratado como
 * uma intenção nova?
 *
 * 🔴 É a pergunta mais importante deste fluxo, e a resposta não é intuitiva.
 * O backend **replica** qualquer transação que já exista com a chave — inclusive
 * uma que falhou. Então:
 *
 * - **sem resposta do servidor** (timeout, rede caindo, 5xx sem corpo): a
 *   transferência pode ter sido processada com a resposta perdida no caminho.
 *   Reenviar com a MESMA chave é o que devolve o saque original em vez de criar
 *   um segundo — é exatamente o caso para o qual a chave existe;
 * - **resposta conclusiva do servidor** (422 de valor, 409, 403): nada foi
 *   reservado, e insistir na mesma chave faria o servidor replicar a recusa
 *   para sempre. A próxima tentativa é uma intenção nova.
 *
 * Trocar os dois lados é o que reabre o pagamento duplicado pela porta dos
 * fundos, que é o defeito que o SM-023 fechou no backend.
 */
export function shouldReuseIdempotencyKey(error: unknown): boolean {
  const response = (error as { response?: unknown } | null)?.response;
  return response == null;
}
