import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChordSheetViaRepertoire } from '../infrastructure/chord-sheet.api';
import { buildTokenGrid } from '@/shared/utils/chord-sheet';

export const chordSheetKey = (repertoireId: string, musicLibraryId: string) =>
  ['chord-sheet', repertoireId, musicLibraryId] as const;

// Sempre busca via repertório (não via /music-library/:id/chord-sheet
// direto) — funciona tanto pro dono quanto pro convidado nominal, já que o
// Play Mode sempre tem repertoireId em mão (ver plano de fix do gap de
// convite nominal). `ownerMusicianId` é o dono do repertório
// (repertoire.musician_id), não necessariamente quem está logado.
//
// staleTime moderado — backend computa isso ao vivo a cada request (sem
// ETag/cache-bust), então evitamos refetch a cada foco de tela, mas ainda
// pegamos atualizações depois de uma nova análise ai-cifra completar.
export function useChordSheet(
  repertoireId: string | null,
  ownerMusicianId: string | null,
  musicLibraryId: string | null,
) {
  const query = useQuery({
    queryKey:  repertoireId && musicLibraryId ? chordSheetKey(repertoireId, musicLibraryId) : ['chord-sheet', 'disabled'],
    queryFn:   () => getChordSheetViaRepertoire(ownerMusicianId!, repertoireId!, musicLibraryId!),
    enabled:   !!repertoireId && !!ownerMusicianId && !!musicLibraryId,
    staleTime: 5 * 60 * 1_000,
  });

  const grid = useMemo(() => (query.data ? buildTokenGrid(query.data) : null), [query.data]);

  return { ...query, grid };
}
