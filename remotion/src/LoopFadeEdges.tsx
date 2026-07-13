import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

const EDGE_FRAMES = 10;

// Funde pra preto nas duas pontas do arquivo — sem isso, o corte entre o último e o
// primeiro frame (quando o RN faz isLooping) fica seco. Com a fusão, o loop lê como
// uma "respirada" curta em vez de um corte brusco.
export function LoopFadeEdges({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, EDGE_FRAMES, durationInFrames - EDGE_FRAMES, durationInFrames - 1],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
}
