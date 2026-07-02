import { create } from 'zustand';

export interface AuthUser {
  userId:          string | null; // Keycloak `sub` claim
  musicianId:      string | null;
  audienceId:      string | null;
  establishmentId: string | null;
  roles:           string[];
  email:           string | null;
}

interface AuthState {
  user:            AuthUser | null;
  accessToken:     string | null;
  isAuthenticated: boolean;
  // false no Bloco 0 (sem check de token); [BLOCO 1] seta true na startup
  // e volta a false após verificar o token armazenado no SecureStore
  isLoading:       boolean;
}

interface AuthActions {
  setUser:        (user: AuthUser | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading:     (loading: boolean) => void;
  clear:          () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  user:            null,
  accessToken:     null,
  isAuthenticated: false,
  isLoading:       true, // true until restoreSession() resolves on startup

  setUser:        (user) => set({ user, isAuthenticated: user !== null }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setLoading:     (isLoading) => set({ isLoading }),
  clear:          () => set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
}));

// Acesso imperativo para uso fora de componentes (ex: interceptors Axios no Bloco 1)
export const getAuthState   = () => useAuthStore.getState();
export const getAccessToken = () => useAuthStore.getState().accessToken;
