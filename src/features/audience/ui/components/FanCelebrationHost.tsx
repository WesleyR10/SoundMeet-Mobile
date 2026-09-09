import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useAudience } from '../../application/useAudience';
import { useFanCelebrationStore } from '../../application/fan-celebration.store';
import { useMusicianPublic } from '../../application/useMusicianPublic';
import { TipCelebrationOverlay } from './TipCelebrationOverlay';

/**
 * Ponto único onde a celebração é montada.
 *
 * Fica no `FanTabNavigator`, e não numa tela: a confirmação do PIX chega por
 * socket a qualquer momento — o fã pode estar navegando em qualquer aba, ou
 * ter voltado ao app depois de pagar no banco. Amarrar a comemoração a uma
 * tela específica significaria perdê-la exatamente no caso mais comum.
 */
export function FanCelebrationHost() {
  const current    = useFanCelebrationStore((s) => s.current);
  const dismiss    = useFanCelebrationStore((s) => s.dismiss);
  const audienceId = useAuthStore((s) => s.user?.audienceId ?? null);

  // O apelido vem antes do nome: é como o fã se apresenta no app.
  const { data: profile } = useAudience(audienceId);
  const fanName = profile?.nickname || profile?.name || null;

  // Só busca o nome do artista quando há algo para celebrar. O card omite a
  // linha se ainda não resolveu — nunca mostra placeholder.
  const { data: musician } = useMusicianPublic(current?.musician_id ?? null);

  if (!current) return null;

  return (
    <TipCelebrationOverlay
      payload={current}
      musicianName={musician?.display_name ?? null}
      fanName={fanName}
      onDismiss={dismiss}
    />
  );
}
