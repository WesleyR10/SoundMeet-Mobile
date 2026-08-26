import { useMutation } from '@tanstack/react-query';
import { loginUser } from '../infrastructure/auth.api';
import { applyTokenSession } from '@/shared/services/auth/session';
import { extractApiMessage } from '@/shared/services/http/types';
import type { LoginPayload, LoginResponse } from '../domain/auth.types';

export const ESTABLISHMENT_LOGIN_MESSAGE =
  'Esta é uma conta de estabelecimento. Acesse o painel pelo site do SoundMeet.';

export class EstablishmentLoginNotSupportedError extends Error {
  constructor() {
    super(ESTABLISHMENT_LOGIN_MESSAGE);
    this.name = 'EstablishmentLoginNotSupportedError';
  }
}

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    onSuccess:  (data: LoginResponse) => {
      // O backend autentica estabelecimento nesta mesma rota, mas o app não tem
      // navegação para essa persona (web-only, por decisão de produto). Barrar
      // aqui é obrigatório: applyTokenSession só distingue musician de audience
      // e gravaria o id do estabelecimento como audienceId, corrompendo a sessão
      // sem nenhum erro visível.
      if (data.role === 'establishment') {
        throw new EstablishmentLoginNotSupportedError();
      }
      return applyTokenSession({ ...data, role: data.role });
    },
  });
}

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof EstablishmentLoginNotSupportedError) {
    return error.message;
  }
  return extractApiMessage(error);
}
