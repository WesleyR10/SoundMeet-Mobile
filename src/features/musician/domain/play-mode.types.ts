import type { RenderableToken } from '@/shared/utils/chord-sheet';

// Uma "linha achatada" pro motor de auto-scroll do Play Mode — em vez de
// percorrer sections→lines aninhado, o motor de scroll precisa de uma lista
// linear (uma entrada por linha renderizada, na ordem visual de cima pra
// baixo) pra poder mapear progress(0..1) → posição de scroll. `label` só é
// preenchido na primeira linha de cada seção (usado pro rótulo "Verso" etc).
export interface PlayModeFlatLine {
  sectionIndex:       number;
  lineIndexInSection:  number;
  label?:              string;
  tokens:              RenderableToken[];
  // Peso relativo (ms reais quando o chord-sheet tem timestamps; heurística
  // de leitura por contagem de palavras quando não tem — ver
  // chord-sheet-timing.ts). Nunca é tempo real de show, só proporção.
  weightMs:            number;
}
