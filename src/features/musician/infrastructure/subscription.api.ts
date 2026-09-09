import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  ActiveSubscription,
  CreateCheckoutPayload,
  PlansCatalog,
  Subscription,
  SubscriptionCheckout,
} from '../domain/subscription.types';

/**
 * `GET /plans` — catálogo público.
 *
 * ⚠️ **Passa pelo envelope, ao contrário do que "público" sugere.** A rota é
 * `@Public()` e o `PlansCatalogPresenter` **não** tem `meta`, então o
 * `WrapperDataInterceptor` embrulha normalmente — é `data.data`. Ler `data`
 * cru devolveria um objeto com uma chave `data` dentro e todo campo viria
 * `undefined`, em silêncio. (O `soundmeet-web` tropeçou exatamente aqui.)
 */
export async function getPlans(): Promise<PlansCatalog> {
  const { data } = await httpClient.get<ApiEnvelope<PlansCatalog>>('/plans');
  return data.data;
}

/** `GET /musicians/:id/subscription` — tier em vigor (ou `free`). */
export async function getActiveSubscription(musicianId: string): Promise<ActiveSubscription> {
  const { data } = await httpClient.get<ApiEnvelope<ActiveSubscription>>(
    `/musicians/${musicianId}/subscription`,
  );
  return data.data;
}

/**
 * `POST /musicians/:id/subscription/checkout`.
 *
 * 🔴 **O app não coleta cartão.** O backend cria a assinatura recorrente no
 * gateway e devolve a URL da **fatura hospedada** do Asaas; o app só a abre num
 * Chrome Custom Tab. Coletar dados de cartão dentro do app traria PCI DSS para
 * dentro do binário por nenhum ganho.
 *
 * ⚠️ O plano local **só é ativado quando o webhook confirma o pagamento** — não
 * assumir upgrade no retorno desta chamada.
 */
export async function createCheckout(
  musicianId: string,
  payload: CreateCheckoutPayload,
): Promise<SubscriptionCheckout> {
  const { data } = await httpClient.post<ApiEnvelope<SubscriptionCheckout>>(
    `/musicians/${musicianId}/subscription/checkout`,
    payload,
  );
  return data.data;
}

/**
 * `DELETE /musicians/:id/subscription`.
 *
 * ⚠️ Responde **200 com corpo** (a assinatura cancelada), não 204 — diferente
 * de todo outro DELETE do sistema. `CancelSubscriptionUseCase` devolve o
 * agregado.
 */
export async function cancelSubscription(musicianId: string): Promise<Subscription> {
  const { data } = await httpClient.delete<ApiEnvelope<Subscription>>(
    `/musicians/${musicianId}/subscription`,
  );
  return data.data;
}
