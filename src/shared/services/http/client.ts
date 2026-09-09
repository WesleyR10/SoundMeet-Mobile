import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { ENV } from '@/shared/services/config/env';
import { getAccessToken } from '@/shared/services/auth/auth.store';
import { clearLocalSession } from '@/shared/services/auth/clear-session';
import { refreshTokens } from '@/shared/services/auth/keycloak.service';

export const httpClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
});

// ── Request: attach JWT ────────────────────────────────────────────────────────

httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: 401 → refresh → retry ───────────────────────────────────────────

type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };

let isRefreshing = false;
const queue: QueueEntry[] = [];

function drainQueue(err: unknown, token: string | null): void {
  queue.forEach((p) => (err ? p.reject(err) : p.resolve(token!)));
  queue.length = 0;
}

// Rotas públicas cujo 401 é resposta de negócio ("credenciais inválidas"), não
// sessão expirada — nunca devem disparar o fluxo de refresh.
/*
 * Rotas onde 401 significa "credencial inválida", não "sessão expirada" — o
 * interceptor NÃO deve tentar refresh nem derrubar a sessão.
 *
 * `/auth/login` saiu daqui em AUTH-1: a rota foi removida do backend e o login
 * passou a ser Authorization Code + PKCE, que não usa o httpClient (fala com o
 * Keycloak por `expo-auth-session`). `/auth/register` fica: quem cadastra ainda
 * não tem sessão, então um 401 ali é do provedor de identidade.
 */
const AUTH_ENDPOINTS_WITHOUT_REFRESH = ['/auth/register'];

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthEndpoint = AUTH_ENDPOINTS_WITHOUT_REFRESH.some((path) => original?.url?.includes(path));

    if (!original || error.response?.status !== 401 || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Queue concurrent requests while a refresh is already in progress
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return httpClient(original);
      });
    }

    original._retry   = true;
    isRefreshing      = true;

    try {
      // `import` estático, e não `await import()`.
      //
      // Havia aqui um import dinâmico justificado como "evita ciclo
      // http/client <- keycloak.service <- http/client". Esse ciclo NÃO existe:
      // keycloak.service fala com o Keycloak por expo-auth-session e nem ele
      // nem nenhuma das suas dependências (env, auth.store, clear-session,
      // token.storage, pendingGoogleSession.store) importa este arquivo.
      //
      // Não era só código morto: se o `import()` falhar em runtime, a rejeição
      // cai no `catch` abaixo e TODO 401 vira logout forçado, em vez de
      // renovação — o pior desfecho possível justamente no caminho que o
      // SM-018 endureceu. E como o import dinâmico escapa do registry de
      // módulos do Jest, esse caminho era intestável (era o que acontecia:
      // "A dynamic import callback was invoked without --experimental-vm-modules").
      const newToken = await refreshTokens();

      drainQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return httpClient(original);
    } catch (refreshError) {
      drainQueue(refreshError, null);
      // Logout reativo: RootNavigator re-renderiza sozinho para o AuthStack.
      // `clearLocalSession` e não `authStore.clear()` — limpar só a memória
      // deixaria o refresh token inválido gravado no SecureStore depois de a
      // UI já ter declarado a sessão encerrada (SM-018).
      await clearLocalSession();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
