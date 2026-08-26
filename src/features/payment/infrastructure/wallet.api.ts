import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { EscrowsPage, EscrowStatus } from '../domain/escrow.types';
import type { Tip, TipsPage, TipStatus, Wallet } from '../domain/tip.types';

// Bate no mesmo GET /musicians/:id/wallet que features/musician/infrastructure/
// musician-wallet.api.ts — decisão de arquitetura (Bloco 5): não migrar aquele
// adapter pra cá, pois é usado pelo wizard de cadastro (useMusicianWizardHandlers)
// e pela edição de perfil (useEditWalletSection), fora do escopo deste bloco, e
// FSD proíbe features/payment importar de features/musician. Wallet aqui é um
// superset (min_withdrawal_amount_brl/withdrawal_days) do MusicianWallet antigo.
export async function getWallet(musicianId: string): Promise<Wallet> {
  const { data } = await httpClient.get<ApiEnvelope<Wallet>>(`/musicians/${musicianId}/wallet`);
  return data.data;
}

// Formato real do PaginationOutputMapper (backend) — { data: { items, total,
// current_page, last_page, per_page } }, NÃO { data: [...], meta: {...} }.
export async function listTips(
  musicianId: string,
  params?: { page?: number; per_page?: number; status?: TipStatus },
): Promise<TipsPage> {
  const { data } = await httpClient.get<ApiEnvelope<TipsPage>>(
    `/musicians/${musicianId}/wallet/tips`,
    { params },
  );
  return data.data;
}

/**
 * GET /musicians/:id/wallet/escrow — custódias de cachê (F1.3a).
 *
 * É a **única** rota de custódia que existe, e é somente leitura de propósito:
 * quem retém é o webhook do provedor e quem libera é o job do backend, depois
 * de conferir check-in e prazo de contestação. Não existe (nem deve existir)
 * uma ação de "liberar" a partir do app — ela transformaria a salvaguarda numa
 * formalidade.
 *
 * Mesmo formato de `listTips`: `PaginationOutputMapper` dentro do envelope, por
 * isso `data.data` e não `data`.
 */
export async function listEscrows(
  musicianId: string,
  params?: { page?: number; per_page?: number; status?: EscrowStatus },
): Promise<EscrowsPage> {
  const { data } = await httpClient.get<ApiEnvelope<EscrowsPage>>(
    `/musicians/${musicianId}/wallet/escrow`,
    { params },
  );
  return data.data;
}

/**
 * Vincula a conta Mercado Pago do músico (gorjeta).
 *
 * Devolve a URL de autorização; quem abre é a tela, num navegador. O `state`
 * assinado dentro dela é o que amarra a autorização a ESTE músico — o callback
 * volta pelo navegador, sem token.
 */
export async function connectMercadoPago(musicianId: string): Promise<string> {
  const { data } = await httpClient.post<ApiEnvelope<{ authorization_url: string }>>(
    `/musicians/${musicianId}/mercadopago/connect`,
    {},
  );
  return data.data.authorization_url;
}

/** Desvincula. Gorjetas já recebidas não são afetadas — nunca passaram por nós. */
export async function disconnectMercadoPago(musicianId: string): Promise<void> {
  await httpClient.delete(`/musicians/${musicianId}/mercadopago`);
}

export type { Tip, TipsPage };
