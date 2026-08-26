import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  Inquiry,
  InquiryEstablishment,
  InquiryPaginationMeta,
  InquiryStatus,
} from '../domain/inquiry.types';

export interface InquiryListPage {
  data: Inquiry[];
  meta: InquiryPaginationMeta;
}

export interface ListInquiriesParams {
  status?: InquiryStatus;
  page?: number;
  per_page?: number;
}

/**
 * GET /scheduling/inquiries — propostas recebidas pelo usuário autenticado.
 *
 * ⚠️ **Resposta paginada NÃO passa pelo `ApiEnvelope`.** O `data` e o `meta`
 * vêm no mesmo nível, então aqui é `return data` e não `data.data` — mesmo
 * formato de `features/audience/infrastructure/establishment.api.ts`. Trocar um
 * pelo outro devolve `undefined` em silêncio.
 *
 * O escopo NUNCA vai na query: o backend resolve por
 * `resolveParticipantIds(user)` a partir do JWT (sub + `band_ids`), então o
 * músico recebe tanto as propostas endereçadas a ele quanto as das bandas de
 * que participa. Mandar `musician_id` daqui não ampliaria nada e daria a falsa
 * impressão de que o cliente controla o escopo.
 */
export async function listInquiries(params: ListInquiriesParams = {}): Promise<InquiryListPage> {
  const { data } = await httpClient.get<InquiryListPage>('/scheduling/inquiries', { params });
  return data;
}

/**
 * PATCH /scheduling/inquiries/:id/accept
 *
 * Corpo vazio de propósito: o controller liga o DTO como `_dto` e monta o input
 * a partir do `:id` da URL e do usuário do token. Mandar campos aqui não teria
 * efeito nenhum.
 */
export async function acceptInquiry(inquiryId: string): Promise<Inquiry> {
  const { data } = await httpClient.patch<ApiEnvelope<Inquiry>>(
    `/scheduling/inquiries/${inquiryId}/accept`,
    {},
  );
  return data.data;
}

/** PATCH /scheduling/inquiries/:id/reject — `reason` é opcional no backend. */
export async function rejectInquiry(inquiryId: string, reason?: string): Promise<Inquiry> {
  const { data } = await httpClient.patch<ApiEnvelope<Inquiry>>(
    `/scheduling/inquiries/${inquiryId}/reject`,
    { reason: reason?.trim() || null },
  );
  return data.data;
}

/**
 * GET /establishments/:id — a casa que enviou a proposta.
 *
 * Existe porque `InquiryPresenter` carrega SÓ o `establishment_id`: sem nome,
 * sem avatar e — o que importa aqui — sem a ficha técnica do palco. Sem esta
 * segunda busca, a tela de decisão mostraria um UUID.
 *
 * Rota `@Public()` no backend, então não há questão de permissão. Duplica o
 * endereço de `features/audience/infrastructure/establishment.api.ts` de
 * propósito: FSD proíbe import cross-feature e o precedente está documentado em
 * `features/payment/infrastructure/wallet.api.ts`, que bate no mesmo endpoint
 * de carteira que `features/musician`.
 */
export async function getInquiryEstablishment(
  establishmentId: string,
): Promise<InquiryEstablishment> {
  const { data } = await httpClient.get<ApiEnvelope<InquiryEstablishment>>(
    `/establishments/${establishmentId}`,
  );
  return data.data;
}
