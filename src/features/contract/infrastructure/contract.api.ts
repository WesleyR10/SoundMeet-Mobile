import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  Contract,
  ContractDelivery,
  ContractPaginationMeta,
  ContractStatus,
  SignatureChallenge,
} from '../domain/contract.types';

export interface ContractListPage {
  data: Contract[];
  meta: ContractPaginationMeta;
}

export interface ListContractsParams {
  status?:   ContractStatus;
  page?:     number;
  per_page?: number;
}

/**
 * GET /contracts — contratos em que o usuário autenticado é parte.
 *
 * ⚠️ **Resposta paginada NÃO passa pelo `ApiEnvelope`.** `ContractCollectionPresenter`
 * estende `CollectionPresenter`, que expõe `meta` no topo — e o
 * `WrapperDataInterceptor` pula o wrap quando o corpo já tem `meta`. Então aqui
 * é `return data`, não `data.data`. Mesma armadilha de `inquiry.api.ts`; trocar
 * um pelo outro devolve `undefined` em silêncio.
 *
 * O escopo NUNCA vai na query: o backend resolve por `resolveParticipantIds(user)`
 * a partir do JWT (sub + `establishment_ids` + `band_ids`), casando contra os
 * três lados. Mandar id daqui não ampliaria nada e daria a falsa impressão de
 * que o cliente controla o escopo — e os filtros de query só REFINAM dentro
 * dele (pedir o booking de outro devolve zero, não 403).
 */
export async function listContracts(params: ListContractsParams = {}): Promise<ContractListPage> {
  const { data } = await httpClient.get<ContractListPage>('/contracts', { params });
  return data;
}

/**
 * GET /contracts/:contract_id — o snapshot congelado inteiro.
 *
 * É a fonte que a tela renderiza nativamente: cláusulas já vêm com o texto
 * final, e o PDF é derivado disto. Ver não exige liderança de banda — todo
 * integrante lê o contrato do show que vai tocar.
 */
export async function getContract(contractId: string): Promise<Contract> {
  const { data } = await httpClient.get<ApiEnvelope<Contract>>(`/contracts/${contractId}`);
  return data.data;
}

/**
 * POST /contracts/:contract_id/sign/challenge — pede o código de assinatura.
 *
 * 🔴 **A resposta NUNCA traz o código.** Ele vai para o e-mail congelado da
 * parte; aqui volta só o destino mascarado e o vencimento. Cada pedido
 * **invalida o anterior**, então não chamar isto em `useEffect` de montagem:
 * um re-render mataria o código que a pessoa acabou de receber.
 */
export async function requestSignatureChallenge(contractId: string): Promise<SignatureChallenge> {
  const { data } = await httpClient.post<ApiEnvelope<SignatureChallenge>>(
    `/contracts/${contractId}/sign/challenge`,
    {},
  );
  return data.data;
}

/**
 * POST /contracts/:contract_id/sign — registra o aceite deste lado.
 *
 * O corpo carrega **uma coisa só**: o consentimento, mais o segundo fator. Nome,
 * documento e papel não vêm daqui — o papel é derivado do JWT no backend, e
 * deixar o cliente escolhê-lo permitiria assinar pelos dois lados.
 *
 * `accept_terms` precisa ser um `true` explícito, vindo de um aceite dedicado:
 * é o que sustenta o "admitido como válido pelas partes" do art. 10, §2º da
 * MP 2.200-2/2001 — consentimento inequívoco não se infere de navegação.
 */
export async function signContract(
  contractId: string,
  challengeCode: string,
): Promise<Contract> {
  const { data } = await httpClient.post<ApiEnvelope<Contract>>(
    `/contracts/${contractId}/sign`,
    { accept_terms: true, challenge_code: challengeCode.trim() },
  );
  return data.data;
}

/**
 * POST /contracts/:contract_id/document/send — manda o PDF ao próprio e-mail.
 *
 * É a forma de "baixar" o contrato no app, e a escolha é deliberada:
 * `expo-file-system` não está instalado, e o documento carrega CPF, CNPJ,
 * endereço e cachê — a caixa de entrada da própria pessoa é um destino mais
 * seguro que o sistema de arquivos do telefone, e persiste fora dele, que é
 * justamente o valor probatório que a camada 4 de anti-chargeback busca.
 *
 * O destino é o e-mail **congelado no contrato** da parte que pediu — nunca a
 * outra parte, nunca um destino do corpo.
 */
export async function sendContractDocument(contractId: string): Promise<ContractDelivery> {
  const { data } = await httpClient.post<ApiEnvelope<ContractDelivery>>(
    `/contracts/${contractId}/document/send`,
    {},
  );
  return data.data;
}
