import { parseChordSymbol, lookupChordDiagram, lookupPianoChordShape } from '../chord-diagram-lookup';

describe('parseChordSymbol', () => {
  it('parses a plain major chord', () => {
    expect(parseChordSymbol('C')).toEqual({ root: 'C', quality: '' });
  });

  it('parses a minor chord with sharp root', () => {
    expect(parseChordSymbol('F#m')).toEqual({ root: 'F#', quality: 'm' });
  });

  it('parses every quality offered by the personal chord picker', () => {
    const cases: Array<[string, string]> = [
      ['C', ''],
      ['Cm', 'm'],
      ['C7', '7'],
      ['Cmaj7', 'maj7'],
      ['Cm7', 'm7'],
      ['Cdim', 'dim'],
      ['Caug', 'aug'],
      ['Csus2', 'sus2'],
      ['Csus4', 'sus4'],
      ['C6', '6'],
      ['Cm6', 'm6'],
      ['C9', '9'],
      ['Cm7b5', 'm7b5'],
    ];
    for (const [symbol, quality] of cases) {
      expect(parseChordSymbol(symbol)).toEqual({ root: 'C', quality });
    }
  });

  it('parses a slash chord', () => {
    expect(parseChordSymbol('G/B')).toEqual({ root: 'G', quality: '', bass: 'B' });
  });

  it('parses a flat root', () => {
    expect(parseChordSymbol('Bbdim')).toEqual({ root: 'Bb', quality: 'dim' });
  });

  it('returns null for the no-chord symbol', () => {
    expect(parseChordSymbol('N')).toBeNull();
  });

  it('returns null for an unrecognized quality', () => {
    expect(parseChordSymbol('Cxyz')).toBeNull();
  });

  it('degrades to base chord when the bass note is malformed', () => {
    expect(parseChordSymbol('C/')).toEqual({ root: 'C', quality: '' });
  });
});

describe('lookupChordDiagram', () => {
  it('resolves a plain major chord shape', () => {
    const shape = lookupChordDiagram('C');
    expect(shape).not.toBeNull();
    expect(shape?.displayRoot).toBe('C');
    expect(shape?.displaySuffix).toBe('major');
    expect(shape?.positions.length).toBeGreaterThan(0);
  });

  it('resolves a sharp-root minor7 chord (object-key word-form root)', () => {
    const shape = lookupChordDiagram('F#m7');
    expect(shape).not.toBeNull();
    expect(shape?.displayRoot).toBe('F#');
    expect(shape?.displaySuffix).toBe('m7');
  });

  it('resolves a flat-root major chord', () => {
    const shape = lookupChordDiagram('Eb');
    expect(shape).not.toBeNull();
    expect(shape?.displayRoot).toBe('Eb');
  });

  it('resolves an enharmonic equivalent to the same fixed chords-db spelling', () => {
    // D# e Eb são a mesma classe de altura — chords-db só charteia uma
    // grafia fixa (Eb) independente de qual o backend mandou.
    const viaSharp = lookupChordDiagram('D#');
    const viaFlat = lookupChordDiagram('Eb');
    expect(viaSharp?.displayRoot).toBe(viaFlat?.displayRoot);
  });

  it('resolves an exact slash-chord fingering when chords-db charts it', () => {
    // Confirmado direto no dataset real: C tem suffix "/E" cadastrado.
    const shape = lookupChordDiagram('C/E');
    expect(shape).not.toBeNull();
    expect(shape?.displaySuffix).toBe('/E');
  });

  it('falls back to the plain chord when the exact slash inversion is not charted', () => {
    // C/B não está no dataset (só /E, /F, /G) — deve cair pro C maior liso.
    const shape = lookupChordDiagram('C/B');
    expect(shape).not.toBeNull();
    expect(shape?.displaySuffix).toBe('major');
  });

  it('returns null for the no-chord symbol', () => {
    expect(lookupChordDiagram('N')).toBeNull();
  });

  it('returns null for an unparseable symbol', () => {
    expect(lookupChordDiagram('not-a-chord')).toBeNull();
  });
});

describe('lookupPianoChordShape', () => {
  it('computes the correct pitch classes for a major triad', () => {
    // C maior: C(0) E(4) G(7)
    const shape = lookupPianoChordShape('C');
    expect(shape).not.toBeNull();
    expect(shape?.rootPitchClass).toBe(0);
    expect(new Set(shape?.pitchClasses)).toEqual(new Set([0, 4, 7]));
  });

  it('computes the correct pitch classes for a minor7 chord', () => {
    // Am7: A(9) C(0) E(4) G(7)
    const shape = lookupPianoChordShape('Am7');
    expect(shape).not.toBeNull();
    expect(shape?.rootPitchClass).toBe(9);
    expect(new Set(shape?.pitchClasses)).toEqual(new Set([9, 0, 4, 7]));
  });

  it('computes maj7 correctly (distinct from dominant 7)', () => {
    // Cmaj7: C(0) E(4) G(7) B(11) — NÃO inclui Bb(10) como o C7 incluiria
    const shape = lookupPianoChordShape('Cmaj7');
    expect(new Set(shape?.pitchClasses)).toEqual(new Set([0, 4, 7, 11]));
  });

  it('computes the extended picker qualities', () => {
    expect(new Set(lookupPianoChordShape('C6')?.pitchClasses)).toEqual(new Set([0, 4, 7, 9]));
    expect(new Set(lookupPianoChordShape('Cm6')?.pitchClasses)).toEqual(new Set([0, 3, 7, 9]));
    expect(new Set(lookupPianoChordShape('C9')?.pitchClasses)).toEqual(new Set([0, 2, 4, 7, 10]));
    expect(new Set(lookupPianoChordShape('Cm7b5')?.pitchClasses)).toEqual(new Set([0, 3, 6, 10]));
  });

  it('includes the slash bass note even when outside the base triad', () => {
    // G/F# — F#(6) não é nota do triad de G maior (7,11,2) — deve aparecer somada
    const shape = lookupPianoChordShape('G/F#');
    expect(shape?.pitchClasses).toContain(6);
  });

  it('does not duplicate the bass note when it is already a chord tone', () => {
    // C/E — E(4) já é a terça do próprio C maior
    const shape = lookupPianoChordShape('C/E');
    const occurrences = shape?.pitchClasses.filter((pc) => pc === 4).length;
    expect(occurrences).toBe(1);
  });

  it('returns null for the no-chord symbol', () => {
    expect(lookupPianoChordShape('N')).toBeNull();
  });

  it('returns null for an unparseable symbol', () => {
    expect(lookupPianoChordShape('not-a-chord')).toBeNull();
  });
});
