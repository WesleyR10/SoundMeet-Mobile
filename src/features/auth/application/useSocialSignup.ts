import { useMutation } from '@tanstack/react-query';
import { socialSignup } from '../infrastructure/auth.api';
import { refreshWithRefreshToken } from '@/shared/services/auth/keycloak.service';
import { applyTokenSession } from '@/shared/services/auth/session';
import { usePendingGoogleSessionStore } from '@/shared/services/auth/pendingGoogleSession.store';
import { extractApiMessage } from '@/shared/services/http/types';
import type { SocialSignupPayload, SocialSignupResponse } from '../domain/auth.types';

// O token da sessão Google pendente foi emitido ANTES do social-signup atribuir
// a role — buildAuthUser nele (dentro de applyTokenSession) ainda leria roles: [].
// Por isso, antes de aplicar a sessão, damos refresh (o Keycloak recalcula
// realm_access.roles), igual ao fix já aplicado no fluxo de restore de sessão
// (roadmap 1.14). O resto do commit de sessão é o mesmo núcleo compartilhado
// com register/login — sem duplicar saveTokens/buildAuthUser/setUser aqui.
async function applySocialSignupSession(
  response: SocialSignupResponse,
  payload: SocialSignupPayload,
): Promise<void> {
  const pending = usePendingGoogleSessionStore.getState().session;
  if (!pending) {
    throw new Error('Sessão de login social pendente não encontrada');
  }

  try {
    const refreshed = await refreshWithRefreshToken(pending.refreshToken);

    await applyTokenSession(
      {
        access_token:  refreshed.accessToken,
        refresh_token: refreshed.refreshToken ?? pending.refreshToken,
        expires_in:    refreshed.expiresIn ?? 900,
        role:          response.role,
        profile_id:    response.profile_id,
      },
      (user) => {
        if (response.role === 'musician') {
          user.cpf = payload.cpf ?? null;
          user.phone = payload.phone ?? null;
        }
      },
    );
  } finally {
    usePendingGoogleSessionStore.getState().clear();
  }
}

export function useSocialSignup() {
  return useMutation({
    mutationFn: (payload: SocialSignupPayload) => {
      const pending = usePendingGoogleSessionStore.getState().session;
      if (!pending) {
        return Promise.reject(new Error('Sessão de login social pendente não encontrada'));
      }
      return socialSignup(payload, pending.accessToken);
    },
    onSuccess: (data, payload) => applySocialSignupSession(data, payload),
  });
}

export function getSocialSignupErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
