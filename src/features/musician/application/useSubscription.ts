import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { extractApiMessage } from '@/shared/services/http/types';
import {
  cancelSubscription,
  createCheckout,
  getActiveSubscription,
  getPlans,
} from '../infrastructure/subscription.api';
import type { CreateCheckoutPayload } from '../domain/subscription.types';
import { musicianProfileKey } from './useMusician';

export const plansCatalogKey = ['plans', 'catalog'] as const;
export const subscriptionKey = (musicianId: string) =>
  ['musician', 'subscription', musicianId] as const;

/**
 * Catálogo de planos do backend.
 *
 * `staleTime` longo: preço de plano muda em release, não em minutos. O paywall
 * pinta primeiro com `plans.config.ts` e substitui os valores quando isto
 * resolve — ver `hydratePlanPricing`.
 */
export function usePlansCatalog() {
  return useQuery({
    queryKey: plansCatalogKey,
    queryFn: getPlans,
    staleTime: 30 * 60 * 1_000,
  });
}

export function useActiveSubscription(musicianId: string | null) {
  return useQuery({
    queryKey: musicianId ? subscriptionKey(musicianId) : ['musician', 'subscription', 'disabled'],
    queryFn: () => getActiveSubscription(musicianId!),
    enabled: !!musicianId,
    staleTime: 60 * 1_000,
  });
}

/**
 * Iniciar o checkout e abrir a fatura hospedada.
 *
 * ⚠️ **`openAuthSessionAsync`, não `openBrowserAsync`** — mesmo padrão do
 * vínculo com o Mercado Pago: a sessão volta sozinha para o app pelo deep link,
 * sem o usuário ter que trocar de aplicativo na mão.
 *
 * 🔴 **O plano NÃO é ativado aqui.** Quem ativa é o webhook do gateway, quando o
 * primeiro pagamento confirma. Por isso o `onSettled` invalida em vez de
 * escrever no cache: assumir o upgrade no retorno mostraria features PRO a
 * quem fechou o navegador sem pagar, e o servidor recusaria cada uma delas.
 */
export function useCreateCheckout(musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCheckoutPayload) => {
      const checkout = await createCheckout(musicianId!, payload);
      if (checkout.checkout_url) {
        await WebBrowser.openAuthSessionAsync(
          checkout.checkout_url,
          'soundmeet://planos/retorno',
        );
      }
      return checkout;
    },
    onSettled: () => {
      if (!musicianId) return;
      void queryClient.invalidateQueries({ queryKey: subscriptionKey(musicianId) });
      // `plan_tier` do perfil é a fonte que o resto do app lê para liberar
      // feature — invalidar só a assinatura deixaria os gates no valor antigo.
      void queryClient.invalidateQueries({ queryKey: musicianProfileKey(musicianId) });
    },
  });
}

export function useCancelSubscription(musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelSubscription(musicianId!),
    onSuccess: () => {
      if (!musicianId) return;
      void queryClient.invalidateQueries({ queryKey: subscriptionKey(musicianId) });
      void queryClient.invalidateQueries({ queryKey: musicianProfileKey(musicianId) });
    },
  });
}

export function getSubscriptionErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
