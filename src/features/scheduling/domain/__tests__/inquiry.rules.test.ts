import {
  expiryLabel,
  isActionable,
  isBandInquiry,
  statusLabel,
  statusTone,
} from '../inquiry.rules';
import type { Inquiry, InquiryStatus } from '../inquiry.types';

const NOW = new Date('2026-08-14T12:00:00.000Z');

function makeInquiry(overrides: Partial<Inquiry> = {}): Inquiry {
  return {
    id:               'inq-1',
    establishment_id: 'est-1',
    musician_id:      'mus-1',
    band_id:          null,
    event_id:         null,
    subject:          'Sexta ao vivo',
    initial_message:  'Topa tocar?',
    status:           'open',
    expires_at:       '2026-08-21T12:00:00.000Z',
    accepted_at:      null,
    rejected_at:      null,
    rejection_reason: null,
    converted_at:     null,
    booking_id:       null,
    created_at:       '2026-08-14T12:00:00.000Z',
    updated_at:       '2026-08-14T12:00:00.000Z',
    ...overrides,
  };
}

describe('isActionable', () => {
  it('aceita proposta aberta e dentro do prazo', () => {
    expect(isActionable(makeInquiry(), NOW)).toBe(true);
  });

  it('recusa proposta aberta cujo prazo JÁ passou', () => {
    // O agregado do backend roda expire() antes de qualquer transição: uma
    // `open` vencida vira `expired` e o accept devolve 422. Olhar só o status
    // faria a UI oferecer um botão que o servidor recusa.
    const expired = makeInquiry({ expires_at: '2026-08-13T12:00:00.000Z' });

    expect(isActionable(expired, NOW)).toBe(false);
  });

  it('trata prazo ausente como "sem prazo", nunca como vencida', () => {
    expect(isActionable(makeInquiry({ expires_at: null }), NOW)).toBe(true);
  });

  it('não expira em silêncio quando a data é ilegível', () => {
    // Deixa o servidor decidir: sumir com a ação por causa de um parse ruim é
    // pior que tentar e receber um erro claro.
    expect(isActionable(makeInquiry({ expires_at: 'quinta que vem' }), NOW)).toBe(true);
  });

  it.each<InquiryStatus>(['accepted', 'rejected', 'converted', 'expired'])(
    'recusa proposta com status %s',
    (status) => {
      expect(isActionable(makeInquiry({ status }), NOW)).toBe(false);
    },
  );
});

describe('statusLabel', () => {
  it('chama de expirada a proposta aberta fora do prazo', () => {
    const stale = makeInquiry({ expires_at: '2026-08-01T12:00:00.000Z' });

    expect(statusLabel(stale, NOW)).toBe('Expirada');
  });

  it('chama de aguardando a proposta aberta no prazo', () => {
    expect(statusLabel(makeInquiry(), NOW)).toBe('Aguardando você');
  });

  it.each([
    ['accepted' as const, 'Aceita'],
    ['rejected' as const, 'Recusada'],
    ['converted' as const, 'Virou show'],
    ['expired' as const, 'Expirada'],
  ])('rotula %s', (status, expected) => {
    expect(statusLabel(makeInquiry({ status }), NOW)).toBe(expected);
  });
});

describe('statusTone', () => {
  it('marca como pendente só o que ainda dá para decidir', () => {
    expect(statusTone(makeInquiry(), NOW)).toBe('pending');
    expect(statusTone(makeInquiry({ expires_at: '2026-01-01T00:00:00.000Z' }), NOW)).toBe('neutral');
  });

  it('trata aceita e convertida como positivas, recusada como negativa', () => {
    expect(statusTone(makeInquiry({ status: 'accepted' }), NOW)).toBe('positive');
    expect(statusTone(makeInquiry({ status: 'converted' }), NOW)).toBe('positive');
    expect(statusTone(makeInquiry({ status: 'rejected' }), NOW)).toBe('negative');
  });
});

describe('expiryLabel', () => {
  it('arredonda para cima, para o músico não perder o prazo por arredondamento', () => {
    // 30h restantes: "2 dias" é honesto, "1 dia" encurtaria o prazo real.
    const inquiry = makeInquiry({ expires_at: '2026-08-15T18:00:00.000Z' });

    expect(expiryLabel(inquiry, NOW)).toBe('Expira em 2 dias');
  });

  it('diz "hoje" quando falta menos de um dia', () => {
    const inquiry = makeInquiry({ expires_at: '2026-08-14T20:00:00.000Z' });

    expect(expiryLabel(inquiry, NOW)).toBe('Expira hoje');
  });

  it('diz "Expirada" quando o prazo passou', () => {
    const inquiry = makeInquiry({ expires_at: '2026-08-10T12:00:00.000Z' });

    expect(expiryLabel(inquiry, NOW)).toBe('Expirada');
  });

  it('cala quando não há prazo', () => {
    expect(expiryLabel(makeInquiry({ expires_at: null }), NOW)).toBeNull();
  });

  it('cala quando a proposta já saiu de aberta', () => {
    // "Expira em 5 dias" numa proposta já aceita é ruído.
    expect(expiryLabel(makeInquiry({ status: 'accepted' }), NOW)).toBeNull();
  });
});

describe('isBandInquiry', () => {
  it('distingue proposta de banda da proposta direta ao músico', () => {
    // Importa porque só o LÍDER aceita/recusa pela banda (403 caso contrário).
    expect(isBandInquiry(makeInquiry({ band_id: 'band-1' }))).toBe(true);
    expect(isBandInquiry(makeInquiry())).toBe(false);
  });
});
