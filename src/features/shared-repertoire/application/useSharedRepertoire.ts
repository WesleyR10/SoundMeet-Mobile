import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSharedRepertoire, getSharedChordSheet } from '../infrastructure/shared-repertoire.api';
import { buildTokenGrid } from '@/shared/utils/chord-sheet';

export function useSharedRepertoire(token: string | null) {
  return useQuery({
    queryKey:  ['shared-repertoire', token],
    queryFn:   () => getSharedRepertoire(token!),
    enabled:   !!token,
    staleTime: 60 * 1_000,
  });
}

// Visualizador estático (sem auto-scroll) — grid pronto pra mapear direto em
// ChordTokenLine, sem o achatamento/peso do Play Mode (que só faz sentido
// pra quem está tocando ao vivo, não pra quem só está lendo/acompanhando).
export function useSharedChordSheet(token: string | null, musicLibraryId: string | null) {
  const query = useQuery({
    queryKey:  ['shared-chord-sheet', token, musicLibraryId],
    queryFn:   () => getSharedChordSheet(token!, musicLibraryId!),
    enabled:   !!token && !!musicLibraryId,
    staleTime: 5 * 60 * 1_000,
  });

  const grid = useMemo(() => (query.data ? buildTokenGrid(query.data) : null), [query.data]);

  return { ...query, grid };
}
