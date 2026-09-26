// A proposta de show (booking) que o estabelecimento manda pela conversa.
// Espelha `BookingPresenter` do backend — só os campos que o app lê.
// Domínio puro, sem imports de RN/Expo.
//
// 🔴 Até 18/set/2026 o app NÃO conhecia booking nenhum: `GET
// /scheduling/bookings` e `POST .../confirm` não tinham chamador em `src/`, e
// "Propor um show" no painel mandava data e cachê para um músico que não tinha
// onde aceitar. O painel dizia "quem aceita é o artista, pelo aplicativo" —
// e o aplicativo não tinha a tela.

export type BookingOfferStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'expired';

export type BookingOfferSide = 'establishment' | 'musician' | 'band';

export interface BookingOffer {
  id:               string;
  establishment_id: string;
  musician_id:      string | null;
  band_id:          string | null;
  start_at:         string;
  end_at:           string;
  /** `null` é "a combinar", nunca zero. */
  fee:              number | null;
  notes:            string | null;
  status:           BookingOfferStatus;
  /** Quem fez a última proposta — decide de quem é a vez de responder. */
  proposed_by:      BookingOfferSide | null;
  expires_at:       string | null;
  confirmed_at:     string | null;
}
