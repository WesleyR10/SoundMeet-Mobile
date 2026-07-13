import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { MusicianWallet, UpdatePixKeyPayload } from '../domain/musician.types';

export async function getMusicianWallet(musicianId: string): Promise<MusicianWallet> {
  const { data } = await httpClient.get<ApiEnvelope<MusicianWallet>>(`/musicians/${musicianId}/wallet`);
  return data.data;
}

export async function updatePixKey(
  musicianId: string,
  payload: UpdatePixKeyPayload,
): Promise<MusicianWallet> {
  const { data } = await httpClient.patch<ApiEnvelope<MusicianWallet>>(
    `/musicians/${musicianId}/wallet/pix-key`,
    payload,
  );
  return data.data;
}
