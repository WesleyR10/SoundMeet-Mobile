import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  AddUnavailabilityPayload,
  MusicianAvailability,
  WeeklyRuleInput,
} from '../domain/availability.types';

// Endpoints de disponibilidade do scheduling-module — todos devolvem o
// AvailabilityPresenter completo (configuração + regras + bloqueios).

export async function getAvailability(musicianId: string): Promise<MusicianAvailability> {
  const { data } = await httpClient.get<ApiEnvelope<MusicianAvailability>>(
    `/scheduling/musicians/${musicianId}/availability`,
  );
  return data.data;
}

export async function setWeeklyRules(
  musicianId: string,
  rules: WeeklyRuleInput[],
): Promise<MusicianAvailability> {
  const { data } = await httpClient.put<ApiEnvelope<MusicianAvailability>>(
    `/scheduling/musicians/${musicianId}/availability/rules`,
    { rules },
  );
  return data.data;
}

export async function addUnavailability(
  musicianId: string,
  payload: AddUnavailabilityPayload,
): Promise<MusicianAvailability> {
  const { data } = await httpClient.post<ApiEnvelope<MusicianAvailability>>(
    `/scheduling/musicians/${musicianId}/availability/blocks`,
    payload,
  );
  return data.data;
}

export async function removeUnavailability(
  musicianId: string,
  blockId: string,
): Promise<MusicianAvailability> {
  const { data } = await httpClient.delete<ApiEnvelope<MusicianAvailability>>(
    `/scheduling/musicians/${musicianId}/availability/blocks/${blockId}`,
  );
  return data.data;
}
