import type { Inquiry, InquiryStatus } from './inquiry.types';

// Regras puras da proposta. Domínio sem RN/Expo — é a camada que o mobile
// testa (ver jest.config.js e os 7 arquivos de __tests__ existentes, todos de
// lógica pura). Tudo que tem armadilha mora aqui, e não dentro da screen.

/**
 * A proposta ainda pode ser aceita ou recusada?
 *
 * ⚠️ **Duas condições, não uma.** O agregado do backend roda `expire()` ANTES
 * de qualquer transição: uma proposta `open` cujo `expires_at` já passou é
 * expirada na hora e o `accept` falha com 422 ("Only open inquiries can be
 * accepted"). Olhar só o `status` faria a UI oferecer um botão que o servidor
 * recusa — o pior tipo de botão.
 *
 * `expires_at: null` significa "sem prazo", não "vencida".
 */
export function isActionable(inquiry: Inquiry, now: Date = new Date()): boolean {
  if (inquiry.status !== 'open') return false;
  if (inquiry.expires_at === null) return true;

  const expiresAt = Date.parse(inquiry.expires_at);
  // Data ilegível não pode virar "expirada" em silêncio: deixa o servidor
  // decidir, que é quem tem a verdade.
  if (Number.isNaN(expiresAt)) return true;

  return expiresAt > now.getTime();
}

/** Rótulo do status para a UI. `open` vencida lê como expirada, não como aberta. */
export function statusLabel(inquiry: Inquiry, now: Date = new Date()): string {
  if (inquiry.status === 'open') {
    return isActionable(inquiry, now) ? 'Aguardando você' : 'Expirada';
  }

  const labels: Record<Exclude<InquiryStatus, 'open'>, string> = {
    accepted:  'Aceita',
    rejected:  'Recusada',
    converted: 'Virou show',
    expired:   'Expirada',
  };
  return labels[inquiry.status];
}

export type StatusTone = 'pending' | 'positive' | 'negative' | 'neutral';

/** Tom semântico do status — a screen mapeia para cor, o domínio não conhece cor. */
export function statusTone(inquiry: Inquiry, now: Date = new Date()): StatusTone {
  switch (inquiry.status) {
    case 'open':
      return isActionable(inquiry, now) ? 'pending' : 'neutral';
    case 'accepted':
    case 'converted':
      return 'positive';
    case 'rejected':
      return 'negative';
    case 'expired':
      return 'neutral';
  }
}

/**
 * Urgência em texto: "expira hoje", "expira em 3 dias", "expirada".
 *
 * Devolve `null` quando não há prazo ou quando a proposta já saiu de `open` —
 * dizer "expira em 5 dias" numa proposta já aceita seria ruído.
 */
export function expiryLabel(inquiry: Inquiry, now: Date = new Date()): string | null {
  if (inquiry.status !== 'open' || inquiry.expires_at === null) return null;

  const expiresAt = Date.parse(inquiry.expires_at);
  if (Number.isNaN(expiresAt)) return null;

  const msLeft = expiresAt - now.getTime();
  if (msLeft <= 0) return 'Expirada';

  // Arredonda para CIMA: faltando 30h, "expira em 2 dias" é mais honesto que
  // "1 dia" — o músico não perde o prazo por causa de um arredondamento nosso.
  const daysLeft = Math.ceil(msLeft / 86_400_000);
  if (daysLeft <= 1) return 'Expira hoje';
  return `Expira em ${daysLeft} dias`;
}

/**
 * A proposta é endereçada à banda (e não ao músico direto)?
 *
 * Importa porque **só o líder da banda pode aceitar ou recusar** — membro comum
 * recebe 403 de `assertBandLeader`. O payload não traz nenhum flag de quem pode
 * agir, e inferir liderança no cliente ficaria errado assim que a liderança
 * mudasse; então a UI apenas AVISA que é decisão do líder e deixa o servidor
 * ser a autoridade.
 */
export function isBandInquiry(inquiry: Inquiry): boolean {
  return inquiry.band_id !== null;
}
