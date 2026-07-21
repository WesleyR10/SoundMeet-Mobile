import axios from 'axios';
import { httpClient } from '@/shared/services/http/client';
import { ENV } from '@/shared/services/config/env';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  AddRolePayload,
  AddRoleResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  SocialSignupPayload,
  SocialSignupResponse,
} from '../domain/auth.types';

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await httpClient.post<ApiEnvelope<RegisterResponse>>('/auth/register', payload);
  return data.data;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await httpClient.post<ApiEnvelope<LoginResponse>>('/auth/login', payload);
  return data.data;
}

// Chamada direta via axios (não httpClient): o token da sessão Google pendente
// ainda não está em auth.store, e o interceptor de refresh do httpClient reagiria
// a um 401 tentando renovar a sessão principal (errada ou inexistente).
export async function socialSignup(
  payload: SocialSignupPayload,
  accessToken: string,
): Promise<SocialSignupResponse> {
  const { data } = await axios.post<ApiEnvelope<SocialSignupResponse>>(
    `${ENV.API_BASE_URL}/auth/social-signup`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data.data;
}

// POST /auth/add-role — usuário autenticado adiciona o segundo papel
// (Bloco 10.5). Vai pelo httpClient normal: a sessão principal é a certa e o
// interceptor de refresh pode agir à vontade.
export async function addRole(payload: AddRolePayload): Promise<AddRoleResponse> {
  const { data } = await httpClient.post<ApiEnvelope<AddRoleResponse>>('/auth/add-role', payload);
  return data.data;
}
