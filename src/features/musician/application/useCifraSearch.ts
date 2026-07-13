import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchCifra } from '../infrastructure/cifra-search.api';

const DEBOUNCE_MS = 400;

// Debounce local via useState+setTimeout — sem hook compartilhado novo pra
// um único uso (ver CLAUDE.md "diff mínimo"). staleTime curto: resultado de
// busca por texto livre não faz sentido cachear por muito tempo.
export function useCifraSearch(musicianId: string | null, query: string) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const trimmed = debounced.trim();

  return useQuery({
    queryKey:  ['ai-cifra-search', musicianId, trimmed],
    queryFn:   () => searchCifra(musicianId!, trimmed),
    enabled:   !!musicianId && trimmed.length >= 2,
    staleTime: 60 * 1_000,
  });
}
