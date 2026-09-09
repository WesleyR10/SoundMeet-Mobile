import { MUSICIAN_PLANS, hydratePlanPricing } from '../plans.config';
import { checkoutPayerSchema } from '../subscription.validation';

describe('checkoutPayerSchema', () => {
  const valid = {
    payer_name: 'João da Silva',
    payer_email: 'joao@exemplo.com',
    // CPF válido de teste (dígitos verificadores corretos).
    payer_cpf_cnpj: '529.982.247-25',
  };

  it('aceita CPF válido com máscara', () => {
    expect(checkoutPayerSchema.safeParse(valid).success).toBe(true);
  });

  it('aceita CPF válido sem máscara', () => {
    expect(
      checkoutPayerSchema.safeParse({ ...valid, payer_cpf_cnpj: '52998224725' }).success,
    ).toBe(true);
  });

  /*
   * 🔴 O backend aceitaria isto: lá o campo é `@Matches(/^[\d.\-/]{11,18}$/)`,
   * sem dígito verificador. O CPF errado passaria, a assinatura seria criada no
   * Asaas e falharia LÁ — depois de o músico já ter saído do app, sem nenhuma
   * pista de que o problema foi o que ele digitou.
   */
  it('recusa CPF com dígito verificador errado, que o backend deixaria passar', () => {
    const result = checkoutPayerSchema.safeParse({ ...valid, payer_cpf_cnpj: '111.111.111-11' });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toBe('CPF inválido');
  });

  it('escolhe o checksum pelo comprimento — CNPJ não é reprovado como CPF', () => {
    const cnpj = checkoutPayerSchema.safeParse({ ...valid, payer_cpf_cnpj: '11.222.333/0001-81' });
    expect(cnpj.success).toBe(true);
  });

  it('recusa documento com comprimento que não é nem CPF nem CNPJ', () => {
    const result = checkoutPayerSchema.safeParse({ ...valid, payer_cpf_cnpj: '12345' });
    expect(result.success === false && result.error.issues[0]?.message).toBe(
      'Informe um CPF (11 dígitos) ou CNPJ (14)',
    );
  });

  it('recusa e-mail inválido e nome curto demais', () => {
    expect(checkoutPayerSchema.safeParse({ ...valid, payer_email: 'joao@' }).success).toBe(false);
    expect(checkoutPayerSchema.safeParse({ ...valid, payer_name: 'Jo' }).success).toBe(false);
  });
});

describe('hydratePlanPricing', () => {
  it('devolve o catálogo local intacto quando a rota não respondeu', () => {
    expect(hydratePlanPricing(MUSICIAN_PLANS, undefined)).toBe(MUSICIAN_PLANS);
    expect(hydratePlanPricing(MUSICIAN_PLANS, [])).toBe(MUSICIAN_PLANS);
  });

  /*
   * 🔴 O teste que fecha o item 11.14e: enquanto o preço vivia só no app,
   * mudá-lo no backend não quebrava nada — o paywall anunciava o valor antigo e
   * a fatura vinha com outro, sem erro em lugar nenhum.
   */
  it('substitui o preço local pelo do backend', () => {
    const hydrated = hydratePlanPricing(MUSICIAN_PLANS, [
      {
        tier: 'pro',
        pricing: {
          monthly_price_brl: 99.9,
          annual_price_brl: 999,
          annual_savings_brl: 199.8,
          annual_discount_percent: 17,
        },
      },
    ]);

    const pro = hydrated.find((plan) => plan.tier === 'pro')!;
    expect(pro.monthlyPriceBrl).toBe(99.9);
    expect(pro.annualPriceBrl).toBe(999);
    expect(pro.annualDiscountPercent).toBe(17);
  });

  it('preserva a copy local — o backend não devolve tagline nem keyStats', () => {
    const localPro = MUSICIAN_PLANS.find((plan) => plan.tier === 'pro')!;
    const hydrated = hydratePlanPricing(MUSICIAN_PLANS, [
      {
        tier: 'pro',
        pricing: {
          monthly_price_brl: 1,
          annual_price_brl: 1,
          annual_savings_brl: 0,
          annual_discount_percent: 0,
        },
      },
    ]);

    const pro = hydrated.find((plan) => plan.tier === 'pro')!;
    expect(pro.tagline).toBe(localPro.tagline);
    expect(pro.features).toEqual(localPro.features);
  });

  it('mantém o preço local de um tier que o backend não conhece', () => {
    // Resposta parcial não deve apagar um plano da tela.
    const hydrated = hydratePlanPricing(MUSICIAN_PLANS, [
      {
        tier: 'pro',
        pricing: {
          monthly_price_brl: 1,
          annual_price_brl: 1,
          annual_savings_brl: 0,
          annual_discount_percent: 0,
        },
      },
    ]);

    const localEssential = MUSICIAN_PLANS.find((plan) => plan.tier === 'essential')!;
    const essential = hydrated.find((plan) => plan.tier === 'essential')!;
    expect(essential.monthlyPriceBrl).toBe(localEssential.monthlyPriceBrl);
  });
});
