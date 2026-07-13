import type { ChordSheetTokenGrid } from '@/shared/utils/chord-sheet';
import type { PlayModeFlatLine } from '../domain/play-mode.types';

// ~180 palavras/minuto — pace de leitura confortável em voz alta, usado só
// quando a linha não tem NENHUM timestamp real do backend (fallback
// uniforme, ver plano Bloco 7 §1 "virtual playhead").
const MS_PER_WORD_FALLBACK = 330;
const MIN_LINE_WEIGHT_MS = 200;

// Achata sections→lines num array linear com peso relativo por linha. Peso
// vem de startMs/endMs reais dos tokens quando presentes (Modo A do
// pipeline); cai pra heurística de contagem de palavras quando a linha não
// tem nenhum timestamp (Modo B / sem alinhamento). Nunca é tempo real de
// show — é só a PROPORÇÃO usada pra distribuir a velocidade de scroll entre
// seções, dentro do ritmo geral que o usuário controla via speedMultiplier.
export function buildFlatLines(grid: ChordSheetTokenGrid): PlayModeFlatLine[] {
  const flat: PlayModeFlatLine[] = [];

  for (let sectionIndex = 0; sectionIndex < grid.length; sectionIndex++) {
    const section = grid[sectionIndex];
    for (let lineIndexInSection = 0; lineIndexInSection < section.lines.length; lineIndexInSection++) {
      const line = section.lines[lineIndexInSection];
      flat.push({
        sectionIndex,
        lineIndexInSection,
        label: lineIndexInSection === 0 ? section.label : undefined,
        tokens: line.tokens,
        weightMs: computeLineWeightMs(line.tokens),
      });
    }
  }

  return flat;
}

function computeLineWeightMs(tokens: PlayModeFlatLine['tokens']): number {
  let start: number | undefined;
  let end: number | undefined;

  for (const token of tokens) {
    if (typeof token.startMs === 'number') {
      start = start === undefined ? token.startMs : Math.min(start, token.startMs);
    }
    if (typeof token.endMs === 'number') {
      end = end === undefined ? token.endMs : Math.max(end, token.endMs);
    }
  }

  if (start !== undefined && end !== undefined && end > start) {
    return Math.max(MIN_LINE_WEIGHT_MS, end - start);
  }

  const wordCount = tokens.filter((t) => t.kind === 'word').length;
  return Math.max(MIN_LINE_WEIGHT_MS, wordCount * MS_PER_WORD_FALLBACK);
}

// cumulativeWeights[i] = fração acumulada (0..1) de peso ANTES da linha i;
// cumulativeWeights[length] = 1 (sentinela pro final da última linha).
export function buildCumulativeWeights(flatLines: PlayModeFlatLine[]): number[] {
  const total = flatLines.reduce((sum, l) => sum + l.weightMs, 0);
  if (total <= 0) return flatLines.map((_, i) => i / Math.max(1, flatLines.length)).concat(1);

  const cumulative: number[] = [0];
  let acc = 0;
  for (const line of flatLines) {
    acc += line.weightMs;
    cumulative.push(acc / total);
  }
  return cumulative;
}

// ── Worklets — chamados de dentro de useDerivedValue/useAnimatedReaction no
// hook de auto-scroll, precisam da diretiva 'worklet' por serem importados
// de outro arquivo (Reanimated não workletiza automaticamente helpers
// importados, só os definidos inline no callback). ──────────────────────────

// Binary search pelo maior índice i tal que cumulativeWeights[i] <= p.
export function findBucketIndex(p: number, cumulativeWeights: number[]): number {
  'worklet';
  let lo = 0;
  let hi = cumulativeWeights.length - 1;
  let best = 0;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (cumulativeWeights[mid] <= p) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return Math.min(best, cumulativeWeights.length - 2);
}

// progress (0..1, peso-ponderado) → posição Y de scroll (px), interpolando
// dentro do bucket [i, i+1) usando as posições de linha medidas via onLayout.
export function progressToScrollY(
  progress: number,
  lineOffsets: number[],
  cumulativeWeights: number[],
): number {
  'worklet';
  if (lineOffsets.length < 2 || cumulativeWeights.length < 2) return 0;

  const i = findBucketIndex(progress, cumulativeWeights);
  const p0 = cumulativeWeights[i];
  const p1 = cumulativeWeights[i + 1];
  const y0 = lineOffsets[i] ?? 0;
  const y1 = lineOffsets[i + 1] ?? y0;

  const span = p1 - p0;
  const fraction = span > 0 ? (progress - p0) / span : 0;
  return y0 + (y1 - y0) * Math.max(0, Math.min(1, fraction));
}

// Inverso — posição Y de scroll (px, ex.: depois de um drag manual) →
// progress (0..1). Usado no "retomar de onde o dedo deixou" (ver plano).
export function scrollYToProgress(
  y: number,
  lineOffsets: number[],
  cumulativeWeights: number[],
): number {
  'worklet';
  if (lineOffsets.length < 2 || cumulativeWeights.length < 2) return 0;

  let i = 0;
  for (let idx = 0; idx < lineOffsets.length - 1; idx++) {
    if (lineOffsets[idx] <= y) i = idx;
  }

  const y0 = lineOffsets[i] ?? 0;
  const y1 = lineOffsets[i + 1] ?? y0;
  const p0 = cumulativeWeights[i] ?? 0;
  const p1 = cumulativeWeights[i + 1] ?? p0;

  const span = y1 - y0;
  const fraction = span > 0 ? (y - y0) / span : 0;
  return Math.max(0, Math.min(1, p0 + (p1 - p0) * Math.max(0, Math.min(1, fraction))));
}

export function findActiveLineIndex(progress: number, cumulativeWeights: number[]): number {
  'worklet';
  return findBucketIndex(progress, cumulativeWeights);
}
