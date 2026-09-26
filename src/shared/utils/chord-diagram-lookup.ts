// Resolve um símbolo de acorde renderizado (ex.: "F#m7", "G/B", "Bbdim" —
// o mesmo formato que chords.timeline[].symbol já traz do backend, ver
// formatChordSymbol em get-chord-sheet-for-music-library.use-case.ts) pra um
// diagrama de braço de violão, usando @tombatossals/chords-db (dataset puro
// em JSON, MIT) — sem lib de renderização (react-chords usa <svg> DOM,
// incompatível com RN); a renderização em si é feita por ChordDiagram.tsx
// via react-native-svg.
//
// 🔴 O vocabulário NÃO é fechado (corrigido em 25/set/2026). Até aqui o
// parser aceitava 13 grafias exatas, na premissa de que o backend emitia 9
// qualidades. Desde 29/jul/2026 a cifra sai pelo `ChordSymbol` do backend,
// que escreve `Bm7(b5)`, `Am(maj7)`, `Cmaj9`, `G7(b9)`, `C6add9`, `C5` — e a
// cifra pessoal e a da comunidade carregam o que o músico digitou (`C7M`,
// `E°`, `A4`). Tudo isso caía em "Diagrama não disponível": tocar no acorde
// "não mostrava nada no instrumento". Hoje três dialetos chegam à mesma
// qualidade CANÔNICA (`QUALITIES`): padrão, brasileiro e o colon do worker MIR
// (`C:maj`, `A:min7`, `B:hdim7`). O que não tem forma exata ganha a forma do
// acorde-base marcada `approximate` — nunca um diagrama que finge ser exato.
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
  /** Forma do acorde-base — a UI tem de dizer isso (ver `parseChordSymbol`). */
  approximate:   boolean;
  /**
   * Como o baixo pedido (`/C`) entrou no desenho. Ausente = sem baixo ou
   * inversão que o chords-db já charteia. `adapted` = derivado da forma-base
   * (ver `placeBass`); `missing` = nenhuma posição comporta o baixo e o
   * desenho é o acorde SEM ele. Nos dois casos a UI tem de dizer.
   */
  bass?:         { note: string; status: 'adapted' | 'missing' };
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

/**
 * Qualidade CANÔNICA → sufixo do chords-db (violão) e intervalos (teclado).
 * Uma tabela só, para os dois instrumentos não discordarem sobre o que um
 * acorde é. `suffix: null` = o dataset não charteia (power chord): o violão
 * diz "não disponível", o teclado mostra as teclas.
 */
const QUALITIES: Record<string, { suffix: string | null; intervals: number[] }> = {
  '':    { suffix: 'major', intervals: [0, 4, 7] },
  m:     { suffix: 'minor', intervals: [0, 3, 7] },
  '5':   { suffix: null,    intervals: [0, 7] },
  '7':   { suffix: '7',     intervals: [0, 4, 7, 10] },
  maj7:  { suffix: 'maj7',  intervals: [0, 4, 7, 11] },
  m7:    { suffix: 'm7',    intervals: [0, 3, 7, 10] },
  mmaj7: { suffix: 'mmaj7', intervals: [0, 3, 7, 11] },
  dim:   { suffix: 'dim',   intervals: [0, 3, 6] },
  dim7:  { suffix: 'dim7',  intervals: [0, 3, 6, 9] },
  m7b5:  { suffix: 'm7b5',  intervals: [0, 3, 6, 10] },
  aug:   { suffix: 'aug',   intervals: [0, 4, 8] },
  aug7:  { suffix: 'aug7',  intervals: [0, 4, 8, 10] },
  sus2:  { suffix: 'sus2',  intervals: [0, 2, 7] },
  sus4:  { suffix: 'sus4',  intervals: [0, 5, 7] },
  '7sus4': { suffix: '7sus4', intervals: [0, 5, 7, 10] },
  '6':   { suffix: '6',     intervals: [0, 4, 7, 9] },
  m6:    { suffix: 'm6',    intervals: [0, 3, 7, 9] },
  '69':  { suffix: '69',    intervals: [0, 4, 7, 9, 14] },
  m69:   { suffix: 'm69',   intervals: [0, 3, 7, 9, 14] },
  '9':   { suffix: '9',     intervals: [0, 4, 7, 10, 14] },
  m9:    { suffix: 'm9',    intervals: [0, 3, 7, 10, 14] },
  maj9:  { suffix: 'maj9',  intervals: [0, 4, 7, 11, 14] },
  add9:  { suffix: 'add9',  intervals: [0, 4, 7, 14] },
  madd9: { suffix: 'madd9', intervals: [0, 3, 7, 14] },
  '7b5': { suffix: '7b5',   intervals: [0, 4, 6, 10] },
  '7b9': { suffix: '7b9',   intervals: [0, 4, 7, 10, 13] },
  '7#9': { suffix: '7#9',   intervals: [0, 4, 7, 10, 15] },
  '11':  { suffix: '11',    intervals: [0, 4, 7, 10, 14, 17] },
  m11:   { suffix: 'm11',   intervals: [0, 3, 7, 10, 14, 17] },
  '13':  { suffix: '13',    intervals: [0, 4, 7, 10, 14, 21] },
};

/**
 * Grafia → qualidade canônica, JÁ normalizada por `normalizeSuffix` (sem
 * parênteses, vírgulas e espaços): `m7(b5)` chega aqui como `m7b5`, `7M(9)`
 * como `7M9`, `m(maj7)` como `mmaj7`.
 *
 * ⚠️ Fora de propósito: `7+` (é sétima aumentada numa escola e sétima maior
 * noutra — adivinhar mostraria um acorde errado com cara de certo) e `maj`
 * sozinho, que é colon (`C:maj`) e mora em `COLON_QUALITIES`.
 */
const QUALITY_ALIASES: Record<string, string> = {
  '': '', M: '',
  m: 'm', mi: 'm', min: 'm', '-': 'm',
  '5': '5',
  '7': '7',
  maj7: 'maj7', M7: 'maj7', '7M': 'maj7', ma7: 'maj7', 'Δ': 'maj7', 'Δ7': 'maj7',
  m7: 'm7', mi7: 'm7', min7: 'm7', '-7': 'm7',
  mmaj7: 'mmaj7', m7M: 'mmaj7', mM7: 'mmaj7', minmaj7: 'mmaj7',
  dim: 'dim', '°': 'dim', o: 'dim',
  dim7: 'dim7', '°7': 'dim7', o7: 'dim7',
  m7b5: 'm7b5', 'm7-5': 'm7b5', 'm75-': 'm7b5', 'ø': 'm7b5', 'ø7': 'm7b5',
  aug: 'aug', '+': 'aug', '5+': 'aug', '#5': 'aug',
  aug7: 'aug7', '7#5': 'aug7', '75+': 'aug7', '+7': 'aug7',
  sus2: 'sus2',
  sus4: 'sus4', sus: 'sus4', '4': 'sus4',
  '7sus4': '7sus4', '7sus': '7sus4', '74': '7sus4', sus47: '7sus4',
  '6': '6', m6: 'm6',
  '69': '69', '6add9': '69', m69: 'm69', m6add9: 'm69',
  '9': '9', '79': '9',
  m9: 'm9', m79: 'm9', min9: 'm9',
  maj9: 'maj9', '7M9': 'maj9', M9: 'maj9',
  add9: 'add9', '2': 'add9', add2: 'add9',
  madd9: 'madd9', m2: 'madd9', madd2: 'madd9',
  '7b5': '7b5', '7-5': '7b5', '75-': '7b5',
  '7b9': '7b9', '7-9': '7b9',
  '7#9': '7#9', '7+9': '7#9',
  '11': '11', '711': '11', m11: 'm11', m711: 'm11',
  '13': '13', '713': '13',
};

/** Qualidades do worker MIR (Harte/colon): `C:maj`, `A:min7`, `B:hdim7`. */
// Espelha `COLON_QUALITY` do `ChordSymbol` do backend, sinônimos incluídos —
// divergir faria o app recusar um símbolo que o servidor aceita.
const COLON_QUALITIES: Record<string, string> = {
  maj: '', major: '', min: 'm', minor: 'm', m7: 'm7', major7: 'maj7', minor7: 'm7', sus: 'sus4',
  '5': '5', '7': '7', maj7: 'maj7', min7: 'm7', minmaj7: 'mmaj7',
  dim: 'dim', dim7: 'dim7', hdim7: 'm7b5', aug: 'aug', sus2: 'sus2', sus4: 'sus4',
  maj6: '6', min6: 'm6', '9': '9', maj9: 'maj9', min9: 'm9',
  '11': '11', min11: 'm11', '13': '13',
};

/** Símbolo decomposto SEM interpretar a qualidade — é o que a transposição usa. */
export interface ChordSymbolParts {
  root:     string;
  /** Tudo entre a fundamental e a barra, verbatim (`m7(b5)`, `:min7`). */
  suffix:   string;
  /** Baixo quando é NOTA; `bassRaw` guarda o texto quando não é (`6/9`, `:maj/3`). */
  bass?:    string;
  bassRaw?: string;
}

const NOTE = /^([A-Ga-g])([#b♯♭])?$/;
// Sufixo plausível de acorde: impede que uma palavra que comece por A–G
// ("Casa", "Amor") seja tratada como acorde e transposta ("Dasa").
// Em símbolo de acorde, letra minúscula só aparece nestes tokens; tirados
// eles, sobrar qualquer minúscula significa que aquilo é texto.
const SUFFIX_CHARSET = /^[\w#+\-°ºøΔ♯♭():,. ]{0,16}$/u;
const SUFFIX_WORDS = /major|minor|hdim|maj|min|dim|aug|add|sus|mi|m|b|o/g;

function isPlausibleSuffix(suffix: string): boolean {
  return SUFFIX_CHARSET.test(suffix) && !/[a-z]/.test(suffix.replace(SUFFIX_WORDS, ''));
}

function normalizeNote(letter: string, accidental: string | undefined): string {
  const acc = accidental === '♯' ? '#' : accidental === '♭' ? 'b' : accidental ?? '';
  return `${letter.toUpperCase()}${acc}`;
}

// "N" (sem acorde, ver isNoChordSymbol no backend) não é acorde — null
// explícito em vez de tentar casar.
export function splitChordSymbol(symbol: string): ChordSymbolParts | null {
  const raw = String(symbol ?? '').trim();
  if (!raw || raw.toUpperCase() === 'N') return null;

  const slash = raw.indexOf('/');
  const chordPart = slash === -1 ? raw : raw.slice(0, slash);
  const bassPart = slash === -1 ? '' : raw.slice(slash + 1).trim();

  const rootMatch = chordPart.match(/^([A-Ga-g])([#b♯♭])?/);
  if (!rootMatch) return null;
  const suffix = chordPart.slice(rootMatch[0].length);
  if (!isPlausibleSuffix(suffix)) return null;

  const parts: ChordSymbolParts = { root: normalizeNote(rootMatch[1], rootMatch[2]), suffix };
  if (!bassPart) return parts;

  const bassMatch = bassPart.match(NOTE);
  if (bassMatch) parts.bass = normalizeNote(bassMatch[1], bassMatch[2]);
  else parts.bassRaw = bassPart;
  return parts;
}

function normalizeSuffix(suffix: string): string {
  return suffix.replace(/[\s(),]/g, '').replace(/º/g, '°').replace(/♯/g, '#').replace(/♭/g, 'b');
}

/** Grafia → canônica. `approximate` quando só a forma-base foi reconhecida. */
function resolveQuality(parts: ChordSymbolParts): { quality: string; approximate: boolean } | null {
  let suffix = parts.suffix;

  if (suffix.startsWith(':')) {
    // Colon: `C:maj(9)` em Harte é ADIÇÃO de nona, não maj9 — o que vem em
    // parênteses nunca é composto com a qualidade, só a torna aproximada.
    const head = suffix.slice(1).split('(')[0];
    const quality = COLON_QUALITIES[head];
    if (quality === undefined) return null;
    const approximate = suffix.includes('(') || !!parts.bassRaw;
    return { quality, approximate };
  }

  // "C6/9" é UM acorde (seis-nove), não C6 com baixo 9. Só fora do colon: lá
  // o número depois da barra é o GRAU do baixo (`C:maj/3`).
  if (parts.bassRaw && /^\d+$/.test(parts.bassRaw)) suffix += parts.bassRaw;

  const exact = QUALITY_ALIASES[normalizeSuffix(suffix)];
  if (exact !== undefined) return { quality: exact, approximate: false };

  // Extensão/alteração que o dataset não charteia ("7(b13)", "7M(#11)"): cai
  // para o acorde-base sem os parênteses, AVISANDO que é aproximado.
  const withoutGroups = normalizeSuffix(suffix.replace(/\([^)]*\)/g, ''));
  if (withoutGroups === normalizeSuffix(suffix)) return null;
  const base = QUALITY_ALIASES[withoutGroups];
  return base === undefined ? null : { quality: base, approximate: true };
}

export interface ParsedChordSymbol {
  root:         string;
  /** Qualidade CANÔNICA — chave de `QUALITIES`, não a grafia de origem. */
  quality:      string;
  bass?:        string;
  /** A forma mostrada é do acorde-base: extensões/alterações ficaram de fora. */
  approximate?: boolean;
}

export function parseChordSymbol(symbol: string): ParsedChordSymbol | null {
  const parts = splitChordSymbol(symbol);
  if (!parts) return null;

  const resolved = resolveQuality(parts);
  if (!resolved) return null;

  return {
    root: parts.root,
    quality: resolved.quality,
    // baixo malformado: degrada pro acorde base sem baixo em vez de falhar tudo
    ...(parts.bass ? { bass: parts.bass } : {}),
    ...(resolved.approximate ? { approximate: true } : {}),
  };
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
  const suffix = QUALITIES[parsed.quality]?.suffix;
  if (rootPc === null || !suffix) return null;
  const approximate = !!parsed.approximate;

  const chordsDbKey = PITCH_CLASS_TO_CHORDS_DB_KEY[rootPc];
  const objectKey = CHORDS_DB_KEY_TO_OBJECT_KEY[chordsDbKey];

  if (parsed.bass) {
    const bassPc = noteToPitchClass(parsed.bass);
    if (bassPc !== null) {
      const bassCandidates = [PITCH_CLASS_TO_CHORDS_DB_KEY[bassPc], PITCH_CLASS_TO_SHARP[bassPc]];
      for (const bassSpelling of bassCandidates) {
        const withBass = findEntryBySuffix(objectKey, `${parsed.quality}/${bassSpelling}`);
        if (withBass) {
          return { displayRoot: chordsDbKey, displaySuffix: withBass.suffix, positions: withBass.positions, approximate };
        }
      }
    }
  }

  const plain = findEntryBySuffix(objectKey, suffix);
  if (!plain) return null;
  const shape: ChordDiagramShape = { displayRoot: chordsDbKey, displaySuffix: suffix, positions: plain.positions, approximate };

  // Inversão fora do dataset. Até 25/set/2026 caía no acorde-base em silêncio:
  // escolher "E7" e depois baixo "C" não mudava nada no desenho.
  const bassPc = parsed.bass ? noteToPitchClass(parsed.bass) : null;
  if (parsed.bass && bassPc !== null) {
    const adapted = plain.positions
      .map((position) => placeBass(position, bassPc))
      .filter((position): position is ChordDiagramPosition => position !== null);
    return adapted.length > 0
      ? { ...shape, positions: adapted, bass: { note: parsed.bass, status: 'adapted' } }
      : { ...shape, bass: { note: parsed.bass, status: 'missing' } };
  }
  return shape;
}

// Texto que acompanha o desenho quando o baixo não veio do dataset — as duas
// telas (diagrama e seletor) dizem a mesma coisa.
export function describeBassFallback(shape: ChordDiagramShape | null): string | null {
  if (!shape?.bass) return null;
  return shape.bass.status === 'adapted'
    ? `Baixo em ${shape.bass.note} montado sobre a forma do acorde; confira a digitação`
    : `Nenhuma forma com baixo em ${shape.bass.note}; o desenho mostra o acorde sem ele`;
}

// Afinação padrão, da 6ª corda (índice 0) para a 1ª.
const OPEN_STRING_PC = [4, 9, 2, 7, 11, 4];
const BASS_STRINGS = [0, 1, 2]; // o baixo só vai nas três graves

// Põe o baixo na corda mais grave que o alcança DENTRO da janela da posição
// (as mesmas casas em que a mão já está) e abafa as cordas abaixo dela. Fora
// da janela a forma deixaria de ser tocável — melhor devolver null e deixar a
// próxima posição tentar.
function placeBass(position: ChordDiagramPosition, bassPc: number): ChordDiagramPosition | null {
  const { baseFret } = position;
  // Casas relativas que a mão alcança sem sair da posição (+ solta na 1ª).
  const relFrets = baseFret === 1 ? [0, 1, 2, 3, 4] : [1, 2, 3, 4];
  for (const stringIndex of BASS_STRINGS) {
    const rel = relFrets.find((r) => {
      const absolute = r === 0 ? 0 : r + baseFret - 1;
      return (OPEN_STRING_PC[stringIndex] + absolute) % 12 === bassPc;
    });
    if (rel === undefined) continue;
    const frets = position.frets.map((f, i) => (i < stringIndex ? -1 : i === stringIndex ? rel : f));
    // Dedo do baixo não é conhecido — sem número é mais honesto que um palpite.
    const fingers = position.fingers.map((f, i) => (i <= stringIndex ? 0 : f));
    // Pestana que dependia de uma corda agora abafada/mudada segue valendo só
    // se ainda houver duas cordas na mesma casa (o ChordDiagram já confere).
    return { ...position, frets, fingers };
  }
  return null;
}

// ── Piano/teclado ────────────────────────────────────────────────────────
// chords-db só tem dataset de dedilhado pra violão/ukulele (confirmado lendo
// o pacote: só guitar.json/ukulele.json, sem piano.json) — acorde de piano
// não precisa de dataset de "como encaixar o dedo", é só teoria musical pura
// (quais teclas), então computamos direto por intervalo em vez de depender
// de fingering de terceiros. Os intervalos moram em `QUALITIES`, ao lado do
// sufixo do violão.

export interface PianoChordShape {
  rootPitchClass:  number;
  pitchClasses:    number[]; // inclui a raiz; baixo (slash) somado se for nota fora do acorde
  approximate:     boolean;
}

export function lookupPianoChordShape(symbol: string): PianoChordShape | null {
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return null;

  const rootPitchClass = noteToPitchClass(parsed.root);
  const intervals = QUALITIES[parsed.quality]?.intervals;
  if (rootPitchClass === null || !intervals) return null;

  const pitchClasses = new Set(intervals.map((i) => (rootPitchClass + i) % 12));
  if (parsed.bass) {
    const bassPc = noteToPitchClass(parsed.bass);
    if (bassPc !== null) pitchClasses.add(bassPc);
  }

  return { rootPitchClass, pitchClasses: [...pitchClasses], approximate: !!parsed.approximate };
}
