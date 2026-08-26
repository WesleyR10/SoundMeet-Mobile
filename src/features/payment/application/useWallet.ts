import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import {
  connectMercadoPago,
  disconnectMercadoPago,
  getWallet,
} from '../infrastructure/wallet.api';

export const walletKey = (musicianId: string) => ['payment', 'wallet', musicianId] as const;

export function useWallet(musicianId: string | null) {
  return useQuery({
    queryKey:  musicianId ? walletKey(musicianId) : ['payment', 'wallet', 'disabled'],
    queryFn:   () => getWallet(musicianId!),
    enabled:   !!musicianId,
    staleTime: 30 * 1_000,
  });
}

/**
 * Conectar a conta Mercado Pago para receber gorjetas.
 *
 * Abre a autorização em **Chrome Custom Tab** (`openAuthSessionAsync`), o mesmo
 * padrão já decidido para o checkout de assinatura: o fluxo volta sozinho para o
 * app pelo deep link do callback, sem o usuário precisar trocar de aplicativo na
 * mão.
 *
 * ⚠️ Invalida a carteira ao voltar — o `mp_linked` muda no servidor, e sem
 * invalidar a tela continuaria oferecendo "conectar" para quem acabou de
 * conectar.
 */
export function useConnectMercadoPago(musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const url = await connectMercadoPago(musicianId!);
      return WebBrowser.openAuthSessionAsync(url, 'soundmeet://carteira/mercadopago');
    },
    onSettled: () => {
      if (musicianId) {
        void queryClient.invalidateQueries({ queryKey: walletKey(musicianId) });
      }
    },
  });
}

export function useDisconnectMercadoPago(musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => disconnectMercadoPago(musicianId!),
    onSuccess: () => {
      if (musicianId) {
        void queryClient.invalidateQueries({ queryKey: walletKey(musicianId) });
      }
    },
  });
}
