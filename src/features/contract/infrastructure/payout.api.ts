import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { ContractPayout } from '../domain/payout.types';

/** Recorte de `EscrowsListPresenter` — a feature lê só os valores. */
interface EscrowsPage {
  items: ContractPayout[];
}

/**
 * GET /musicians/:id/wallet/escrow?booking_id=... — o que a plataforma retém
 * do cachê DESTE show.
 *
 * Bate no mesmo endpoint de `features/payment/infrastructure/wallet.api.ts`,
 * de propósito: FSD proíbe import cross-feature, e o precedente está
 * documentado naquele próprio arquivo (que duplica o endereço da carteira usado
 * por `features/musician`). O recorte aqui é bem menor — três números.
 *
 * `null` quando não há custódia para o show. Não é erro: significa que o
 * pagamento não passa pela plataforma (banda, show sem cachê, músico sem
 * subconta) e, portanto, **não há comissão a informar**.
 */
export async function getContractPayout(
  musicianId: string,
  bookingId: string,
): Promise<ContractPayout | null> {
  const { data } = await httpClient.get<ApiEnvelope<EscrowsPage>>(
    `/musicians/${musicianId}/wallet/escrow`,
    { params: { booking_id: bookingId, per_page: 1 } },
  );
  return data.data.items[0] ?? null;
}
