import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '../infrastructure/analytics.api';

export const musicianAnalyticsKey = (musicianId: string) => ['musician', musicianId, 'analytics'] as const;

// Analytics pós-evento (Bloco 6) — dado agregado all-time (sem escopo por
// evento, ver roadmap-mobile.md), não é ao vivo/socket-driven, então
// staleTime mais longo que a carteira (useMusicianWallet, 30s).
export function useAnalytics(musicianId: string | null) {
  return useQuery({
    queryKey:  musicianId ? musicianAnalyticsKey(musicianId) : ['musician', 'analytics', 'disabled'],
    queryFn:   () => getAnalytics(musicianId!),
    enabled:   !!musicianId,
    staleTime: 60 * 1_000,
  });
}
