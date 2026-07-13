import { useQuery } from '@tanstack/react-query';
import { getMusician } from '../infrastructure/musician.api';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { getWizardCompleted } from '@/shared/services/storage/wizard.storage';
import type { WizardStep } from '../ui/screens/useMusicianWizardState';

export const musicianWizardGateKey = (musicianId: string) => ['musician', musicianId, 'wizard-gate'] as const;
export const wizardCompletedKey = (musicianId: string) => ['musician', musicianId, 'wizard-completed'] as const;

export type WizardGateStatus =
  | { kind: 'not-applicable' }                 // não é músico (audience) — sem gate
  | { kind: 'loading' }
  | { kind: 'error'; retry: () => void }
  | { kind: 'needs-wizard'; resumeStep: WizardStep }
  | { kind: 'complete' };

// Guard do item 1.14: músico autenticado sem stage_name ainda não terminou o
// onboarding (Bloco 1.13) e deve ver o wizard antes das tabs. Roda a cada boot
// autenticado (login/restoreSession) porque, ao contrário do registro, aqui não
// sabemos de antemão se o perfil já está completo.
//
// `stage_name` sozinho não basta como critério de conclusão: ele é setado no
// Step 2, mas os Steps 3 (foto) e 4 (PIX) — puláveis — só terminam no Step 5.
// Por isso soma-se a flag local `getWizardCompleted` (só true quando o músico
// chegou no Step 5 ao menos uma vez): sem ela, fechar o app entre o Step 2 e o
// Step 5 marcaria o onboarding como completo e pularia foto/PIX para sempre.
export function useMusicianWizardGate(): WizardGateStatus {
  const user = useAuthStore((s) => s.user);
  const isMusician = user?.roles.includes('musician') ?? false;
  const musicianId = user?.musicianId ?? null;

  const profileQuery = useQuery({
    queryKey: musicianId ? musicianWizardGateKey(musicianId) : ['musician', 'wizard-gate', 'disabled'],
    queryFn:  () => getMusician(musicianId!),
    enabled:  isMusician && !!musicianId,
    staleTime: 60 * 1_000,
  });

  const hasStageName = !!profileQuery.data?.stage_name;

  const completedQuery = useQuery({
    queryKey: musicianId ? wizardCompletedKey(musicianId) : ['musician', 'wizard-completed', 'disabled'],
    queryFn:  () => getWizardCompleted(musicianId!),
    enabled:  isMusician && !!musicianId && hasStageName,
    staleTime: Infinity,
  });

  if (!isMusician) return { kind: 'not-applicable' };
  if (profileQuery.isPending) return { kind: 'loading' };
  if (profileQuery.isError) return { kind: 'error', retry: () => profileQuery.refetch() };

  if (!hasStageName) return { kind: 'needs-wizard', resumeStep: 1 };
  if (completedQuery.isPending) return { kind: 'loading' };

  return completedQuery.data ? { kind: 'complete' } : { kind: 'needs-wizard', resumeStep: 3 };
}
