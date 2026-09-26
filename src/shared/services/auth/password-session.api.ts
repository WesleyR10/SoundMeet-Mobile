import axios from 'axios';
import { ENV } from '@/shared/services/config/env';
import type { ApiEnvelope } from '@/shared/services/http/types';

export type PasswordSessionTokens = {
  access_token:  string;
  refresh_token: string;
  expires_in:    number;
  token_type:    string;
};

/*
 * Instância própria, e não o `httpClient`: o interceptor dele trata todo 401
 * como "sessão vencida" e tenta RENOVAR — aqui um 401 é resposta de negócio
 * (senha errada, sessão já expirada), e renovar a partir do refresh chamaria
 * esta mesma função em ciclo. Também não anexa Bearer: nenhuma destas rotas
 * precisa de um, e mandar um velho só confundiria o log.
 */
const sessionHttp = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

export async function requestPasswordLogin(
  email: string,
  password: string,
): Promise<PasswordSessionTokens> {
  const { data } = await sessionHttp.post<ApiEnvelope<PasswordSessionTokens>>('/auth/login', {
    email,
    password,
  });
  return data.data;
}

export async function requestSessionRefresh(refreshToken: string): Promise<PasswordSessionTokens> {
  const { data } = await sessionHttp.post<ApiEnvelope<PasswordSessionTokens>>('/auth/refresh', {
    refresh_token: refreshToken,
  });
  return data.data;
}

export async function requestSessionRevocation(refreshToken: string): Promise<void> {
  await sessionHttp.post('/auth/logout', { refresh_token: refreshToken });
}
