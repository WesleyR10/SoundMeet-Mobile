import { create } from 'zustand';

// Guarda o token de um link de repertório compartilhado tocado ANTES do
// usuário estar logado (cold start via link, ou app aberto na tela de
// login) — sem isso, o deep link seria descartado silenciosamente assim
// que o RootNavigator troca pra AuthStack. RootNavigator observa esse
// campo e navega pra SharedRepertoire assim que isAuthenticated vira true
// (ver useDeepLinkListener.ts). Não persiste em disco de propósito —
// mesma decisão de escopo do resto da sessão de auth: se o usuário matar o
// app antes de terminar o login, tocar o link de novo é aceitável.
type DeepLinkState = {
  pendingSharedRepertoireToken: string | null;
  setPendingSharedRepertoireToken: (token: string) => void;
  clearPendingSharedRepertoireToken: () => void;
};

export const useDeepLinkStore = create<DeepLinkState>((set) => ({
  pendingSharedRepertoireToken: null,
  setPendingSharedRepertoireToken: (token) => set({ pendingSharedRepertoireToken: token }),
  clearPendingSharedRepertoireToken: () => set({ pendingSharedRepertoireToken: null }),
}));
