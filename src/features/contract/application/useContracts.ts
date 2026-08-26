import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { extractApiMessage } from '@/shared/services/http/types';
import {
  getContract,
  listContracts,
  requestSignatureChallenge,
  sendContractDocument,
  signContract,
} from '../infrastructure/contract.api';
import { awaitsMySignature } from '../domain/contract.rules';
import type { ContractStatus } from '../domain/contract.types';

export const contractsKey = (musicianId: string, status?: ContractStatus) =>
  ['contract', musicianId, 'list', status ?? 'all'] as const;

export const contractKey = (contractId: string) =>
  ['contract', 'detail', contractId] as const;

/**
 * Contratos do músico. O `musicianId` entra só na CHAVE, nunca na query — o
 * backend escopa pelo JWT. Serve para não misturar cache entre contas no
 * multi-role switching, mesmo motivo de `inquiriesKey`.
 */
export function useContracts(musicianId: string | null, status?: ContractStatus) {
  return useQuery({
    queryKey: musicianId ? contractsKey(musicianId, status) : ['contract', 'list', 'disabled'],
    queryFn:   () => listContracts({ status, per_page: 50 }),
    enabled:   !!musicianId,
    staleTime: 30 * 1_000,
  });
}

/**
 * Quantos contratos esperam a assinatura DESTE músico.
 *
 * Alimenta o `badgeCount` do tile na Home e da linha no Perfil. Deriva da mesma
 * lista já em cache — um endpoint de contagem não existe, e criar um segundo
 * fetch só para um número seria pagar duas vezes pela mesma resposta.
 */
export function usePendingContractCount(musicianId: string | null): number {
  const { data } = useContracts(musicianId);
  if (!data) return 0;
  return data.data.filter((contract) => awaitsMySignature(contract, musicianId)).length;
}

/** O snapshot congelado inteiro — é o que a tela de detalhe renderiza. */
export function useContract(contractId: string | null) {
  return useQuery({
    queryKey: contractId ? contractKey(contractId) : ['contract', 'detail', 'disabled'],
    queryFn:   () => getContract(contractId!),
    enabled:   !!contractId,
    // O documento é IMUTÁVEL por construção; só status e assinaturas mudam.
    // 60s é o bastante para refletir a assinatura da outra parte sem
    // refazer a busca de um conteúdo que não pode mudar.
    staleTime: 60 * 1_000,
  });
}

/**
 * Pedir o código de assinatura.
 *
 * ⚠️ **Mutation, nunca query.** Cada chamada invalida o código anterior no
 * servidor e dispara um e-mail — um `useQuery` refetcharia no foco da tela e
 * mataria o código que a pessoa acabou de receber, no pior momento possível.
 */
export function useRequestSignatureChallenge(contractId: string | null) {
  return useMutation({
    mutationFn: () => requestSignatureChallenge(contractId!),
  });
}

/**
 * Assinar.
 *
 * Invalida a lista E escreve o detalhe com a resposta: a assinatura devolve o
 * contrato já atualizado, e reaproveitá-lo evita um piscar entre "assinei" e a
 * tela refletir isso. A lista é invalidada por prefixo porque a assinatura muda
 * o contrato de faixa de status.
 */
export function useSignContract(musicianId: string | null, contractId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (challengeCode: string) => signContract(contractId!, challengeCode),
    onSuccess: (contract) => {
      queryClient.setQueryData(contractKey(contract.id), contract);
      if (musicianId) {
        void queryClient.invalidateQueries({ queryKey: ['contract', musicianId, 'list'] });
      }
    },
  });
}

/** Reenviar o PDF ao próprio e-mail. */
export function useSendContractDocument(contractId: string | null) {
  return useMutation({
    mutationFn: () => sendContractDocument(contractId!),
  });
}

/**
 * Mensagem de erro da assinatura, em português e acionável.
 *
 * Três casos que o usuário PRECISA entender e que a mensagem crua não explica:
 *
 *  - **403 em contrato de banda:** só o líder assina. O payload não diz quem
 *    pode agir, então o erro é a primeira vez que isso aparece — e é por isso
 *    que a UI não tenta inferir liderança (ver `resolveMySide`).
 *  - **422 de código inválido:** errado, expirado, ou já usado. São o mesmo
 *    erro no servidor de propósito (distinguir ajudaria quem está adivinhando),
 *    então a mensagem cobre os três e aponta o caminho: pedir outro.
 *  - **422 "já assinado":** a outra ponta assinou entre a tela carregar e o
 *    toque no botão.
 */
export function getSignContractErrorMessage(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status;
  const message = extractApiMessage(error);

  if (status === 403) {
    return 'Só o líder da banda pode assinar este contrato.';
  }

  if (/challenge|código|codigo/i.test(message)) {
    return 'Código inválido ou expirado. Peça um novo código e tente de novo.';
  }

  if (/already signed|já assinado|ja assinado/i.test(message)) {
    return 'Este lado do contrato já foi assinado.';
  }

  if (/annull|anulado/i.test(message)) {
    return 'Este contrato foi anulado e não pode mais ser assinado.';
  }

  return message;
}
