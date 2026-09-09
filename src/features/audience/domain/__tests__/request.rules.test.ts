import { boostBadge, requestStatusLabel, requestStatusTone } from '../request.rules';
import type { AudienceRequest, RequestBoost, RequestBoostStatus } from '../request.types';

function makeBoost(overrides: Partial<RequestBoost> = {}): RequestBoost {
  return {
    amount: 10,
    dedication: null,
    status: 'promised',
    tip_id: null,
    promised_at: '2026-09-05T20:00:00.000Z',
    charged_at: null,
    paid_at: null,
    cancellation_reason: null,
    is_boosting: true,
    is_public: false,
    ...overrides,
  };
}

function makeRequest(overrides: Partial<AudienceRequest> = {}): AudienceRequest {
  return {
    id: 'req-1',
    song_title: 'Garota de Ipanema',
    artist: 'Tom Jobim',
    status: 'pending',
    boost: null,
    is_boosted: false,
    created_at: '2026-09-05T20:00:00.000Z',
    ...overrides,
  };
}

describe('requestStatusLabel / requestStatusTone', () => {
  it('descreve os quatro estados do pedido pela ótica de quem pediu', () => {
    expect(requestStatusLabel(makeRequest({ status: 'pending' }))).toBe('Aguardando o músico');
    expect(requestStatusLabel(makeRequest({ status: 'accepted' }))).toBe('Aceito');
    expect(requestStatusLabel(makeRequest({ status: 'played' }))).toBe('Tocado');
    expect(requestStatusLabel(makeRequest({ status: 'rejected' }))).toBe('Recusado');
  });

  it('separa o tom de "tocado" do de "aceito"', () => {
    // Tocado é o desfecho que o fã queria — merece o tom "live", não o mesmo
    // verde genérico de "o músico aceitou e ainda não tocou".
    expect(requestStatusTone(makeRequest({ status: 'accepted' }))).toBe('positive');
    expect(requestStatusTone(makeRequest({ status: 'played' }))).toBe('live');
    expect(requestStatusTone(makeRequest({ status: 'rejected' }))).toBe('negative');
  });
});

describe('boostBadge', () => {
  it('não mostra nada quando não há destaque', () => {
    expect(boostBadge(makeRequest())).toBeNull();
  });

  /*
   * 🔴 O teste central deste arquivo: `awaiting_payment` é ação pendente do fã,
   * nunca um destaque já garantido. Se alguém rotulá-lo como confirmado, o fã
   * acredita que pagou, o PIX vence e a dedicatória nunca sobe ao palco.
   */
  it('marca awaiting_payment como AÇÃO, não como destaque garantido', () => {
    const badge = boostBadge(makeRequest({ boost: makeBoost({ status: 'awaiting_payment' }) }));
    expect(badge).toEqual({ label: 'Conclua o PIX', amount: 10, actionable: true });
  });

  it('distingue prometido de pago, e nenhum dos dois é acionável exceto a cobrança', () => {
    expect(boostBadge(makeRequest({ boost: makeBoost({ status: 'promised' }) }))).toMatchObject({
      label: 'Destaque reservado',
      actionable: false,
    });
    expect(boostBadge(makeRequest({ boost: makeBoost({ status: 'paid' }) }))).toMatchObject({
      label: 'Destaque confirmado',
      actionable: false,
    });
  });

  it('não dá crédito visual a destaque que ninguém pagou', () => {
    const statuses: RequestBoostStatus[] = ['expired', 'cancelled'];
    for (const status of statuses) {
      const boost = makeBoost({ status, is_boosting: false });
      expect(boostBadge(makeRequest({ boost }))).toBeNull();
    }
  });
});
