import { useMutation } from '@tanstack/react-query';
import { isApiError } from '@/shared/services/http/types';
import { requestPasswordReset } from '../infrastructure/auth.api';

export function usePasswordReset() {
  return useMutation({ mutationFn: (email: string) => requestPasswordReset(email) });
}

// A rota só falha por limite (3/min) ou rede — o backend responde igual para
// e-mail com e sem conta, inclusive quando o envio dá errado.
export function getPasswordResetErrorMessage(error: unknown): string {
  if (isApiError(error) && error.response?.status === 429) {
    return 'Muitos pedidos seguidos. Espere um minuto e tente de novo.';
  }
  return 'Não conseguimos enviar agora. Confira sua internet e tente de novo.';
}
