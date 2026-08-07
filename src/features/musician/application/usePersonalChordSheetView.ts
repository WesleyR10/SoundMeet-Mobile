import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPersonalChordSheetView } from '../infrastructure/personal-chord-sheet.api';
import { buildTokenGrid } from '@/shared/utils/chord-sheet';
import type { ChordComplexity } from '../domain/personal-chord-sheet.types';

export type PersonalChordSheetViewOverrides = {
  transpose_semitones?: number;
  capo_fret?:            number;
  chord_complexity?:     ChordComplexity;
};

export const personalChordSheetViewKey = (musicianId: string, id: string, overrides?: PersonalChordSheetViewOverrides) =>
  ['musician', musicianId, 'personal-chord-sheets', id, 'chord-sheet', overrides ?? {}] as const;

// Corpo renderizado do fork (base + overlay aplicado) — é a ÚNICA fonte de
// `outcomes`/`conflict_count`/`reconcile_status`/`base_changed` (o POST
// .../edits devolve o fork cru, sem isso, ver plano §6). Toda mutation de
// edit precisa invalidar esta query pra saber se a correção "pegou".
export function usePersonalChordSheetView(
  musicianId: string | null,
  id: string | null,
  overrides?: PersonalChordSheetViewOverrides,
) {
  const query = useQuery({
    queryKey:  musicianId && id ? personalChordSheetViewKey(musicianId, id, overrides) : ['musician', 'personal-chord-sheets', 'view-disabled'],
    queryFn:   () => getPersonalChordSheetView(musicianId!, id!, overrides),
    enabled:   !!musicianId && !!id,
    staleTime: 15 * 1_000,
  });

  const grid = useMemo(() => (query.data ? buildTokenGrid(query.data.sheet) : null), [query.data]);

  return { ...query, grid };
}
