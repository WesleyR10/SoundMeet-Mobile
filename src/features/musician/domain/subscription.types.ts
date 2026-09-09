import type { BillingCycle, MusicianPlanTier } from './plans.config';

/**
 * Espelha `PlanPricing` (backend, `plan-features.config.ts`).
 *
 * 🔴 **A fonte canônica de preço é o backend, e o próprio `GET /plans` diz
 * isso** ("o app não deve espelhar esses valores localmente"). `plans.config.ts`
 * segue existindo como fallback de primeira pintura e de offline — mas o valor
 * exibido no CTA, que é o que o músico acredita que vai pagar, sai daqui quando
 * a rota responde. Sem isso, uma mudança de preço no backend divergiria do app
 * **em silêncio**, e o usuário veria um valor e seria cobrado outro.
 */
export interface PlanPricing {
  monthly_price_brl: number;
  annual_price_brl: number;
  annual_savings_brl: number;
  annual_discount_percent: number;
}

export interface PlanCatalogEntry {
  tier: string;
  pricing: PlanPricing;
  features: Record<string, unknown>;
}

/**
 * `GET /plans`.
 *
 * ⚠️ `coming_soon` lista features anunciadas que **ainda não têm capacidade** no
 * backend (`api_access`, `white_label`). Elas não são gate: exibi-las como
 * incluídas seria prometer o que o sistema não entrega.
 */
export interface PlansCatalog {
  musician: PlanCatalogEntry[];
  establishment: PlanCatalogEntry[];
  coming_soon: { musician: string[]; establishment: string[] };
}

/** Espelha `SubscriptionPresenter`. */
export interface Subscription {
  subscription_id: string;
  musician_id: string | null;
  establishment_id: string | null;
  plan_tier: string;
  persona: string;
  billing_cycle: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

/**
 * Espelha `ActiveSubscriptionPresenter`.
 *
 * `effective_tier` é `"free"` quando não há assinatura ativa — e `subscription`
 * é `null` no mesmo caso. Ler o tier a partir de `subscription?.plan_tier`
 * daria `undefined` para o plano gratuito, que é um tier legítimo.
 */
export interface ActiveSubscription {
  effective_tier: string;
  subscription: Subscription | null;
}

/** Corpo de `POST /musicians/:id/subscription/checkout`. */
export interface CreateCheckoutPayload {
  plan_tier: Exclude<MusicianPlanTier, 'free'>;
  billing_cycle: BillingCycle;
  payer_name: string;
  payer_email: string;
  payer_cpf_cnpj: string;
}

/**
 * Espelha `SubscriptionCheckoutPresenter`.
 *
 * 🔴 **`checkout_url` é nullable.** Sem URL não há para onde navegar, e a tela
 * precisa dizer "aguardando confirmação" em vez de abrir `null` — mesma
 * armadilha já registrada no `soundmeet-web` (`CheckoutForm.tsx`).
 */
export interface SubscriptionCheckout {
  gateway_subscription_id: string;
  checkout_url: string | null;
  plan_tier: string;
  billing_cycle: string;
  amount_brl: number;
}
