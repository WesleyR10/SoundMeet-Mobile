import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { newIdempotencyKey, shouldReuseIdempotencyKey } from '../domain/withdraw.rules';
import { withdrawToPix } from '../infrastructure/wallet.api';
import { walletKey } from './useWallet';

/**
 * Solicitar saque PIX.
 *
 * ## O ref de idempotência é o coração deste hook
 *
 * A chave nasce na primeira tentativa e **sobrevive** enquanto o servidor não
 * tiver dado uma resposta conclusiva. Isso faz o botão "tentar de novo" depois
 * de uma queda de rede ser um *reenvio* (o backend devolve o saque original),
 * em vez de um segundo saque de verdade — que é justamente o defeito que o
 * SM-023 fechou no backend e que só o cliente consegue distinguir.
 *
 * Quando o servidor recusa de forma conclusiva (422 de valor, 409 de chave
 * reusada com outro valor, 403), a chave é descartada: insistir nela faria o
 * backend replicar a recusa para sempre, e a próxima tentativa é uma intenção
 * nova. A regra em si mora em `domain/withdraw.rules.ts`, com teste.
 *
 * ⚠️ **Não trocar o `useRef` por `useState`.** `setState` é assíncrono e em
 * lote: dois toques rápidos no botão leriam o mesmo valor antigo e um deles
 * geraria uma chave nova — exatamente o duplo saque que a chave existe para
 * impedir. Mesmo motivo do guard de reentrância do `QRScannerScreen`.
 */
export function useWithdraw(musicianId: string | null) {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: (amount: number) => {
      idempotencyKeyRef.current ??= newIdempotencyKey();
      return withdrawToPix(musicianId!, amount, idempotencyKeyRef.current);
    },
    onSuccess: () => {
      idempotencyKeyRef.current = null;
      if (musicianId) {
        // Só a carteira: `balance` e `total_withdrawn` mudaram. Gorjetas e
        // custódias são listas de dinheiro que ENTRA — um saque não as toca, e
        // invalidá-las seria refetch inútil na volta de uma tela de dinheiro.
        void queryClient.invalidateQueries({ queryKey: walletKey(musicianId) });
      }
    },
    onError: (error) => {
      if (!shouldReuseIdempotencyKey(error)) {
        idempotencyKeyRef.current = null;
      }
    },
  });
}
