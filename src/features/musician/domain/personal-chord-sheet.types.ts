// Espelha PersonalChordSheetPresenter/PersonalChordSheetSummaryPresenter do
// backend (personal-chord-sheet-module) campo a campo. Domínio puro, sem
// imports de RN/Expo. Ver Docs/roadmap.md Bloco 8 (backend) — "overlay de
// edições, não cópia": o fork nunca duplica a cifra original
// (music_library.chord_sheet), guarda só o que o músico mudou.
import type { ChordSheet } from '@/shared/utils/chord-sheet';

export type ShareScope = 'private' | 'band' | 'community';

export type ReconcileStatus = 'clean' | 'base_updated';

export type ChordEditType =
  | 'replace_chord'
  | 'insert_chord'
  | 'delete_chord'
  | 'shift_chord'
  | 'relabel_section'
  | 'annotate';

export type ChordComplexity = 'full' | 'simple' | 'basic';

export type PersonalChordSheetInstrument =
  | 'guitar'
  | 'guitar7'
  | 'ukulele'
  | 'cavaquinho'
  | 'bass'
  | 'keyboard';

export type PreferredAccidental = 'sharp' | 'flat' | 'auto';

export interface ChordSheetViewSettings {
  transpose_semitones: number;
  capo_fret:            number;
  chord_complexity:     ChordComplexity;
  instrument:            PersonalChordSheetInstrument;
  left_handed:           boolean;
  preferred_accidental: PreferredAccidental;
  scroll_speed:          number;
}

export interface ChordEdit {
  edit_id:    string;
  type:       ChordEditType;
  at_ms:      number;
  to_ms:      number | null;
  from:       string | null;
  to:         string | null;
  symbol:     string | null;
  label:      string | null;
  text:       string | null;
  created_at: string;
}

export interface PersonalChordSheetSummary {
  personal_chord_sheet_id: string;
  music_library_id:        string;
  musician_id:              string;
  base_version:             number;
  base_fingerprint:         string;
  base_pipeline_version:    number;
  edit_count:                number;
  view:                      ChordSheetViewSettings;
  notes:                     string | null;
  share_scope:               ShareScope;
  is_shared:                 boolean;
  shared_at:                 string | null;
  reconcile_status:          ReconcileStatus;
  created_at:                string;
  updated_at:                string;
}

export interface PersonalChordSheet extends PersonalChordSheetSummary {
  edits: ChordEdit[];
}

export type OverlayConflictReason =
  | 'anchor_not_found'
  | 'symbol_mismatch'
  | 'ambiguous_match'
  | 'unparseable_symbol'
  | 'out_of_range';

export interface OverlayOutcome {
  edit_id:         string;
  type:             ChordEditType;
  status:           'applied' | 'conflict';
  reason:           OverlayConflictReason | null;
  matched_start_ms: number | null;
}

// PersonalChordSheetView.sheet reaproveita o MESMO shape de ChordSheet
// (shared/utils/chord-sheet.ts) já consumido pelo Play Mode — só ganha
// `annotations` a mais (edits do tipo `annotate`, ancoradas num token).
export interface PersonalChordSheetAnnotation {
  atMs:         number;
  text:         string;
  sectionIndex: number;
  lineIndex:    number;
  tokenIndex:   number;
}

export interface PersonalChordSheetView {
  personal_chord_sheet_id: string;
  sheet:             ChordSheet & { annotations?: PersonalChordSheetAnnotation[] };
  outcomes:          OverlayOutcome[];
  conflict_count:    number;
  reconcile_status:  ReconcileStatus;
  base_changed:      boolean;
}

export interface ImportedChordSheet {
  personal_chord_sheet: PersonalChordSheet;
  outcomes:               OverlayOutcome[];
  conflict_count:         number;
  base_differs:           boolean;
}

export type PersonalChordSheetSortField = 'created_at' | 'updated_at' | 'shared_at';
export type SortDirection = 'asc' | 'desc';
