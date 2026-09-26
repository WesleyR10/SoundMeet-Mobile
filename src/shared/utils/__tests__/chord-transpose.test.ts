import { transposeChordSymbol, shouldPreferFlatsForKey, transposeTokenGrid } from '../chord-transpose';
import type { ChordSheetTokenGrid } from '../chord-sheet';

describe('transposeChordSymbol', () => {
  it('returns the symbol unchanged when semitones is 0', () => {
    expect(transposeChordSymbol('C', 0)).toBe('C');
  });

  it('transposes a plain major chord up', () => {
    expect(transposeChordSymbol('C', 2)).toBe('D');
  });

  it('transposes a chord with quality suffix, keeping the suffix', () => {
    expect(transposeChordSymbol('Am7', 3)).toBe('Cm7');
  });

  it('transposes down (negative semitones) and wraps around the octave', () => {
    expect(transposeChordSymbol('C', -1)).toBe('B');
  });

  it('transposes a slash chord (both root and bass)', () => {
    expect(transposeChordSymbol('G/B', 2)).toBe('A/C#');
  });

  it('uses flat spelling when preferFlats is true', () => {
    expect(transposeChordSymbol('C', 1, true)).toBe('Db');
    expect(transposeChordSymbol('C', 1, false)).toBe('C#');
  });

  it('wraps around a full octave back to the same chord', () => {
    expect(transposeChordSymbol('F#m7', 12)).toBe('F#m7');
  });

  it('returns the no-chord symbol unchanged', () => {
    expect(transposeChordSymbol('N', 3)).toBe('N');
  });

  it('returns an unparseable symbol unchanged', () => {
    expect(transposeChordSymbol('not-a-chord', 3)).toBe('not-a-chord');
  });
});

describe('shouldPreferFlatsForKey', () => {
  it('prefers flats when the key itself is spelled with a flat', () => {
    expect(shouldPreferFlatsForKey('Ebm')).toBe(true);
  });

  it('prefers sharps when the key is spelled with a sharp', () => {
    expect(shouldPreferFlatsForKey('F#')).toBe(false);
  });

  it('prefers flats for the key of F (no accidental in the name)', () => {
    expect(shouldPreferFlatsForKey('F')).toBe(true);
  });

  it('prefers sharps by default for keys with no accidental hint', () => {
    expect(shouldPreferFlatsForKey('C')).toBe(false);
    expect(shouldPreferFlatsForKey('G')).toBe(false);
  });

  it('defaults to sharps when key is missing', () => {
    expect(shouldPreferFlatsForKey(null)).toBe(false);
    expect(shouldPreferFlatsForKey(undefined)).toBe(false);
  });
});

describe('transposeTokenGrid', () => {
  const grid: ChordSheetTokenGrid = [
    {
      label: 'Verse',
      lines: [
        {
          tokens: [
            { text: 'Hello', kind: 'word', normalized: 'hello', chordSymbol: 'C' },
            { text: ' ', kind: 'space', normalized: ' ' },
            { text: 'world', kind: 'word', normalized: 'world' },
          ],
        },
      ],
    },
  ];

  it('returns the same grid reference when semitones is 0', () => {
    expect(transposeTokenGrid(grid, 0)).toBe(grid);
  });

  it('transposes only tokens that have a chordSymbol, leaving others untouched', () => {
    const result = transposeTokenGrid(grid, 2);
    expect(result[0].lines[0].tokens[0].chordSymbol).toBe('D');
    expect(result[0].lines[0].tokens[2].chordSymbol).toBeUndefined();
    expect(result[0].lines[0].tokens[2].text).toBe('world');
  });

  it('does not mutate the original grid', () => {
    transposeTokenGrid(grid, 2);
    expect(grid[0].lines[0].tokens[0].chordSymbol).toBe('C');
  });
});

/*
 * 🔴 25/set/2026 — qualidade fora do vocabulário do parser de diagramas
 * voltava SEM transpor. Com o tom mudado, `Bm7(b5)` ficava no tom antigo no
 * meio dos acordes transpostos, sem aviso nenhum.
 */
describe('transposeChordSymbol — a qualidade segue verbatim', () => {
  it.each([
    ['Bm7(b5)', 2, 'C#m7(b5)'],
    ['C7M(9)', 2, 'D7M(9)'],
    ['G7(b13)', -2, 'F7(b13)'],
    ['E°', 1, 'F°'],
    ['C6/9', 2, 'D6/9'],
    ['A:min7', 3, 'C:min7'],
  ])('%s %+d → %s', (symbol, semitones, expected) => {
    expect(transposeChordSymbol(symbol, semitones)).toBe(expected);
  });

  it('não reescreve a grafia do músico (`C7M` não vira `Cmaj7`)', () => {
    expect(transposeChordSymbol('C7M', 5)).toBe('F7M');
  });

  it('transpõe o baixo de acorde com qualidade desconhecida', () => {
    expect(transposeChordSymbol('Am7(11)/G', 2, true)).toBe('Bm7(11)/A');
  });

  it('não transpõe palavra que só começa por A–G', () => {
    expect(transposeChordSymbol('Casa', 2)).toBe('Casa');
    expect(transposeChordSymbol('Amor', 2)).toBe('Amor');
    expect(transposeChordSymbol('Bem', 2)).toBe('Bem');
  });
});
