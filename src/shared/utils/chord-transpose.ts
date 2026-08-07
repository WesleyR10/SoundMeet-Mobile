// Transposição de acorde (mudança de tom manual) e capotraste — os dois
// deslocam o que é MOSTRADO na cifra, mas por motivos diferentes:
//
// - Transpor: o músico quer a música numa tonalidade diferente de verdade
//   (ex.: cantor precisa de tom mais grave) — desloca o acorde REAL.
// - Capotraste: a música continua soando no tom original, mas o violonista
//   usa o braço numa casa mais acima com formas mais fáceis de tocar — o que
//   se MOSTRA na cifra vira a FORMA (o que os dedos fazem), não o acorde
//   real. Capotraste na casa N = tocar uma forma N semitons ABAIXO do
//   acorde real (a casa já soma os N semitons de volta fisicamente).
//
// Os dois se compõem: displayShift = transposeSemitones - capoFret.
import { parseChordSymbol, noteToPitchClass } from './chord-diagram-lookup';
import type { ChordSheetTokenGrid } from './chord-sheet';

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Espelha preferFlatsForKey do backend (get-chord-sheet-for-music-library.
// use-case.ts) — mesma convenção: bemol só quando a key já é bemol ou é F.
export function shouldPreferFlatsForKey(key: string | null | undefined): boolean {
  if (!key) return false;
  if (/[b♭]/i.test(key)) return true;
  if (/[#♯]/.test(key)) return false;
  return key.trim()[0]?.toUpperCase() === 'F';
}

// symbol como vem do backend (ex.: "F#m7", "G/B", "N"). semitones pode ser
// negativo. "N" (sem acorde) e símbolos não reconhecíveis voltam sem
// alteração — não há o que transpor.
export function transposeChordSymbol(
  symbol: string,
  semitones: number,
  preferFlats = false,
): string {
  if (semitones === 0) return symbol;
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return symbol;

  const names = preferFlats ? FLAT_NAMES : SHARP_NAMES;
  const rootPc = noteToPitchClass(parsed.root);
  if (rootPc === null) return symbol;

  const newRoot = names[((rootPc + semitones) % 12 + 12) % 12];
  let result = `${newRoot}${parsed.quality}`;

  if (parsed.bass) {
    const bassPc = noteToPitchClass(parsed.bass);
    result += bassPc === null
      ? `/${parsed.bass}`
      : `/${names[((bassPc + semitones) % 12 + 12) % 12]}`;
  }

  return result;
}

// Aplica a transposição em toda a grade renderável (usada depois de
// buildTokenGrid) — só mexe em tokens com chordSymbol, sem tocar no texto
// da letra.
export function transposeTokenGrid(
  grid: ChordSheetTokenGrid,
  semitones: number,
  preferFlats = false,
): ChordSheetTokenGrid {
  if (semitones === 0) return grid;
  return grid.map((section) => ({
    ...section,
    lines: section.lines.map((line) => ({
      ...line,
      tokens: line.tokens.map((token) =>
        token.chordSymbol
          ? { ...token, chordSymbol: transposeChordSymbol(token.chordSymbol, semitones, preferFlats) }
          : token,
      ),
    })),
  }));
}
