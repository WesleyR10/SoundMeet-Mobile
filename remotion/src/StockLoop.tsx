import { AbsoluteFill, OffthreadVideo, staticFile } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { FPS, TRANSITION_FRAMES, type ClipSpec } from './config';

// Encadeia os clipes com crossfade (TransitionSeries) — cada clipe entra como um
// <Sequence> recortado (startFrom) e cobre o frame inteiro via objectFit: cover,
// o que também resolve os clipes landscape (crop central automático para o formato retrato).
export function StockLoop({ clips }: { clips: ClipSpec[] }) {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>
        {clips.flatMap((clip, i) => {
          const durationInFrames = Math.round(clip.durationSec * FPS);
          const sequence = (
            <TransitionSeries.Sequence key={`clip-${i}`} durationInFrames={durationInFrames}>
              <OffthreadVideo
                src={staticFile(clip.src)}
                startFrom={Math.round(clip.trimStartSec * FPS)}
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </TransitionSeries.Sequence>
          );

          if (i === clips.length - 1) return [sequence];

          return [
            sequence,
            <TransitionSeries.Transition
              key={`transition-${i}`}
              presentation={fade()}
              timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
            />,
          ];
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
}
