import { canReviewEstablishment, submitReviewSchema } from '../review.validation';
import type { BookingStatus, ReviewableBooking } from '../review.types';

function booking(status: BookingStatus): ReviewableBooking {
  return {
    id:               'b1',
    establishment_id: 'e1',
    status,
    end_at:           '2026-08-20T23:00:00.000Z',
  };
}

describe('canReviewEstablishment', () => {
  it('libera a avaliação quando o show individual foi concluído', () => {
    expect(
      canReviewEstablishment({ booking: booking('completed'), isBandShow: false }),
    ).toBe(true);
  });

  // `confirmed` é o caso perigoso: a data já passou, o show aconteceu de fato,
  // mas o job horário ainda não promoveu o status — e o backend responde 403.
  // Oferecer o botão aqui seria prometer uma ação que falha.
  it.each<BookingStatus>(['pending', 'confirmed', 'cancelled', 'expired'])(
    'não libera com status %s',
    (status) => {
      expect(
        canReviewEstablishment({ booking: booking(status), isBandShow: false }),
      ).toBe(false);
    },
  );

  it('não libera enquanto a reserva não carregou', () => {
    expect(canReviewEstablishment({ booking: null, isBandShow: false })).toBe(false);
  });

  it('🔴 não libera em show de BANDA, mesmo concluído', () => {
    // O backend deriva o autor do JWT (author_id = musician.id) e exige que ele
    // seja parte da reserva; em show de banda a parte é o band_id, então nenhum
    // integrante passa — nem o líder. O botão falharia 100% das vezes.
    expect(
      canReviewEstablishment({ booking: booking('completed'), isBandShow: true }),
    ).toBe(false);
  });
});

describe('submitReviewSchema', () => {
  it('aceita nota sem comentário', () => {
    expect(submitReviewSchema.safeParse({ rating: 5 }).success).toBe(true);
  });

  it('rejeita nota fora de 1..5', () => {
    expect(submitReviewSchema.safeParse({ rating: 0 }).success).toBe(false);
    expect(submitReviewSchema.safeParse({ rating: 6 }).success).toBe(false);
  });

  it('rejeita nota fracionada — o backend exige inteiro', () => {
    expect(submitReviewSchema.safeParse({ rating: 4.5 }).success).toBe(false);
  });

  it('rejeita comentário acima do limite do backend', () => {
    const result = submitReviewSchema.safeParse({ rating: 4, comment: 'a'.repeat(1001) });
    expect(result.success).toBe(false);
  });
});
