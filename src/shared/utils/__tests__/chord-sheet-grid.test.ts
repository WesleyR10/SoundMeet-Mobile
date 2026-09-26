import { buildTokenGrid, type ChordSheet } from '../chord-sheet';

/*
 * 🔴 O token precisa carregar o tempo DO ACORDE, não só o da palavra: a
 * correção de acorde casa no backend por esse tempo (tolerância de 250 ms).
 * Com o tempo da palavra, "corrigir" respondia 200 e não mudava nada.
 */
function sheet(): ChordSheet {
  return {
    music_library_id: 'm', musician_id: 'u', title: 't', artist: 'a',
    lyrics: { normalized: { sections: [{ label: 'Verso', lines: [{ tokens: [
      { text: 'Today', kind: 'word', normalized: 'today', startMs: 12_300 },
      { text: ' ', kind: 'space', normalized: ' ' },
      { text: 'is', kind: 'word', normalized: 'is', startMs: 13_000 },
    ] }] }] } },
    chords: { timeline: [{ startMs: 11_800, symbol: 'Em7' }] },
    alignment: { anchors: { '0': { sectionIndex: 0, lineIndex: 0, tokenIndex: 0 } } },
    meta: { provider: null, pipelineVersion: 1, qualityFlags: [], bpm: null, key: null },
    updated_at: '2026-09-25T00:00:00Z',
  };
}

describe('buildTokenGrid', () => {
  it('o token com acorde carrega o tempo do ACORDE, distinto do da palavra', () => {
    const [token] = buildTokenGrid(sheet())[0].lines[0].tokens;
    expect(token).toMatchObject({ chordSymbol: 'Em7', chordStartMs: 11_800, startMs: 12_300 });
  });

  it('token sem acorde não ganha chordStartMs', () => {
    const tokens = buildTokenGrid(sheet())[0].lines[0].tokens;
    expect(tokens[2].chordStartMs).toBeUndefined();
  });
});
