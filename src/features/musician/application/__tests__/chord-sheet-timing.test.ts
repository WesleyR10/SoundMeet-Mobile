import type { ChordSheetTokenGrid } from '@/shared/utils/chord-sheet';
import type { PlayModeFlatLine } from '../../domain/play-mode.types';
import {
  buildCumulativeWeights,
  buildFlatLines,
  findActiveLineIndex,
  findBucketIndex,
  progressToScrollY,
  scrollYToProgress,
} from '../chord-sheet-timing';

function word(text: string, startMs?: number, endMs?: number) {
  return { text, kind: 'word' as const, normalized: text.toLowerCase(), startMs, endMs };
}

describe('buildFlatLines', () => {
  it('achata sections→lines preservando índices e o label só na primeira linha da seção', () => {
    const grid: ChordSheetTokenGrid = [
      {
        label: 'Verso 1',
        lines: [
          { tokens: [word('oi'), word('mundo')] },
          { tokens: [word('linha'), word('dois')] },
        ],
      },
      {
        label: 'Refrão',
        lines: [{ tokens: [word('ref')] }],
      },
    ];

    const flat = buildFlatLines(grid);

    expect(flat).toHaveLength(3);
    expect(flat[0]).toMatchObject({ sectionIndex: 0, lineIndexInSection: 0, label: 'Verso 1' });
    expect(flat[1]).toMatchObject({ sectionIndex: 0, lineIndexInSection: 1, label: undefined });
    expect(flat[2]).toMatchObject({ sectionIndex: 1, lineIndexInSection: 0, label: 'Refrão' });
  });

  it('usa startMs/endMs reais dos tokens quando presentes (Modo A) — não a heurística de palavras', () => {
    const grid: ChordSheetTokenGrid = [
      { lines: [{ tokens: [word('a', 1000, 1200), word('b', 1200, 4000)] }] },
    ];

    const [line] = buildFlatLines(grid);

    // peso = endMs (4000) - startMs (1000) = 3000ms, não 2 palavras * 330ms
    expect(line.weightMs).toBe(3000);
  });

  it('cai para heurística de ~330ms/palavra quando a linha não tem timestamp nenhum', () => {
    const grid: ChordSheetTokenGrid = [{ lines: [{ tokens: [word('uma'), word('duas'), word('tres')] }] }];

    const [line] = buildFlatLines(grid);

    expect(line.weightMs).toBe(3 * 330);
  });

  it('aplica o piso mínimo de peso (200ms) mesmo para linha vazia ou muito curta', () => {
    const grid: ChordSheetTokenGrid = [{ lines: [{ tokens: [] }] }];

    const [line] = buildFlatLines(grid);

    expect(line.weightMs).toBe(200);
  });

  it('ignora tokens de pontuação/espaço na contagem de palavras do fallback', () => {
    const grid: ChordSheetTokenGrid = [
      {
        lines: [
          {
            tokens: [
              word('oi'),
              { text: ',', kind: 'punct', normalized: ',' },
              { text: ' ', kind: 'space', normalized: ' ' },
              word('mundo'),
            ],
          },
        ],
      },
    ];

    const [line] = buildFlatLines(grid);

    expect(line.weightMs).toBe(2 * 330); // só 'oi' e 'mundo' contam
  });
});

describe('buildCumulativeWeights', () => {
  const makeLine = (weightMs: number): PlayModeFlatLine => ({
    sectionIndex: 0,
    lineIndexInSection: 0,
    tokens: [],
    weightMs,
  });

  it('normaliza pesos em frações acumuladas de 0 a 1, terminando em 1', () => {
    const lines = [makeLine(100), makeLine(300), makeLine(600)];

    const cumulative = buildCumulativeWeights(lines);

    expect(cumulative).toEqual([0, 0.1, 0.4, 1]);
  });

  it('tem length = flatLines.length + 1 (sentinela final)', () => {
    const lines = [makeLine(100), makeLine(200)];
    expect(buildCumulativeWeights(lines)).toHaveLength(3);
  });

  it('linhas de peso igual dividem o progresso igualmente', () => {
    const lines = [makeLine(100), makeLine(100), makeLine(100), makeLine(100)];
    expect(buildCumulativeWeights(lines)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('fallback uniforme quando o peso total é zero (evita divisão por zero)', () => {
    const lines = [makeLine(0), makeLine(0)];
    const cumulative = buildCumulativeWeights(lines);
    expect(cumulative[cumulative.length - 1]).toBe(1);
    expect(cumulative).toHaveLength(3);
  });
});

describe('findBucketIndex', () => {
  const cumulative = [0, 0.25, 0.5, 0.75, 1];

  it('encontra o maior índice cujo peso acumulado ainda é <= p', () => {
    expect(findBucketIndex(0, cumulative)).toBe(0);
    expect(findBucketIndex(0.25, cumulative)).toBe(1);
    expect(findBucketIndex(0.4, cumulative)).toBe(1);
    expect(findBucketIndex(0.9, cumulative)).toBe(3);
  });

  it('nunca retorna o último índice (sentinela) — sempre deixa um bucket [i, i+1) à frente', () => {
    expect(findBucketIndex(1, cumulative)).toBe(cumulative.length - 2);
  });
});

describe('progressToScrollY / scrollYToProgress — inversas uma da outra', () => {
  const lineOffsets = [0, 100, 250, 400];
  const cumulativeWeights = [0, 0.2, 0.6, 1];

  it('progressToScrollY interpola linearmente dentro do bucket', () => {
    // progress=0.4 está na metade do bucket [0.2, 0.6] → metade do caminho entre y=100 e y=250
    expect(progressToScrollY(0.4, lineOffsets, cumulativeWeights)).toBeCloseTo(175);
  });

  it('progressToScrollY nos extremos bate exatamente nos offsets de linha', () => {
    expect(progressToScrollY(0, lineOffsets, cumulativeWeights)).toBe(0);
    expect(progressToScrollY(1, lineOffsets, cumulativeWeights)).toBeCloseTo(400);
  });

  it('scrollYToProgress é o inverso de progressToScrollY (round-trip)', () => {
    const y = progressToScrollY(0.4, lineOffsets, cumulativeWeights);
    const roundTrip = scrollYToProgress(y, lineOffsets, cumulativeWeights);
    expect(roundTrip).toBeCloseTo(0.4);
  });

  it('retorna 0 com dados insuficientes (menos de 2 linhas) em vez de lançar', () => {
    expect(progressToScrollY(0.5, [0], [0, 1])).toBe(0);
    expect(scrollYToProgress(50, [0], [0, 1])).toBe(0);
  });

  it('scrollYToProgress satura em [0, 1] mesmo com y fora do range medido', () => {
    expect(scrollYToProgress(-50, lineOffsets, cumulativeWeights)).toBeGreaterThanOrEqual(0);
    expect(scrollYToProgress(9999, lineOffsets, cumulativeWeights)).toBeLessThanOrEqual(1);
  });
});

describe('findActiveLineIndex', () => {
  it('é um alias direto de findBucketIndex', () => {
    const cumulative = [0, 0.25, 0.5, 0.75, 1];
    expect(findActiveLineIndex(0.6, cumulative)).toBe(findBucketIndex(0.6, cumulative));
  });
});
