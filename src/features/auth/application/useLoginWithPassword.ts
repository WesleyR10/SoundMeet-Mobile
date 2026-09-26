import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { isApiError } from '@/shared/services/http/types';
import { loginWithPassword } from '@/shared/services/auth/keycloak.service';
import { describeLoginFailure } from '../domain/login-failure';
import type { LoginFormValues } from '../domain/auth.validation';

/**
 * Login por senha (AUTH-3). `success` não navega: o `RootNavigator` reage ao
 * `auth.store`. Os outros desfechos (`establishment-only`,
 * `needs-role-selection`) são decisão da tela.
 */
export function useLoginWithPassword() {
  // Atualizado nos callbacks, nunca no render: a contagem só escolhe o texto
  // do erro (ver `describeLoginFailure`).
  const [rejections, setRejections] = useState(0);

  const mutation = useMutation({
    mutationFn: ({ email, password }: LoginFormValues) => loginWithPassword(email, password),
    onSuccess: () => setRejections(0),
    onError: (error) => {
      if (isApiError(error) && error.response?.status === 401) setRejections((n) => n + 1);
    },
  });

  const errorMessage = mutation.error
    ? describeLoginFailure(
        isApiError(mutation.error) ? (mutation.error.response?.status ?? null) : 0,
        rejections,
      )
    : null;

  return { ...mutation, errorMessage };
}
