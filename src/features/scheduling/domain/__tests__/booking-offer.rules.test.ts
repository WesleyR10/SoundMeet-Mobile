import {
  buildOfferReplyMessage,
  describeOfferError,
  formatOfferFee,
  formatOfferTimes,
  offerStage,
  offerTone,
  resolveOfferBookingId,
} from '../booking-offer.rules';
import type { BookingOffer } from '../booking-offer.types';

const NOW = new Date('2026-09-18T12:00:00.000Z');

function makeOffer(overrides: Partial<BookingOffer> = {}): BookingOffer {
  return {
    id:               'bk-1',
    establishment_id: 'est-1',
    musician_id:      'mus-1',
    band_id:          null,
    start_at:         '2026-10-03T01:00:00.000Z',
    end_at:           '2026-10-03T04:00:00.000Z',
    fee:              900,
    notes:            null,
    status:           'pending',
    proposed_by:      'establishment',
    expires_at:       '2026-09-20T12:00:00.000Z',
    confirmed_at:     null,
    ...overrides,
  };
}

describe('offerStage — de quem é a vez', () => {
  it('proposta da casa, no prazo: a vez é do artista (único estágio com botões)', () => {
    expect(offerStage(makeOffer(), NOW)).toBe('awaiting_me');
  });

  it('proposta feita pelo próprio artista: a vez é da casa', () => {
    expect(offerStage(makeOffer({ proposed_by: 'musician' }), NOW)).toBe('awaiting_them');
  });

  it('🔴 pendente com o prazo vencido já é vencida — o backend só marca no próximo toque', () => {
    expect(offerStage(makeOffer({ expires_at: '2026-09-18T11:59:00.000Z' }), NOW)).toBe('expired');
  });

  it('🔴 cancelada ANTES de confirmar é "não aceita"; DEPOIS, "show cancelado"', () => {
    expect(offerStage(makeOffer({ status: 'cancelled' }), NOW)).toBe('not_accepted');
    expect(
      offerStage(makeOffer({ status: 'cancelled', confirmed_at: '2026-09-18T10:00:00.000Z' }), NOW),
    ).toBe('cancelled');
  });

  it('o tom acompanha o estágio', () => {
    expect(offerTone('awaiting_me')).toBe('pending');
    expect(offerTone('confirmed')).toBe('positive');
    expect(offerTone('cancelled')).toBe('negative');
    expect(offerTone('not_accepted')).toBe('neutral');
  });
});

describe('resolveOfferBookingId — as duas portas da conversa', () => {
  it('conversa aberta por "propor um show" aponta direto para o booking', () => {
    expect(resolveOfferBookingId({ booking_id: 'bk-9', inquiry_id: null }, [])).toBe('bk-9');
  });

  it('conversa de inquiry: a proposta é o booking em que ela virou', () => {
    expect(
      resolveOfferBookingId({ booking_id: null, inquiry_id: 'inq-1' }, [
        { id: 'inq-0', booking_id: 'bk-0' },
        { id: 'inq-1', booking_id: 'bk-1' },
      ]),
    ).toBe('bk-1');
  });

  it('inquiry que ainda não virou proposta não tem booking', () => {
    expect(
      resolveOfferBookingId({ booking_id: null, inquiry_id: 'inq-1' }, [{ id: 'inq-1', booking_id: null }]),
    ).toBeNull();
  });
});

describe('formatação', () => {
  it('cachê nulo é "A combinar", nunca R$ 0,00', () => {
    expect(formatOfferFee(null)).toBe('A combinar');
    expect(formatOfferFee(900)).toMatch(/R\$\s?900,00/);
  });

  it('show que atravessa a meia-noite é marcado', () => {
    // 3 horas de duração começando às 23h locais sempre cruzam a meia-noite,
    // em qualquer fuso do aparelho que rode o teste.
    const start = new Date(2026, 9, 2, 23, 0).toISOString();
    const end = new Date(2026, 9, 3, 2, 0).toISOString();
    expect(formatOfferTimes(start, end)).toEqual({ range: '23:00 → 02:00', overnight: true });
  });
});

describe('buildOfferReplyMessage', () => {
  it('aceite e recusa deixam rastro legível na conversa', () => {
    expect(buildOfferReplyMessage('accept', makeOffer())).toMatch(/^✅ Aceitei a proposta de /);
    expect(buildOfferReplyMessage('decline', makeOffer())).toMatch(/^Não vou poder aceitar/);
  });
});

describe('describeOfferError', () => {
  it('traduz o que o confirm revalida na agenda', () => {
    expect(describeOfferError(422, 'Musician is unavailable for this period')).toContain('Agenda');
    expect(describeOfferError(422, 'Musician already has a confirmed booking for this period')).toBe(
      'Você já tem um show confirmado nesse horário.',
    );
    expect(describeOfferError(422, 'Only pending bookings can be confirmed')).toContain('não está mais de pé');
  });

  it('403 numa proposta de banda: só o líder responde', () => {
    expect(describeOfferError(403, 'Forbidden')).toContain('líder');
  });

  it('mensagem desconhecida passa como veio', () => {
    expect(describeOfferError(500, 'algo novo')).toBe('algo novo');
  });
});
