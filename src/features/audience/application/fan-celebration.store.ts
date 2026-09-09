import { create } from 'zustand';
import type { CelebrationPayload } from '../domain/boost-notifications.types';

/**
 * Fila de uma celebração só — a comemoração de gorjeta confirmada.
 *
 * ## A deduplicação por `tip_id` não é otimização, é correção
 *
 * 🔴 Um pedido com destaque dispara **dois** eventos do backend:
 * `tip.confirmed` (toda gorjeta) e `request.boost.paid` (o destaque, mais
 * rico). Sem deduplicar, a celebração tocaria duas vezes — e a segunda por
 * cima da primeira, com menos informação.
 *
 * O mesmo `tip_id` também chega pelo caminho de cold start (o app consulta
 * `GET /tips/:id` ao abrir): `seen` garante que quem já comemorou não comemore
 * de novo ao voltar para a tela.
 */
type FanCelebrationState = {
  current: CelebrationPayload | null;
  /** `tip_id`s já celebrados nesta sessão. */
  seen: string[];
  celebrate: (payload: CelebrationPayload) => void;
  dismiss: () => void;
};

export const useFanCelebrationStore = create<FanCelebrationState>((set, get) => ({
  current: null,
  seen: [],
  celebrate: (payload) => {
    const { seen, current } = get();

    /*
     * 🔴 Mesma gorjeta chegando de novo: ENRIQUECE em vez de descartar.
     *
     * A ordem entre `tip.confirmed` e `request.boost.paid` não é garantida —
     * são handlers distintos no backend. Se o pobre chegasse primeiro e o rico
     * fosse descartado, o fã veria a celebração sem música nem dedicatória,
     * que é justamente o que ele pagou para aparecer.
     */
    if (current?.tip_id === payload.tip_id) {
      set({
        current: {
          ...current,
          song_title: payload.song_title ?? current.song_title,
          dedication: payload.dedication ?? current.dedication,
          musician_id: payload.musician_id ?? current.musician_id,
        },
      });
      return;
    }

    if (seen.includes(payload.tip_id)) return;
    // Uma celebração por vez: a que já está na tela termina antes da próxima.
    if (current) return;

    set({ current: payload, seen: [...seen, payload.tip_id] });
  },
  dismiss: () => set({ current: null }),
}));
