import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scanQr } from '../infrastructure/audience.api';
import type { ScanQrPayload } from '../domain/audience.types';
import { audienceProfileKey } from './useAudience';
import { audiencePointsKey, audienceBadgesKey } from './useAudienceGamification';

// Scan aplica pontuação/badges no backend (ver ScanQRUseCase) — invalida
// também o cache de gamificação, não só o perfil, senão GamificationScreen
// mostra pontos/badges desatualizados até o staleTime de 60s expirar.
// audienceId aqui é o mesmo valor que userId/`sub` do Keycloak pra um
// usuário com role audience (buildAuthUser deriva os dois do mesmo claim).
export function useScanQr(audienceId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ScanQrPayload) => scanQr(audienceId!, payload),
    onSuccess: () => {
      if (!audienceId) return;
      queryClient.invalidateQueries({ queryKey: audienceProfileKey(audienceId) });
      queryClient.invalidateQueries({ queryKey: audiencePointsKey(audienceId) });
      queryClient.invalidateQueries({ queryKey: audienceBadgesKey(audienceId) });
    },
  });
}
