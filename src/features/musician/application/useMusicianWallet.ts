import { useQuery } from '@tanstack/react-query';
import { getMusicianWallet } from '../infrastructure/musician-wallet.api';

export const musicianWalletKey = (musicianId: string) => ['musician', musicianId, 'wallet'] as const;

// Leitura da carteira — usado pela seção "Carteira/PIX" do accordion de perfil
// (Bloco 2) para prefilar a chave PIX já cadastrada. Distinto de useUpdatePixKey
// (mutation, já existia para o wizard) — este é o primeiro GET de carteira no
// mobile.
export function useMusicianWallet(musicianId: string | null) {
  return useQuery({
    queryKey:  musicianId ? musicianWalletKey(musicianId) : ['musician', 'wallet', 'disabled'],
    queryFn:   () => getMusicianWallet(musicianId!),
    enabled:   !!musicianId,
    staleTime: 30 * 1_000,
  });
}
