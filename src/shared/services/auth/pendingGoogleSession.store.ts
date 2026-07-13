import { create } from 'zustand';

// Sessão transiente de um login Google cuja identidade Keycloak ainda não tem
// role/aggregate no SoundMeet (roles vazias no JWT). Nunca persiste em
// SecureStore — se o app fechar no meio do fluxo, o usuário só repete o toque
// no Google; nenhum token órfão sobrevive a um restart. Lida só por
// RoleSelectionScreen, RegisterScreen e CompleteMusicianSignupScreen.
export interface PendingGoogleSession {
  accessToken:  string;
  refreshToken: string;
  expiresAt:    number; // Unix ms
  email:        string | null;
}

interface PendingGoogleSessionState {
  session: PendingGoogleSession | null;
}

interface PendingGoogleSessionActions {
  setSession: (session: PendingGoogleSession) => void;
  clear:      () => void;
}

type PendingGoogleSessionStore = PendingGoogleSessionState & PendingGoogleSessionActions;

export const usePendingGoogleSessionStore = create<PendingGoogleSessionStore>((set) => ({
  session: null,

  setSession: (session) => set({ session }),
  clear:      () => set({ session: null }),
}));
