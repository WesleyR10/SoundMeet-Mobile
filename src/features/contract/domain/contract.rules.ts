import type {
  Contract,
  ContractDelivery,
  ContractPartyRole,
  ContractSignature,
  ContractStatus,
} from './contract.types';

// Regras puras do contrato. Domínio sem RN/Expo — é a camada que o mobile
// testa. A barreira real é sempre o backend (403/422); este arquivo existe para
// **não oferecer ação que o servidor vai recusar**, nunca para substituir a
// checagem de lá.

/**
 * Qual lado a sessão atual representa neste contrato.
 *
 * **Derivado, nunca assumido.** O app é a persona músico, então na prática é
 * sempre `contracted` — mas cravar a constante faria a UI mentir em silêncio no
 * dia em que abrir um contrato que não é dela. `null` significa "esta sessão
 * não é parte", e a UI não oferece assinatura nenhuma.
 *
 * ⚠️ **Contrato de banda resolve para `contracted` sem checar liderança.**
 * `AuthUser` não carrega `band_ids` (só `sub`, `musicianId`, `audienceId` e um
 * `establishmentId`), e mesmo que carregasse, *pertencer* à banda não é
 * *liderar* — a liderança muda, e uma cópia dela no cliente ficaria errada em
 * silêncio. A garantia de que o contrato é meu já veio antes: `GET /contracts`
 * é escopado pelo JWT no backend e **só devolve contrato de quem é parte**.
 * Quem não é líder toma 403 ao assinar, e a UI trata a mensagem.
 */
export function resolveMySide(
  contract: Pick<Contract, 'musician_id' | 'band_id'>,
  musicianId: string | null,
): ContractPartyRole | null {
  if (!musicianId) return null;
  if (contract.musician_id === musicianId) return 'contracted';
  if (contract.band_id !== null) return 'contracted';
  return null;
}

/** A assinatura já registrada de um lado, ou `null`. */
export function signatureOf(
  contract: Pick<Contract, 'signatures'>,
  role: ContractPartyRole,
): ContractSignature | null {
  return contract.signatures.find((signature) => signature.role === role) ?? null;
}

/**
 * Este lado ainda precisa assinar?
 *
 * Usa `pending_signatures`, que o backend já calcula — recalcular a partir de
 * `signatures` duplicaria a regra em dois lugares que divergiriam na primeira
 * mudança. O `ContractOutputMapper` devolve o campo justamente para "evitar o
 * cliente recalcular a regra".
 */
export function isAwaitingSignatureFrom(
  contract: Pick<Contract, 'pending_signatures'>,
  role: ContractPartyRole,
): boolean {
  return contract.pending_signatures.includes(role);
}

/**
 * A UI pode oferecer o painel de assinatura?
 *
 * Anulado nunca é assinável; assinado também não. Fora isso, só quem é parte e
 * ainda não assinou pelo seu lado.
 *
 * ⚠️ **Não inferimos liderança de banda aqui** — ver `resolveMySide`.
 */
export function canSign(
  contract: Pick<Contract, 'status' | 'pending_signatures'>,
  mySide: ContractPartyRole | null,
): boolean {
  if (mySide === null) return false;
  if (contract.status === 'annulled' || contract.status === 'signed') return false;
  return isAwaitingSignatureFrom(contract, mySide);
}

/** O certificado (Anexo II) só existe depois das duas assinaturas. */
export function canDownloadCertificate(
  contract: Pick<Contract, 'status' | 'has_certificate'>,
): boolean {
  return contract.status === 'signed' && contract.has_certificate;
}

/**
 * Espera por MIM — é o que alimenta o `badgeCount` da Home e do Perfil.
 *
 * Diferente de `canSign` só na intenção: aqui a pergunta é "isto exige uma ação
 * minha?", e a resposta é a mesma regra. Existe como função nomeada para o
 * contador não reimplementar a condição por conta própria.
 */
export function awaitsMySignature(
  contract: Pick<Contract, 'status' | 'pending_signatures' | 'musician_id' | 'band_id'>,
  musicianId: string | null,
): boolean {
  return canSign(contract, resolveMySide(contract, musicianId));
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  issued:           'Aguardando assinaturas',
  partially_signed: 'Falta uma assinatura',
  signed:           'Assinado',
  annulled:         'Anulado',
};

export function statusLabel(contract: Pick<Contract, 'status'>): string {
  return CONTRACT_STATUS_LABELS[contract.status];
}

export type StatusTone = 'pending' | 'positive' | 'negative' | 'neutral';

/** Tom semântico do status — a UI mapeia para cor, o domínio não conhece cor. */
export function statusTone(contract: Pick<Contract, 'status'>): StatusTone {
  switch (contract.status) {
    case 'issued':
    case 'partially_signed':
      return 'pending';
    case 'signed':
      return 'positive';
    case 'annulled':
      return 'negative';
  }
}

/**
 * Rótulo curto da ação pendente, do ponto de vista de quem está olhando.
 *
 * "Aguardando você" e "Aguardando o contratante" são estados MUITO diferentes
 * para o músico, e `status` sozinho não os distingue: `partially_signed` pode
 * ser qualquer um dos dois.
 */
export function pendingActorLabel(
  contract: Pick<Contract, 'status' | 'pending_signatures'>,
  mySide: ContractPartyRole | null,
): string | null {
  if (contract.status === 'signed' || contract.status === 'annulled') return null;
  if (mySide && isAwaitingSignatureFrom(contract, mySide)) return 'Aguardando você';

  const otherSide: ContractPartyRole = mySide === 'contracted' ? 'contractor' : 'contracted';
  if (isAwaitingSignatureFrom(contract, otherSide)) {
    return otherSide === 'contractor'
      ? 'Aguardando o estabelecimento'
      : 'Aguardando o artista';
  }
  return null;
}

/**
 * O desafio de assinatura ainda está vivo?
 *
 * O código vale 10 minutos no servidor. A UI mostra o vencimento, mas **não
 * trava o botão nisto**: o código sobrevive a um reload do app, e pedir outro
 * invalida o que a pessoa acabou de receber. Quem recusa código vencido é o
 * servidor.
 */
export function challengeExpiryLabel(
  expiresAt: string,
  now: Date = new Date(),
): string | null {
  const expires = Date.parse(expiresAt);
  if (Number.isNaN(expires)) return null;

  const msLeft = expires - now.getTime();
  if (msLeft <= 0) return 'Código expirado — peça outro';

  const minutes = Math.ceil(msLeft / 60_000);
  return minutes <= 1 ? 'Código expira em menos de 1 minuto' : `Código expira em ${minutes} min`;
}

/**
 * O que dizer depois de pedir o PDF por e-mail.
 *
 * Três desfechos, e confundi-los mandaria a pessoa tentar de novo para sempre:
 * `document_available: false` significa que o PDF não está no storage —
 * reenviar não resolve nada —, enquanto `delivered` vazio **com** o documento
 * disponível é falha de e-mail, essa sim transitória. `null` é a exceção da
 * chamada.
 *
 * Mora no domínio, e não na screen, pela regra da casa: lógica de negócio
 * fora de `ui/`. `statusLabel` é o precedente de copy pt-BR aqui — e o que faz
 * a regra ser testável sem arrastar axios e react-query para o Jest.
 */
export function describeContractDelivery(result: ContractDelivery | null): string {
  if (!result) {
    return 'Não foi possível enviar agora. Tente novamente em alguns minutos.';
  }

  if (!result.document_available) {
    return 'O PDF deste contrato ainda não está disponível. O documento em si está aqui na tela, e ele é a fonte — o PDF é só uma cópia.';
  }

  if (result.delivered.length === 0) {
    return 'Não foi possível enviar agora. Tente novamente em alguns minutos.';
  }

  return 'Enviamos o contrato em PDF para o e-mail do seu cadastro.';
}
