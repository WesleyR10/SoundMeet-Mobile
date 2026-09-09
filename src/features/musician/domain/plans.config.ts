// Espelha soundmeet-backend/src/core/plans/domain/plan-features.config.ts
// (MUSICIAN_PLAN_FEATURES + MUSICIAN_PLAN_PRICING) e Docs/plans/musician-plans.md.
// A fonte canônica é o backend — mas o plans-module ainda não expõe controller
// HTTP, então o paywall apresenta estes valores estáticos. Ao alterar preço ou
// feature no backend, atualizar aqui junto.

export type MusicianPlanTier = 'free' | 'essential' | 'pro';
export type BillingCycle = 'monthly' | 'annual';

export type PlanFeature = {
  label:    string;
  included: boolean;
};

export type MusicianPlan = {
  tier:                  MusicianPlanTier;
  name:                  string;
  tagline:               string;
  monthlyPriceBrl:       number;
  annualPriceBrl:        number;
  annualSavingsBrl:      number;
  annualDiscountPercent: number;
  /** métricas de dinheiro exibidas em destaque no topo do card */
  keyStats:              { label: string; value: string }[];
  features:              PlanFeature[];
  popular?:              boolean;
};

export const PLAN_ORDER: readonly MusicianPlanTier[] = ['free', 'essential', 'pro'];

export const MUSICIAN_PLANS: readonly MusicianPlan[] = [
  {
    tier:                  'free',
    name:                  'Free',
    tagline:               'Comece a tocar e receber gorjetas hoje',
    monthlyPriceBrl:       0,
    annualPriceBrl:        0,
    annualSavingsBrl:      0,
    annualDiscountPercent: 0,
    keyStats: [
      { label: 'Taxa sobre gorjetas', value: '9%' },
      { label: 'Saque mínimo',        value: 'R$ 110' },
      { label: 'Prazo do saque',      value: '5 dias úteis' },
    ],
    features: [
      { label: 'Pedidos musicais e gorjetas ilimitados', included: true },
      { label: 'Cifras: acesso e edição',                included: true },
      { label: 'Até 3 cifras pessoais',                  included: true },
      { label: 'Compartilhar cifras com a comunidade',   included: false },
      { label: '1 repertório (até 20 músicas)',          included: true },
      { label: 'Afinador cromático',                     included: true },
      { label: 'Analytics básico',                       included: true },
      { label: 'Afinador com filtro de ruído',           included: false },
      { label: 'Compartilhar repertório',                included: false },
      { label: 'Geração de banners',                     included: false },
    ],
  },
  {
    tier:                  'essential',
    name:                  'Essencial',
    tagline:               'Para quem vive de show e quer taxa menor',
    monthlyPriceBrl:       34.9,
    annualPriceBrl:        300,
    annualSavingsBrl:      118.8,
    annualDiscountPercent: 28,
    popular:               true,
    keyStats: [
      { label: 'Taxa sobre gorjetas', value: '7%' },
      { label: 'Saque mínimo',        value: 'R$ 70' },
      { label: 'Prazo do saque',      value: '3 dias úteis' },
    ],
    features: [
      { label: 'Tudo do Free',                                 included: true },
      { label: 'Cifras pessoais ilimitadas + comunidade',      included: true },
      { label: '3 repertórios (até 80 músicas cada)',          included: true },
      { label: 'Compartilhar repertório por link',             included: true },
      { label: 'Afinador com filtro de ruído',                 included: true },
      { label: 'Analytics avançado',                           included: true },
      { label: '3 banners de divulgação por mês',              included: true },
      { label: 'Suporte prioritário por e-mail',               included: true },
      { label: 'QR code customizado e split de banda',         included: false },
    ],
  },
  {
    tier:                  'pro',
    name:                  'Pro',
    tagline:               'O palco inteiro: banda, marca própria e o menor custo',
    monthlyPriceBrl:       74.9,
    annualPriceBrl:        670,
    annualSavingsBrl:      228.8,
    annualDiscountPercent: 25,
    keyStats: [
      { label: 'Taxa sobre gorjetas', value: '5%' },
      { label: 'Saque mínimo',        value: 'R$ 50' },
      { label: 'Prazo do saque',      value: 'até 24h' },
    ],
    features: [
      { label: 'Tudo do Essencial',                            included: true },
      { label: 'Cifras pessoais ilimitadas + comunidade',      included: true },
      { label: 'Repertórios e músicas ilimitados',             included: true },
      { label: 'Repertório colaborativo (convites)',           included: true },
      { label: 'QR code customizado',                          included: true },
      { label: 'Split automático de banda (até 8 membros)',    included: true },
      { label: 'Prioridade no algoritmo de descoberta',        included: true },
      { label: '15 banners de divulgação por mês',             included: true },
      { label: 'Analytics completo com exportação',            included: true },
    ],
  },
];

/** Próximo upgrade natural a partir do plano atual (pré-seleção do paywall). */
export function suggestedUpgrade(current: MusicianPlanTier | null): MusicianPlanTier {
  if (current === 'essential' || current === 'pro') return 'pro';
  return 'essential';
}

/**
 * Substitui os preços locais pelos do backend quando `GET /plans` responde.
 *
 * 🔴 **Resolve a divergência silenciosa do item 11.14e.** Enquanto o preço
 * vivia só neste arquivo, mudá-lo no backend não quebrava nada aqui: o paywall
 * seguia anunciando o valor antigo, o músico assinava acreditando nele e a
 * fatura do Asaas vinha com outro — sem erro, sem log, sem teste falhando.
 *
 * O catálogo local continua sendo a fonte de **copy e features** (o backend não
 * devolve `tagline` nem `keyStats`) e o fallback da primeira pintura e do
 * offline. O que ele deixa de decidir é dinheiro.
 *
 * Tier que o backend não conhece fica com o preço local em vez de sumir: uma
 * resposta parcial não deve apagar um plano da tela.
 */
export function hydratePlanPricing(
  plans: readonly MusicianPlan[],
  catalog: { tier: string; pricing: {
    monthly_price_brl: number;
    annual_price_brl: number;
    annual_savings_brl: number;
    annual_discount_percent: number;
  } }[] | undefined,
): readonly MusicianPlan[] {
  if (!catalog?.length) return plans;

  return plans.map((plan) => {
    const remote = catalog.find((entry) => entry.tier === plan.tier);
    if (!remote) return plan;

    return {
      ...plan,
      monthlyPriceBrl:       remote.pricing.monthly_price_brl,
      annualPriceBrl:        remote.pricing.annual_price_brl,
      annualSavingsBrl:      remote.pricing.annual_savings_brl,
      annualDiscountPercent: remote.pricing.annual_discount_percent,
    };
  });
}
