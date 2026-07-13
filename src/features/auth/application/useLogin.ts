import { useMutation } from '@tanstack/react-query';
import { loginUser } from '../infrastructure/auth.api';
import { applyTokenSession } from '@/shared/services/auth/session';
import { extractApiMessage } from '@/shared/services/http/types';
import type { LoginPayload } from '../domain/auth.types';

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    onSuccess:  (data) => applyTokenSession(data),
  });
}

export function getLoginErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
