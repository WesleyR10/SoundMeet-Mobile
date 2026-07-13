import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { Establishment, EstablishmentListParams, PaginationMeta } from '../domain/establishment.types';
import type { EventItem, EventFilter, EventPerformer } from '../domain/event.types';

interface EstablishmentListResponse {
  data: Establishment[];
  meta: PaginationMeta;
}

// GET /establishments — @Public(), mas é o fã quem consome no mobile (feed de
// descoberta + busca/filtro, Bloco 11.3/11.4). Sem geo/raio ainda — ver
// soundmeet-backend/Docs/roadmap.md Bloco 7.13; filtro é objeto aninhado
// (`filter[name]=...`), axios já serializa em bracket notation por padrão.
export async function listEstablishments(params: EstablishmentListParams = {}): Promise<EstablishmentListResponse> {
  const { data } = await httpClient.get<EstablishmentListResponse>('/establishments', { params });
  return data;
}

export async function getEstablishment(id: string): Promise<Establishment> {
  const { data } = await httpClient.get<ApiEnvelope<Establishment>>(`/establishments/${id}`);
  return data.data;
}

interface EventListResponse {
  data: EventItem[];
  meta: PaginationMeta;
}

export async function listEstablishmentEvents(
  establishmentId: string,
  filter: EventFilter = { status: 'active' },
): Promise<EventListResponse> {
  const { data } = await httpClient.get<EventListResponse>(`/establishments/${establishmentId}/events`, {
    params: { filter },
  });
  return data;
}

interface EventPerformerListResponse {
  data: EventPerformer[];
  meta: PaginationMeta;
}

export async function listEventPerformers(
  establishmentId: string,
  eventId: string,
): Promise<EventPerformerListResponse> {
  const { data } = await httpClient.get<EventPerformerListResponse>(
    `/establishments/${establishmentId}/events/${eventId}/performers`,
  );
  return data;
}

// Presença/attendance em evento: `AttendEventUseCase` (audiences-module,
// audience.api.ts:attendEvent) internamente chama o MESMO AddEventAttendeeUseCase
// que `POST .../events/:event_id/attendees` — usar só o wrapper de
// audiences-module (canônico, mesmo padrão de requests/tips) em vez de
// duplicar a chamada aqui.
