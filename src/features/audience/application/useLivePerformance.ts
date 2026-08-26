import { useQuery } from '@tanstack/react-query';
import {
  getLivePerformance,
  getMusicianResume,
} from '@/shared/services/performance/performance.api';

export const livePerformanceKey = (musicianId: string, eventId: string) =>
  ['performance', 'live', musicianId, eventId] as const;

export const musicianResumeKey = (musicianId: string) =>
  ['musician', musicianId, 'resume'] as const;

/**
 * Intervalo de polling do "tocando agora".
 *
 * 20s por decisão, não por falta de socket: uma música dura minutos, então a
 * defasagem é imperceptível no contexto. Um push exigiria uma room `event:${id}`
 * no `NotificationsGateway`, que hoje só entra em rooms derivadas de claims do
 * JWT — superfície de autorização nova para ganhar segundos que ninguém percebe.
 */
const LIVE_POLL_MS = 20_000;

/**
 * O que o músico está tocando AGORA, para o fã que está no show.
 *
 * Sem `eventId` a query nem roda: fora de um evento não existe "agora". É o
 * mesmo recorte que já governa o botão de pedir música no perfil público.
 */
export function useLivePerformance(
  musicianId: string | null,
  eventId: string | null | undefined,
) {
  const enabled = !!musicianId && !!eventId;

  return useQuery({
    queryKey: enabled
      ? livePerformanceKey(musicianId!, eventId!)
      : ['performance', 'live', 'disabled'],
    queryFn: () =>
      getLivePerformance({ musician_id: musicianId!, event_id: eventId! }),
    enabled,
    refetchInterval: LIVE_POLL_MS,
    // Foreground apenas: o fã está no show com a tela na mão. Poll em
    // background só gastaria bateria dele para nada.
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}

/** Currículo verificado, exibido também no perfil público do músico. */
export function useMusicianResume(musicianId: string | null) {
  return useQuery({
    queryKey: musicianId
      ? musicianResumeKey(musicianId)
      : ['musician', 'resume', 'disabled'],
    queryFn: () => getMusicianResume(musicianId!),
    enabled: !!musicianId,
    // Currículo muda no ritmo de shows realizados, não de segundos.
    staleTime: 5 * 60 * 1_000,
  });
}
