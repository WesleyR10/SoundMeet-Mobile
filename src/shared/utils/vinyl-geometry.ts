// Geometria do disco de vinil desenhado em SVG — puro, sem RN.
//
// O web tem o mesmo disco em CSS (`.sm-avatar-stage` em `soundmeet-web`):
// sulcos concêntricos e um REFLEXO parado. Aqui não existe `conic-gradient`, e
// é por isso que esta conta existe: o reflexo vira fatias finas com opacidade
// em rampa, que o olho lê como o brilho gradual do CSS.

/** Raios dos sulcos, de fora para dentro, parando antes do selo. */
export function grooveRadii(outer: number, inner: number, step = 3): number[] {
  const radii: number[] = [];
  for (let r = outer - 1.5; r > inner + 1; r -= step) radii.push(Number(r.toFixed(2)));
  return radii;
}

/**
 * Fatia de pizza (`<Path d>`), com ângulos em GRAUS no sentido do relógio a
 * partir do topo — a mesma convenção do `conic-gradient` do CSS, para os dois
 * discos terem o reflexo no mesmo lugar.
 */
export function wedgePath(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
  const point = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(rad)).toFixed(2)} ${(cy + r * Math.sin(rad)).toFixed(2)}`;
  };
  const largeArc = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${point(fromDeg)} A ${r} ${r} 0 ${largeArc} 1 ${point(toDeg)} Z`;
}

export interface SheenSlice {
  path:    string;
  opacity: number;
}

/**
 * Um brilho do reflexo: fatias de `from` a `to`, com opacidade subindo até
 * `peak` e descendo de novo — o triângulo que o `conic-gradient` desenha entre
 * `transparent`, `rgba(255,255,255,peak)` e `transparent`.
 */
export function sheenSlices(
  cx: number,
  cy: number,
  r: number,
  from: number,
  peakAt: number,
  to: number,
  peak: number,
  slices = 8,
): SheenSlice[] {
  const width = (to - from) / slices;
  return Array.from({ length: slices }, (_, index) => {
    const start = from + index * width;
    const middle = start + width / 2;
    const ramp = middle <= peakAt
      ? (middle - from) / (peakAt - from)
      : (to - middle) / (to - peakAt);
    return {
      path:    wedgePath(cx, cy, r, start, start + width),
      opacity: Number((peak * Math.max(0, ramp)).toFixed(3)),
    };
  });
}
