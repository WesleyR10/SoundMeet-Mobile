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
import { splitChordSymbol, noteToPitchClass } from './chord-diagram-lookup';
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

// symbol como vem do backend (ex.: "F#m7", "G/B", "Bm7(b5)", "N"). semitones
// pode ser negativo. "N" (sem acorde) e texto que não é acorde voltam sem
// alteração — não há o que transpor.
//
// 🔴 Só fundamental e baixo mudam; a QUALIDADE segue verbatim. Até 25/set/2026
// o símbolo era remontado pela qualidade reconhecida pelo parser de diagramas,
// e qualidade fora daquele vocabulário (`Bm7(b5)`, `C7M(9)`, `G7(b13)`)
// voltava SEM transpor: com o tom mudado no Play Mode, esses acordes ficavam
// no tom antigo no meio dos transpostos, sem aviso. Transpor não exige
// entender a qualidade — e reescrevê-la trocaria a grafia que o músico lê.
export function transposeChordSymbol(
  symbol: string,
  semitones: number,
  preferFlats = false,
): string {
  if (semitones === 0) return symbol;
  const parts = splitChordSymbol(symbol);
  if (!parts) return symbol;

  const names = preferFlats ? FLAT_NAMES : SHARP_NAMES;
  const shift = (note: string) => {
    const pc = noteToPitchClass(note);
    return pc === null ? note : names[((pc + semitones) % 12 + 12) % 12];
  };

  const root = `${shift(parts.root)}${parts.suffix}`;
  if (parts.bass) return `${root}/${shift(parts.bass)}`;
  // Baixo que não é nota (`6/9`, colon `:maj/3`) é parte da qualidade: verbatim.
  return parts.bassRaw ? `${root}/${parts.bassRaw}` : root;
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
