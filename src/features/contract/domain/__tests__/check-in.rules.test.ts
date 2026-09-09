import { canCheckIn, hasPerformanceRecord, isCheckInOverdue } from '../check-in.rules';
import type { BookingCheckIn } from '../check-in.types';

/*
 * 🔴 O check-in é o que destranca o cachê em custódia
 * (`ReleaseBookingEscrowUseCase` recusa liberar com `!booking.isCheckedIn`).
 * Os dois lados do erro custam: oferecer o botão na hora errada dá 422; NÃO
 * oferecê-lo deixa o dinheiro do artista retido para sempre, sem erro nenhum.
 */

const INICIO = '2026-09-20T22:00:00.000Z';
const FIM    = '2026-09-21T02:00:00.000Z';

function booking(overrides: Partial<BookingCheckIn> = {}): BookingCheckIn {
  return {
    id:            'b1',
    status:        'confirmed',
    start_at:      INICIO,
    end_at:        FIM,
    checked_in_at: null,
    checked_in_by: null,
    disputed_at:   null,
    ...overrides,
  };
}

describe('canCheckIn', () => {
  const DURANTE = new Date('2026-09-20T23:00:00.000Z');
  const ANTES   = new Date('2026-09-20T20:00:00.000Z');

  it('permite registrar depois que o show começou', () => {
    expect(canCheckIn(booking(), DURANTE)).toBe(true);
  });

  // `booking.aggregate.ts`: "Check-in cannot happen before the show starts".
  it('NÃO permite antes do início', () => {
    expect(canCheckIn(booking(), ANTES)).toBe(false);
  });

  it.each(['pending', 'cancelled', 'completed', 'expired'])(
    'NÃO permite em booking %s — só confirmado',
    (status) => {
      expect(canCheckIn(booking({ status }), DURANTE)).toBe(false);
    },
  );

  // Idempotente no backend: reofertar só produziria um no-op silencioso.
  it('NÃO reoferece quando já registrado', () => {
    expect(canCheckIn(booking({ checked_in_at: '2026-09-20T23:10:00.000Z' }), DURANTE)).toBe(false);
  });

  it('sem booking carregado, não permite', () => {
    expect(canCheckIn(null, DURANTE)).toBe(false);
  });

  it('data inválida vira NÃO-permitido, nunca permitido', () => {
    expect(canCheckIn(booking({ start_at: 'sem data' }), DURANTE)).toBe(false);
  });
});

describe('isCheckInOverdue', () => {
  const DEPOIS = new Date('2026-09-21T04:00:00.000Z');

  it('acusa show terminado sem registro — o cachê está retido', () => {
    expect(isCheckInOverdue(booking(), DEPOIS)).toBe(true);
  });

  it('não acusa durante o show', () => {
    expect(isCheckInOverdue(booking(), new Date('2026-09-21T00:00:00.000Z'))).toBe(false);
  });

  it('não acusa quando já registrado', () => {
    expect(isCheckInOverdue(booking({ checked_in_at: FIM }), DEPOIS)).toBe(false);
  });

  it('não acusa booking cancelado', () => {
    expect(isCheckInOverdue(booking({ status: 'cancelled' }), DEPOIS)).toBe(false);
  });

  it('sem booking carregado, não acusa', () => {
    expect(isCheckInOverdue(null, DEPOIS)).toBe(false);
  });
});

describe('hasPerformanceRecord', () => {
  it.each(['confirmed', 'completed'])('mostra o cartão para booking %s', (status) => {
    expect(hasPerformanceRecord(booking({ status }))).toBe(true);
  });

  it.each(['pending', 'cancelled', 'expired'])(
    'esconde o cartão para booking %s — não houve apresentação a registrar',
    (status) => {
      expect(hasPerformanceRecord(booking({ status }))).toBe(false);
    },
  );

  // Leitura falhou: a tela do contrato é o lugar mais formal do app, e um
  // cartão de erro sobre dado secundário competiria com o documento.
  it('esconde o cartão quando o booking não pôde ser lido', () => {
    expect(hasPerformanceRecord(null)).toBe(false);
  });
});
