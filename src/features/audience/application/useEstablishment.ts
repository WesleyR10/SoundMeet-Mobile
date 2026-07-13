import { useQuery } from '@tanstack/react-query';
import { getEstablishment, listEstablishmentEvents, listEventPerformers } from '../infrastructure/establishment.api';
import type { EventFilter } from '../domain/event.types';

export const establishmentKey = (id: string) => ['establishments', id] as const;

export function useEstablishment(id: string | null) {
  return useQuery({
    queryKey:  id ? establishmentKey(id) : ['establishments', 'detail', 'disabled'],
    queryFn:   () => getEstablishment(id!),
    enabled:   !!id,
    staleTime: 30 * 1_000,
  });
}

export const establishmentEventsKey = (id: string, filter: EventFilter) => ['establishments', id, 'events', filter] as const;

export function useEstablishmentEvents(id: string | null, filter: EventFilter = { status: 'active' }) {
  return useQuery({
    queryKey:  id ? establishmentEventsKey(id, filter) : ['establishments', 'events', 'disabled'],
    queryFn:   () => listEstablishmentEvents(id!, filter),
    enabled:   !!id,
    staleTime: 30 * 1_000,
  });
}

export const eventPerformersKey = (establishmentId: string, eventId: string) =>
  ['establishments', establishmentId, 'events', eventId, 'performers'] as const;

export function useEventPerformers(establishmentId: string | null, eventId: string | null) {
  return useQuery({
    queryKey: establishmentId && eventId
      ? eventPerformersKey(establishmentId, eventId)
      : ['establishments', 'events', 'performers', 'disabled'],
    queryFn:   () => listEventPerformers(establishmentId!, eventId!),
    enabled:   !!establishmentId && !!eventId,
    staleTime: 30 * 1_000,
  });
}
