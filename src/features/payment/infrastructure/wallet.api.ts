import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
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

export type { Tip, TipsPage };
