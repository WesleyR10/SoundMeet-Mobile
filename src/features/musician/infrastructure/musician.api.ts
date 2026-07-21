import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { MusicianProfile, QRCustomizationPatch, UpdateMusicianProfilePayload, WizardMusicianPayload } from '../domain/musician.types';

export async function getMusician(id: string): Promise<MusicianProfile> {
  const { data } = await httpClient.get<ApiEnvelope<MusicianProfile>>(`/musicians/${id}`);
  return data.data;
}

export async function updateMusician(id: string, payload: WizardMusicianPayload): Promise<MusicianProfile> {
  const { data } = await httpClient.patch<ApiEnvelope<MusicianProfile>>(`/musicians/${id}`, payload);
  return data.data;
}

// PATCH /musicians/:id/profile — campos estendidos do MusicianProfile
// sub-aggregate (preço, experiência, links sociais). Chaves em camelCase,
// ao contrário de updateMusician acima (UpdateMusicianProfileInput no backend).
export async function updateMusicianProfile(id: string, payload: UpdateMusicianProfilePayload): Promise<MusicianProfile> {
  const { data } = await httpClient.patch<ApiEnvelope<MusicianProfile>>(`/musicians/${id}/profile`, payload);
  return data.data;
}

// PATCH /musicians/:id/open-to-gigs — dedicado (guard de ownership próprio no
// backend), separado do updateMusician genérico pra refletir que é uma
// decisão isolada (OpenToGigsDecisionSheet chama isso direto, sem passar
// pelo resto do accordion de perfil).
export async function updateOpenToGigs(id: string, open_to_gigs: boolean): Promise<MusicianProfile> {
  const { data } = await httpClient.patch<ApiEnvelope<MusicianProfile>>(`/musicians/${id}/open-to-gigs`, { open_to_gigs });
  return data.data;
}

// PATCH /musicians/:id/push-token — registra/atualiza o Expo push token do
// device (último dispositivo registrado sobrescreve o anterior no backend).
export async function registerPushToken(
  id: string,
  pushToken: string,
  platform: 'ios' | 'android',
): Promise<void> {
  await httpClient.patch(`/musicians/${id}/push-token`, {
    push_token: pushToken,
    push_token_platform: platform,
  });
}

export type MusicianAvatarFile = {
  uri:  string;
  name: string;
  type: string;
};

export async function uploadMusicianAvatar(id: string, file: MusicianAvatarFile): Promise<MusicianProfile> {
  const formData = new FormData();
  formData.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);

  const { data } = await httpClient.post<ApiEnvelope<MusicianProfile>>(`/musicians/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

// POST /musicians/:id/qr-code/customize — PRO only (402 se não for PRO, ver
// extractApiMessage). Payload parcial: campo ausente = mantém, valor = define,
// `null` = remove a chave (reverte ao padrão) — ver QRCustomizationPatch.
export async function customizeQrCode(id: string, payload: QRCustomizationPatch): Promise<MusicianProfile> {
  const { data } = await httpClient.post<ApiEnvelope<MusicianProfile>>(`/musicians/${id}/qr-code/customize`, payload);
  return data.data;
}

export type QrLogoFile = {
  uri:  string;
  name: string;
  type: string;
};

// POST /musicians/:id/qr-code/logo — PRO only, mesmo padrão de uploadMusicianAvatar.
export async function uploadQrLogo(id: string, file: QrLogoFile): Promise<MusicianProfile> {
  const formData = new FormData();
  formData.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);

  const { data } = await httpClient.post<ApiEnvelope<MusicianProfile>>(`/musicians/${id}/qr-code/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}
