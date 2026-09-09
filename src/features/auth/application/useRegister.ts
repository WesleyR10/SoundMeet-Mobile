import { useMutation } from '@tanstack/react-query';
import { registerUser } from '../infrastructure/auth.api';
import { applyTokenSession } from '@/shared/services/auth/session';
import { extractApiMessage } from '@/shared/services/http/types';
import type { RegisterPayload, RegisterResponse } from '../domain/auth.types';

// Sessão a partir do POST /auth/register — sem PKCE/browser.
//
// ⚠️ O grant de senha continua existindo, mas AGORA no client CONFIDENCIAL
// `soundmeet-registration`, cujo secret vive só no backend. O `soundmeet-mobile`
// (público, embarcado no APK) tem `directAccessGrantsEnabled: false` desde o
// AUTH-1, então o app nunca fala `grant_type=password` com o Keycloak: quem
// fala é a nossa API, atrás do @Throttle. O LOGIN não tem grant nenhum — é
// Authorization Code + PKCE em `keycloak.service.ts`.
//
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
