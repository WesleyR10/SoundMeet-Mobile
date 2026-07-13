import { useMutation } from '@tanstack/react-query';
import { registerUser } from '../infrastructure/auth.api';
import { applyTokenSession } from '@/shared/services/auth/session';
import { extractApiMessage } from '@/shared/services/http/types';
import type { RegisterPayload, RegisterResponse } from '../domain/auth.types';

// Sessão a partir do POST /auth/register (Direct Access Grants — sem PKCE/browser).
// Diferente do fluxo PKCE, já sabemos o profile_id na resposta, então
// musicianId/audienceId são populados imediatamente, sem esperar o fetch de perfil do Bloco 2.
async function applyRegisterSession(
  response: RegisterResponse,
  payload: RegisterPayload,
): Promise<void> {
  await applyTokenSession(response, (user) => {
    if (response.role === 'musician') {
      user.cpf = payload.cpf ?? null;
      user.phone = payload.phone ?? null;
    }
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerUser(payload),
    onSuccess:  (data, payload) => applyRegisterSession(data, payload),
  });
}

export function getRegisterErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
