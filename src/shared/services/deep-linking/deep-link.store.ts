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
  /**
   * Músico apontado por um App Link do QR code, tocado antes de a sessão
   * resolver.
   *
   * Mesmo relay do token de repertório, e pelo mesmo motivo: o perfil público
   * do músico vive dentro do stack do fã, que só existe montado depois do
   * login. Sem o relay, o scan do adesivo no cold start abriria o app na Home
   * e o fã não faria ideia de por que — que é justamente o momento de
   * aquisição que o QR https veio resolver.
   */
  pendingMusicianId: string | null;
  setPendingMusicianId: (musicianId: string) => void;
  clearPendingMusicianId: () => void;
};

export const useDeepLinkStore = create<DeepLinkState>((set) => ({
  pendingSharedRepertoireToken: null,
  setPendingSharedRepertoireToken: (token) => set({ pendingSharedRepertoireToken: token }),
  clearPendingSharedRepertoireToken: () => set({ pendingSharedRepertoireToken: null }),
  pendingMusicianId: null,
  setPendingMusicianId: (musicianId) => set({ pendingMusicianId: musicianId }),
  clearPendingMusicianId: () => set({ pendingMusicianId: null }),
}));
