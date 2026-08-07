// Resolve um símbolo de acorde renderizado (ex.: "F#m7", "G/B", "Bbdim" —
// o mesmo formato que chords.timeline[].symbol já traz do backend, ver
// formatChordSymbol em get-chord-sheet-for-music-library.use-case.ts) pra um
// diagrama de braço de violão, usando @tombatossals/chords-db (dataset puro
// em JSON, MIT) — sem lib de renderização (react-chords usa <svg> DOM,
// incompatível com RN); a renderização em si é feita por ChordDiagram.tsx
// via react-native-svg.
//
// Vocabulário de qualidade do backend é pequeno e fechado (9 valores, ver
// mapColonQualityToSuffix no backend): "", "m", "7", "maj7", "m7", "dim",
// "aug", "sus2", "sus4" — todos batem 1:1 com suffixes reais do chords-db
// (confirmado lendo node_modules/@tombatossals/chords-db/lib/guitar.json,
// não assumido).
import guitarDb from '@tombatossals/chords-db/lib/guitar.json';

export interface ChordDiagramPosition {
  frets:    number[]; // -1 = mudo, 0 = solta, N = casa relativa (ver baseFret)
  fingers:  number[]; // 0 = solta/mudo, 1-4 = dedo
  baseFret: number;   // casa absoluta onde a casa relativa 1 começa
  barres:   number[]; // casas relativas com pestana
}

interface ChordsDbEntry {
  key:       string;
  suffix:    string;
  positions: ChordDiagramPosition[];
}

export interface ChordDiagramShape {
  displayRoot:   string;
  displaySuffix: string;
  positions:     ChordDiagramPosition[];
}

// Cast pontual — o JSON tem ~240KB de literais, deixar o TS inferir o tipo
// inteiro do arquivo deixaria o typecheck lento à toa; a forma real dos
// campos que usamos já está fixada acima em ChordsDbEntry.
const GUITAR_CHORDS = (guitarDb as unknown as { chords: Record<string, ChordsDbEntry[]> }).chords;

const PITCH_CLASS_BASE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Exportado -- reusado por chord-transpose.ts (transposição/capotraste),
// que precisa da mesma conversão nota->classe de altura.
export function noteToPitchClass(note: string): number | null {
  const m = note.match(/^([A-G])(#|b)?$/i);
  if (!m) return null;
  const base = PITCH_CLASS_BASE[m[1].toUpperCase()];
  const delta = m[2] === '#' ? 1 : m[2]?.toLowerCase() === 'b' ? -1 : 0;
  return (base + delta + 12) % 12;
}

// Espelha a spelling fixa que o `keys` do chords-db usa por classe de altura
// (sustenido só em C#/F#, bemol em Eb/Ab/Bb) — diferente da preferência
// sharp/flat CONDICIONAL à tonalidade que o backend usa em
// applyEnharmonicPreferenceToRoot; aqui a spelling é fixa por nota, não
// depende da key da música.
const PITCH_CLASS_TO_CHORDS_DB_KEY = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
] as const;

const PITCH_CLASS_TO_SHARP = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

// As chaves de topo do objeto `chords` não são iguais ao array `keys` —
// sustenidos viram palavra ("Csharp"/"Fsharp") porque "#" não é uma chave
// de objeto limpa na fonte; bemóis mantêm a grafia (Eb/Ab/Bb). Confirmado
// lendo o pacote real, não deduzido.
const CHORDS_DB_KEY_TO_OBJECT_KEY: Record<string, string> = {
  C: 'C', 'C#': 'Csharp', D: 'D', Eb: 'Eb', E: 'E', F: 'F',
  'F#': 'Fsharp', G: 'G', Ab: 'Ab', A: 'A', Bb: 'Bb', B: 'B',
};

const QUALITY_TO_SUFFIX: Record<string, string> = {
  '': 'major', m: 'minor', '7': '7', maj7: 'maj7', m7: 'm7',
  dim: 'dim', aug: 'aug', sus2: 'sus2', sus4: 'sus4',
  '6': '6', m6: 'm6', '9': '9', m7b5: 'm7b5',
};

const KNOWN_QUALITIES = ['maj7', 'sus2', 'sus4', 'm7b5', 'dim', 'aug', 'm6', 'm7', 'm', '9', '7', '6', ''] as const;

export interface ParsedChordSymbol {
  root:    string;
  quality: string;
  bass?:   string;
}

// "N" (sem acorde, ver isNoChordSymbol no backend) não tem diagrama —
// retorna null explicitamente em vez de tentar casar.
export function parseChordSymbol(symbol: string): ParsedChordSymbol | null {
  const raw = String(symbol ?? '').trim();
  if (!raw || raw.toUpperCase() === 'N') return null;

  const [chordPart, bassPart] = raw.split('/');
  const rootMatch = chordPart.match(/^([A-Ga-g])(#|b)?/);
  if (!rootMatch) return null;

  const root = `${rootMatch[1].toUpperCase()}${rootMatch[2] ?? ''}`;
  const rest = chordPart.slice(rootMatch[0].length);
  const quality = KNOWN_QUALITIES.find((q) => q === rest);
  if (quality === undefined) return null;

  if (!bassPart) return { root, quality };

  const bassMatch = bassPart.match(/^([A-Ga-g])(#|b)?$/);
  // baixo malformado: degrada pro acorde base sem baixo em vez de falhar tudo
  if (!bassMatch) return { root, quality };

  const bass = `${bassMatch[1].toUpperCase()}${bassMatch[2] ?? ''}`;
  return { root, quality, bass };
}

function findEntryBySuffix(objectKey: string, suffix: string): ChordsDbEntry | undefined {
  return GUITAR_CHORDS[objectKey]?.find((e) => e.suffix === suffix);
}

// chords-db só charteia um subconjunto pequeno de combinações acorde/baixo
// (ver `suffixes` no dataset) e usa grafia inconsistente pro baixo (sustenido
// mesmo pra notas que a spelling normal trataria como bemol, ex. "/G#" e não
// "/Ab") — tenta as duas grafias antes de desistir do baixo específico.
export function lookupChordDiagram(symbol: string): ChordDiagramShape | null {
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return null;

  const rootPc = noteToPitchClass(parsed.root);
  const suffix = QUALITY_TO_SUFFIX[parsed.quality];
  if (rootPc === null || suffix === undefined) return null;

  const chordsDbKey = PITCH_CLASS_TO_CHORDS_DB_KEY[rootPc];
  const objectKey = CHORDS_DB_KEY_TO_OBJECT_KEY[chordsDbKey];

  if (parsed.bass) {
    const bassPc = noteToPitchClass(parsed.bass);
    if (bassPc !== null) {
      const bassCandidates = [PITCH_CLASS_TO_CHORDS_DB_KEY[bassPc], PITCH_CLASS_TO_SHARP[bassPc]];
      for (const bassSpelling of bassCandidates) {
        const withBass = findEntryBySuffix(objectKey, `${parsed.quality}/${bassSpelling}`);
        if (withBass) {
          return { displayRoot: chordsDbKey, displaySuffix: withBass.suffix, positions: withBass.positions };
        }
      }
    }
    // sem diagrama pra essa inversão específica — cai pro acorde base abaixo
  }

  const plain = findEntryBySuffix(objectKey, suffix);
  if (!plain) return null;
  return { displayRoot: chordsDbKey, displaySuffix: suffix, positions: plain.positions };
}

// ── Piano/teclado ────────────────────────────────────────────────────────
// chords-db só tem dataset de dedilhado pra violão/ukulele (confirmado lendo
// o pacote: só guitar.json/ukulele.json, sem piano.json) — acorde de piano
// não precisa de dataset de "como encaixar o dedo", é só teoria musical pura
// (quais teclas), então computamos direto por intervalo em vez de depender
// de fingering de terceiros.
const QUALITY_TO_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10], dim: [0, 3, 6], aug: [0, 4, 8], sus2: [0, 2, 7], sus4: [0, 5, 7],
  '6': [0, 4, 7, 9], m6: [0, 3, 7, 9], '9': [0, 4, 7, 10, 14], m7b5: [0, 3, 6, 10],
};

export interface PianoChordShape {
  rootPitchClass:  number;
  pitchClasses:    number[]; // inclui a raiz; baixo (slash) somado se for nota fora do acorde
}

export function lookupPianoChordShape(symbol: string): PianoChordShape | null {
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return null;

  const rootPitchClass = noteToPitchClass(parsed.root);
  const intervals = QUALITY_TO_INTERVALS[parsed.quality];
  if (rootPitchClass === null || !intervals) return null;

  const pitchClasses = new Set(intervals.map((i) => (rootPitchClass + i) % 12));
  if (parsed.bass) {
    const bassPc = noteToPitchClass(parsed.bass);
    if (bassPc !== null) pitchClasses.add(bassPc);
  }

  return { rootPitchClass, pitchClasses: [...pitchClasses] };
}
