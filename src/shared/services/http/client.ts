import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { ENV } from '@/shared/services/config/env';
import { getAccessToken, useAuthStore } from '@/shared/services/auth/auth.store';

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
// Lazy import to avoid circular dependency at module parse time

type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };

let isRefreshing = false;
const queue: QueueEntry[] = [];

function drainQueue(err: unknown, token: string | null): void {
  queue.forEach((p) => (err ? p.reject(err) : p.resolve(token!)));
  queue.length = 0;
}

// Rotas públicas cujo 401 é resposta de negócio ("credenciais inválidas"), não
// sessão expirada — nunca devem disparar o fluxo de refresh.
const AUTH_ENDPOINTS_WITHOUT_REFRESH = ['/auth/login'];

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
      // Lazy import avoids circular dep (http/client ← keycloak.service ← http/client)
      const { refreshTokens } = await import('@/shared/services/auth/keycloak.service');
      const newToken = await refreshTokens();

      drainQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return httpClient(original);
    } catch (refreshError) {
      drainQueue(refreshError, null);
      // Reactive logout: RootNavigator re-renders automatically to AuthStack
      useAuthStore.getState().clear();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
