/**
 * Avaliação do estabelecimento pelo músico — tipos do domínio.
 *
 * ⚠️ **Por que isto mora em `features/contract`.** Avaliar é sobre a RESERVA, não
 * sobre o contrato; o contrato só é a porta de entrada porque, no app do músico,
 * **ele é a tela do show** (ver `navigation/types.ts`: não existe lista de
 * bookings aqui). FSD proíbe `features/contract` importar de
 * `features/scheduling`, então o recorte vive junto de quem o consome. Quando um
 * segundo consumidor aparecer, promover para `shared/` — foi exatamente o
 * caminho de `StageTechSpecSection`.
 */

/** `BookingStatusEnum` — core/shared/domain/value-objects/booking-status.vo.ts */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'completed';

/**
 * Só o que esta feature lê de `GET /scheduling/bookings/:id`.
 *
 * Recorte deliberado: o `BookingPresenter` devolve ~25 campos (buffers, janelas
 * de cancelamento, trilha de datas) e declarar todos aqui criaria um segundo
 * lugar para manter sincronizado sem nenhum ganho — mesma decisão de
 * `InquiryEstablishment`.
 */
export interface ReviewableBooking {
  id:               string;
  establishment_id: string;
  status:           BookingStatus;
  /** ISO 8601. */
  end_at:           string;
}

/**
 * Corpo de `POST /establishments/:id/ratings`.
 *
 * 🔴 **Não existe `author_id` aqui, e isso é a regra.** O backend deriva o autor
 * do JWT (`resolveReviewAuthor`); aceitar autoria pelo corpo permitiria avaliar
 * em nome de terceiros. O `:id` da URL é o ALVO, nunca quem avalia.
 */
export interface SubmitReviewPayload {
  rating:       number;
  comment:      string | null;
  context_type: 'booking';
  context_id:   string;
}

/** `ReviewPresenter` do backend. */
export interface Review {
  id:           string;
  target_type:  string;
  target_id:    string;
  author_type:  string;
  author_id:    string;
  rating:       number;
  comment:      string | null;
  context_type: string;
  context_id:   string;
  created_at:   string;
  updated_at:   string;
}

/**
 * `SubmitReviewPresenter` — a avaliação **e a média já recalculada**.
 *
 * O `target_rating` vem junto de propósito, para o cliente não precisar de um
 * GET extra só para mostrar a nova média da casa depois de avaliar.
 */
export interface SubmitReviewResult {
  review:        Review;
  target_rating: { average: number; total: number };
}
