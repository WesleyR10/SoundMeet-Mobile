import { useMutation } from '@tanstack/react-query';
import { addRole } from '../infrastructure/auth.api';
import { refreshTokens } from '@/shared/services/auth/keycloak.service';
import { extractApiMessage } from '@/shared/services/http/types';
import type { AddRolePayload } from '../domain/auth.types';

// Multi-role (Bloco 10.5): adiciona o segundo papel e força o token refresh
// silencioso (10.5.4) — a role nova entra no JWT, buildAuthUser deriva
// musicianId/audienceId do sub e o RootNavigator re-renderiza sozinho
// (FanTabs registrada, ou gate needs-wizard pro músico recém-criado).
// React Query aguarda a promise do onSuccess antes de resolver o mutateAsync,
// então quem chama só continua depois do refresh aplicado na store.
export function useAddRole() {
  return useMutation({
    mutationFn: (payload: AddRolePayload) => addRole(payload),
    onSuccess: () => refreshTokens().then(() => undefined),
  });
}

export function getAddRoleErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
