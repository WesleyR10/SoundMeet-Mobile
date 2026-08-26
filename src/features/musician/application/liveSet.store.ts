import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const STORAGE_KEY = 'sm_active_live_set';

export type ActiveLiveSet = {
  performanceId:   string;
  eventId:         string;
  establishmentId: string;
  bandId:          string | null;
  startedAt:       string;
};

type LiveSetState = {
  activeSet: ActiveLiveSet | null;
  /** false até `restoreActiveSet()` resolver na startup. */
  isRestoring: boolean;
  setActiveSet: (set: ActiveLiveSet) => void;
  clearActiveSet: () => void;
  restore: () => Promise<void>;
};

/**
 * Qual set está aberto — o interruptor que separa ensaio de show.
 *
 * 🔴 **É esta flag que decide se o Play Mode transmite.** Sem set aberto, o Play
 * Mode continua sendo o que sempre foi: privado, silencioso. Registrar
 * automaticamente cada música que o músico abre transformaria a rotina de
 * estudo em histórico público e envenenaria currículo, relatório e setlist com
 * a mesma música repetida 14 vezes numa tarde de quarta.
 *
 * ## Por que persiste em disco
 *
 * Um show dura horas e o app é fechado, morre por bateria, ou o telefone
 * reinicia no meio. Perder o `performanceId` deixaria o set aberto para sempre
 * no servidor — sem relatório, e bloqueando a abertura de um novo pelo índice
 * parcial único.
 *
 * `expo-secure-store` porque é o que o app já tem (`wizard.storage.ts`,
 * `token.storage.ts`): trazer `AsyncStorage` só para isto adicionaria uma
 * dependência NATIVA, e dependência nativa nova custa rebuild do EAS.
 *
 * Escrita é fire-and-forget de propósito: o estado em memória é a verdade da
 * sessão corrente, e esperar o disco atrasaria o toque do botão no palco.
 */
export const useLiveSetStore = create<LiveSetState>((set) => ({
  activeSet:   null,
  isRestoring: true,

  setActiveSet: (activeSet) => {
    set({ activeSet });
    void SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(activeSet));
  },

  clearActiveSet: () => {
    set({ activeSet: null });
    void SecureStore.deleteItemAsync(STORAGE_KEY);
  },

  restore: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      set({
        activeSet: raw ? (JSON.parse(raw) as ActiveLiveSet) : null,
        isRestoring: false,
      });
    } catch {
      // JSON corrompido não pode travar a startup nem deixar `isRestoring`
      // pendurado — sem set é o estado seguro (Play Mode privado).
      set({ activeSet: null, isRestoring: false });
    }
  },
}));
