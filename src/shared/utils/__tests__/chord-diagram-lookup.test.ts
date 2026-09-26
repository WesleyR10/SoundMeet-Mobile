import { parseChordSymbol, lookupChordDiagram, lookupPianoChordShape, describeBassFallback } from '../chord-diagram-lookup';

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

/*
 * 🔴 25/set/2026 — "clico no acorde e não aparece no instrumento". O parser só
 * conhecia 13 grafias exatas; o backend (`ChordSymbol`) emite `Bm7(b5)`,
 * `Am(maj7)`, `Cmaj9`, `G7(b9)`, e o músico digita `C7M`, `E°`, `A4`. Tudo
 * isso caía em "Diagrama não disponível".
 */
describe('parseChordSymbol — os três dialetos chegam à mesma qualidade', () => {
  it.each([
    // brasileiro (Cifra Club / digitado)
    ['C7M', 'maj7'], ['Am7(b5)', 'm7b5'], ['Bm7(5-)', 'm7b5'], ['E°', 'dim'],
    ['Eº', 'dim'], ['E°7', 'dim7'], ['C+', 'aug'], ['C5+', 'aug'], ['A4', 'sus4'],
    ['G7(4)', '7sus4'], ['C7(9)', '9'], ['C7M(9)', 'maj9'], ['Dm7(9)', 'm9'],
    ['C(add9)', 'add9'], ['C2', 'add9'], ['Am(add9)', 'madd9'], ['Am(7M)', 'mmaj7'],
    ['C6(9)', '69'], ['C6/9', '69'], ['A7(b9)', '7b9'], ['A7(#9)', '7#9'],
    // como o backend escreve (`ChordSymbol.toString`)
    ['Bm7(b5)', 'm7b5'], ['Am(maj7)', 'mmaj7'], ['Cmaj9', 'maj9'], ['Cdim7', 'dim7'],
    ['C6add9', '69'], ['C5', '5'], ['Csus47', '7sus4'], ['Caug7', 'aug7'],
    // colon do worker MIR
    ['C:maj', ''], ['A:min', 'm'], ['A:min7', 'm7'], ['B:hdim7', 'm7b5'],
    ['G:7', '7'], ['F:maj7', 'maj7'], ['D:sus4', 'sus4'], ['E:dim7', 'dim7'],
    // sinônimos que o `ChordSymbol` do backend também aceita no colon
    ['C:major', ''], ['C:minor', 'm'], ['C:major7', 'maj7'], ['C:minor7', 'm7'], ['C:sus', 'sus4'],
  ])('%s → %j', (symbol, quality) => {
    expect(parseChordSymbol(symbol)).toMatchObject({ quality });
    expect(parseChordSymbol(symbol)?.approximate).toBeUndefined();
  });

  it('normaliza acidente unicode na fundamental e no baixo', () => {
    expect(parseChordSymbol('F♯m7/C♯')).toEqual({ root: 'F#', quality: 'm7', bass: 'C#' });
  });

  it('extensão sem forma no dataset cai no acorde-base, marcada APROXIMADA', () => {
    expect(parseChordSymbol('G7(b13)')).toEqual({ root: 'G', quality: '7', approximate: true });
    expect(parseChordSymbol('C7M(#11)')).toEqual({ root: 'C', quality: 'maj7', approximate: true });
  });

  it('colon com adição em parênteses NÃO vira maj9 — é aproximado', () => {
    // Em Harte, `C:maj(9)` é tríade + nona adicionada, não sétima maior com nona.
    expect(parseChordSymbol('C:maj(9)')).toEqual({ root: 'C', quality: '', approximate: true });
  });

  it('colon com baixo em grau é aproximado (a inversão não é desenhada)', () => {
    expect(parseChordSymbol('C:maj/3')).toEqual({ root: 'C', quality: '', approximate: true });
  });

  it('não adivinha `7+` — é sétima aumentada numa escola e sétima maior noutra', () => {
    expect(parseChordSymbol('C7+')).toBeNull();
  });

  it('palavra que começa por A–G não vira acorde', () => {
    expect(parseChordSymbol('Casa')).toBeNull();
    expect(parseChordSymbol('Bom dia')).toBeNull();
  });
});

describe('lookupChordDiagram / lookupPianoChordShape — grafias do backend', () => {
  it.each(['Bm7(b5)', 'C7M', 'Am(maj7)', 'E:min', 'G:maj', 'Cdim7', 'Csus47'])(
    'acha forma de violão para %s',
    (symbol) => {
      const shape = lookupChordDiagram(symbol);
      expect(shape?.positions.length).toBeGreaterThan(0);
      expect(shape?.approximate).toBe(false);
    },
  );

  it('forma aproximada chega ao chamador com o aviso', () => {
    expect(lookupChordDiagram('G7(b13)')).toMatchObject({ displaySuffix: '7', approximate: true });
  });

  it('power chord não tem forma no dataset do violão, mas tem teclas', () => {
    expect(lookupChordDiagram('C5')).toBeNull();
    expect(lookupPianoChordShape('C5')?.pitchClasses.sort((a, b) => a - b)).toEqual([0, 7]);
  });

  it('meio-diminuto no teclado: B D F A', () => {
    expect(lookupPianoChordShape('Bm7(b5)')?.pitchClasses.sort((a, b) => a - b)).toEqual([2, 5, 9, 11]);
  });
});

describe('lookupChordDiagram — baixo fora do dataset', () => {
  const OPEN = [4, 9, 2, 7, 11, 4];
  // Classe de altura da corda mais grave que SOA — é o que o ouvido chama de baixo.
  const lowestPc = (frets: number[], baseFret: number) => {
    const i = frets.findIndex((f) => f >= 0);
    const abs = frets[i] === 0 ? 0 : frets[i] + baseFret - 1;
    return (OPEN[i] + abs) % 12;
  };

  it('E7/C: o desenho muda e toda posição tem dó na corda mais grave', () => {
    const plain = lookupChordDiagram('E7')!;
    const slash = lookupChordDiagram('E7/C')!;
    expect(slash.bass).toEqual({ note: 'C', status: 'adapted' });
    expect(slash.positions[0].frets).not.toEqual(plain.positions[0].frets);
    for (const p of slash.positions) expect(lowestPc(p.frets, p.baseFret)).toBe(0);
  });

  it('inversão que o chords-db já charteia não passa pela adaptação', () => {
    expect(lookupChordDiagram('C/E')!.bass).toBeUndefined();
  });

  it('a UI explica o desenho adaptado', () => {
    expect(describeBassFallback(lookupChordDiagram('E7/C'))).toMatch(/Baixo em C/);
    expect(describeBassFallback(lookupChordDiagram('E7'))).toBeNull();
  });
});
