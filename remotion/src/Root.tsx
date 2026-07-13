import { Composition } from 'remotion';
import { StockLoop } from './StockLoop';
import { LoopFadeEdges } from './LoopFadeEdges';
import { MUSICIAN_CLIPS, FAN_CLIPS, FPS, WIDTH, HEIGHT, totalDurationInFrames } from './config';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MusicianLoop"
        component={() => (
          <LoopFadeEdges>
            <StockLoop clips={MUSICIAN_CLIPS} />
          </LoopFadeEdges>
        )}
        durationInFrames={totalDurationInFrames(MUSICIAN_CLIPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      <Composition
        id="FanLoop"
        component={() => (
          <LoopFadeEdges>
            <StockLoop clips={FAN_CLIPS} />
          </LoopFadeEdges>
        )}
        durationInFrames={totalDurationInFrames(FAN_CLIPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
