import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchMusiciansByName } from '../infrastructure/musician-search.api';

const DEBOUNCE_MS = 400;

// Mesmo padrão de debounce de useCifraSearch.ts — sem hook compartilhado
// novo pra um uso só (CLAUDE.md "diff mínimo").
export function useMusicianSearch(query: string) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const trimmed = debounced.trim();

  return useQuery({
    queryKey:  ['musician-search', trimmed],
    queryFn:   () => searchMusiciansByName(trimmed),
    enabled:   trimmed.length >= 2,
    staleTime: 60 * 1_000,
  });
}
