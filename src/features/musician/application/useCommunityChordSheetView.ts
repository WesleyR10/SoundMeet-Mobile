import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCommunityChordSheetView } from '../infrastructure/community-chord-sheet.api';
import { buildTokenGrid } from '@/shared/utils/chord-sheet';

export const communityChordSheetViewKey = (id: string) => ['community', 'personal-chord-sheets', id, 'chord-sheet'] as const;

// Somente leitura — `notes` do autor já vem null do backend, sem outcomes de
// edição própria (o leitor não editou nada, os outcomes aqui refletem só a
// aplicação do overlay do AUTOR sobre a base dele).
export function useCommunityChordSheetView(id: string | null) {
  const query = useQuery({
    queryKey:  id ? communityChordSheetViewKey(id) : ['community', 'personal-chord-sheets', 'view-disabled'],
    queryFn:   () => getCommunityChordSheetView(id!),
    enabled:   !!id,
    staleTime: 60 * 1_000,
  });

  const grid = useMemo(() => (query.data ? buildTokenGrid(query.data.sheet) : null), [query.data]);

  return { ...query, grid };
}
