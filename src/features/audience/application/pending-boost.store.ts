import { create } from 'zustand';

/**
 * Cobrança de destaque esperando pagamento.
 *
 * ## Por que precisa existir em memória
 *
 * A cobrança nasce quando o MÚSICO aceita — o fã pode estar em qualquer tela,
 * ou com o app em segundo plano. E o público **não tem push registrado**
 * (`Audience` não tem `push_token`, só `Musician`), então o socket é o único
 * aviso em tempo real. Guardar aqui é o que permite o banner na Home aparecer
 * de qualquer lugar do app.
 *
 * Não persiste em disco de propósito: quem fecha o app recupera pela rota
 * `GET /requests/:id/boost/payment`, que é a fonte da verdade. Um cache em
 * disco poderia ressuscitar um QR já vencido.
 */
export type PendingBoost = {
  request_id:      string;
  tip_id:          string;
  song_title:      string;
  amount:          number;
  qr_code:         string | null;
  copy_paste_code: string | null;
  expires_at:      string | null;
};

type PendingBoostState = {
  pending: PendingBoost | null;
  setPending: (boost: PendingBoost) => void;
  /**
   * Limpa só se for a cobrança indicada.
   *
   * Sem o `request_id`, um evento atrasado de um destaque antigo apagaria o
   * banner de outro que acabou de chegar.
   */
  clear: (requestId?: string) => void;
};

export const usePendingBoostStore = create<PendingBoostState>((set, get) => ({
  pending: null,
  setPending: (boost) => set({ pending: boost }),
  clear: (requestId) => {
    const current = get().pending;
    if (!current) return;
    if (requestId && current.request_id !== requestId) return;
    set({ pending: null });
  },
}));
