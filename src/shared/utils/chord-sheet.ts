// Espelha ChordSheetPresenter/ChordSheetOutput do backend (synced-lyrics
// module, GET .../chord-sheet) campo a campo. Promovido de
// features/musician pra shared/ (jul/2026) quando o Play Mode e a
// visualização de repertório compartilhado publicamente (features/shared-
// repertoire) passaram a precisar do mesmo join de token-grid — FSD proíbe
// uma feature importar de outra, e duplicar ~150 linhas de lógica de join
// não trivial seria pior que promover. Ver Docs/AI-musician/chord-sheet.md —
// token-grid reflow-safe: acordes ancorados por índice de seção/linha/token,
// não por coluna de caractere.

export type ChordSheetTokenKind = 'word' | 'punct' | 'space';

export interface ChordSheetToken {
  text:       string;
  kind:       ChordSheetTokenKind;
  normalized: string;
  startMs?:   number;
  endMs?:     number;
}

export interface ChordSheetLine {
  tokens: ChordSheetToken[];
}

export interface ChordSheetSection {
  label?:      string;
  startMs?:    number;
  endMs?:      number;
  confidence?: number;
  lines:       ChordSheetLine[];
}

export interface ChordSheetChordTimelineItem {
  startMs:     number;
  endMs?:      number;
  symbol:      string;
  confidence?: number;
}

export interface ChordSheetAnchor {
  sectionIndex: number;
  lineIndex:    number;
  tokenIndex:   number;
}

export interface ChordSheetMeta {
  provider:       string | null;
  pipelineVersion: number;
  qualityFlags:    string[];
  bpm:             number | null;
  key:             string | null;
  matchScore?:     number;
}

export interface ChordSheet {
  music_library_id: string;
  musician_id:       string;
  title:             string;
  artist:            string;
  lyrics: {
    normalized: {
      sections: ChordSheetSection[];
    };
  };
  chords: {
    timeline: ChordSheetChordTimelineItem[];
  };
  alignment: {
    // chave é o índice do acorde no timeline, como string (JSON não tem
    // chave numérica) — mesmo formato bruto do backend, não convertido aqui.
    anchors: Record<string, ChordSheetAnchor>;
  };
  meta:       ChordSheetMeta;
  updated_at: string;
}

// ── Grid renderável (join feito no client) ──────────────────────────────────

export interface RenderableToken extends ChordSheetToken {
  chordSymbol?: string;
}

export interface RenderableLine {
  tokens: RenderableToken[];
}

export interface RenderableSection {
  label?: string;
  lines:  RenderableLine[];
}

export type ChordSheetTokenGrid = RenderableSection[];

// Junta chords.timeline nos tokens da letra via alignment.anchors — pré-
// computado uma vez por fetch (useMemo no hook chamador), não inline em
// JSX: é o cálculo mais caro da tela de Play Mode, potencialmente centenas
// de tokens. Reflow-safe por design — a junção é por índice de posição
// (seção/linha/token), não por coluna de caractere.
export function buildTokenGrid(sheet: ChordSheet): ChordSheetTokenGrid {
  const chordBySection = new Map<string, string>();
  // Seções instrumentais/sem letra (section.lines === []) não têm token
  // nenhum pra ancorar — o backend aponta TODO acorde nelas pra
  // {lineIndex:0, tokenIndex:0} como fallback (ver findAnchorForChord no
  // backend), posição que não existe de verdade. Sem tratar isso à parte,
  // esses acordes (e o próprio rótulo da seção) simplesmente desapareceriam
  // da tela — um solo/intro instrumental ficaria invisível no Play Mode,
  // mesmo tendo acordes reais tocando durante aquele tempo.
  const chordsForEmptySection = new Map<number, string[]>();

  for (const [chordIndexStr, anchor] of Object.entries(sheet.alignment.anchors)) {
    const chordIndex = Number(chordIndexStr);
    const chord = sheet.chords.timeline[chordIndex];
    if (!chord) continue;

    const section = sheet.lyrics.normalized.sections[anchor.sectionIndex];
    if (section && section.lines.length === 0) {
      const list = chordsForEmptySection.get(anchor.sectionIndex) ?? [];
      list.push(chord.symbol);
      chordsForEmptySection.set(anchor.sectionIndex, list);
      continue;
    }

    const key = `${anchor.sectionIndex}-${anchor.lineIndex}-${anchor.tokenIndex}`;
    chordBySection.set(key, chord.symbol);
  }

  return sheet.lyrics.normalized.sections.map((section, sectionIndex) => {
    if (section.lines.length === 0) {
      const chords = chordsForEmptySection.get(sectionIndex);
      if (!chords || chords.length === 0) {
        return { label: section.label, lines: [] };
      }
      // Linha sintética "só de acorde" — sem palavra embaixo, só o símbolo
      // acima, uma coluna por acorde distinto consecutivo (evita repetir o
      // mesmo acorde sustentado por vários segmentos de timeline seguidos).
      const dedup = chords.filter((symbol, i) => symbol !== chords[i - 1]);
      const tokens = dedup.map((symbol, i) => ({
        // Placeholder visual "—" em vez de string vazia — deixa claro que é
        // intencional (seção instrumental, só acorde) e não um glitch de
        // render; `kind: 'punct'` porque não é uma palavra da letra.
        text: '—', kind: 'punct' as const, normalized: '—', chordSymbol: symbol,
        // startMs/endMs do PRIMEIRO/ÚLTIMO token = janela de tempo da seção
        // (quando o backend a informa) — sem isso, computeLineWeightMs
        // (chord-sheet-timing.ts) cairia no fallback de contagem de palavras
        // (zero palavras aqui) e o auto-scroll trataria um solo de vários
        // compassos como se durasse só 200ms, o mínimo absoluto.
        ...(i === 0 && typeof section.startMs === 'number' ? { startMs: section.startMs } : {}),
        ...(i === dedup.length - 1 && typeof section.endMs === 'number' ? { endMs: section.endMs } : {}),
      }));
      return { label: section.label, lines: [{ tokens }] };
    }

    return {
      label: section.label,
      lines: section.lines.map((line, lineIndex) => ({
        tokens: line.tokens.map((token, tokenIndex) => {
          const chordSymbol = chordBySection.get(`${sectionIndex}-${lineIndex}-${tokenIndex}`);
          return chordSymbol ? { ...token, chordSymbol } : token;
        }),
      })),
    };
  });
}
