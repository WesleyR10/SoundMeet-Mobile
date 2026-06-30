import axios from 'axios';
import { ENV } from '@/shared/services/config/env';

export const httpClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
});

// [BLOCO 1] — JWT attach: adicionar token do auth.store aqui
httpClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

// [BLOCO 1] — 401 → refresh token → retry; logout se refresh falhar
httpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
