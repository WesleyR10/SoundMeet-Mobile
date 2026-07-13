import { useQuery } from '@tanstack/react-query';
import { getWallet } from '../infrastructure/wallet.api';

export const walletKey = (musicianId: string) => ['payment', 'wallet', musicianId] as const;

export function useWallet(musicianId: string | null) {
  return useQuery({
    queryKey:  musicianId ? walletKey(musicianId) : ['payment', 'wallet', 'disabled'],
    queryFn:   () => getWallet(musicianId!),
    enabled:   !!musicianId,
    staleTime: 30 * 1_000,
  });
}
