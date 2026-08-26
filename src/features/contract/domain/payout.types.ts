/**
 * O que a plataforma retém do cachê deste show.
 *
 * ⚠️ **Vem da CUSTÓDIA, não do plano.** `booking_fee_percentage` é a taxa
 * vigente hoje; o que vale para um show já contratado é o percentual congelado
 * em `BookingEscrow.create`, no dia da emissão. Ler o plano aqui mostraria ao
 * músico um número que não é o dele quando a tabela tivesse sido reajustada
 * entre a contratação e a leitura — e é justamente essa âncora de data que a
 * cláusula de pagamento invoca.
 *
 * Recorte de `BookingEscrowPresenter`; a feature lê só os três valores.
 */
export interface ContractPayout {
  /** Cachê bruto — o mesmo do contrato. */
  amount:       number;
  /** Comissão da plataforma, já congelada. */
  platform_fee: number;
  /** O que cai na conta do músico. */
  net_amount:   number;
}

/**
 * Percentual efetivo, derivado dos valores congelados.
 *
 * Derivado, e não lido de um campo: o percentual não é persistido na custódia —
 * o que se guarda são os valores em reais, exatamente para que a conta exibida
 * seja a mesma que o dinheiro seguiu. `0` quando não há cachê, para não dividir
 * por zero num show de permuta.
 */
export function payoutFeePercentage(payout: ContractPayout): number {
  if (payout.amount <= 0) return 0;
  return (payout.platform_fee / payout.amount) * 100;
}
