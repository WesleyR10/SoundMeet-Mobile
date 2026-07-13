// Config do pipeline de loops de fundo (RoleSelectionScreen). Cada ClipSpec recorta uma
// janela de um clipe stock (Pexels, licença livre) que entra na sequência com crossfade.
export const FPS = 30;
export const WIDTH = 720;
export const HEIGHT = 1280;
export const TRANSITION_FRAMES = 18; // ~0.6s de crossfade entre clipes

export type ClipSpec = {
  src:           string; // caminho relativo a public/
  trimStartSec:  number; // onde começar a recortar do clipe original
  durationSec:   number; // duração do trecho usado no loop
};

// "Sou Músico" — alterna instrumentos/ângulos, do favorito do usuário (stage) aos demais.
export const MUSICIAN_CLIPS: ClipSpec[] = [
  { src: 'source-prepped/musico_01_blue_lights_35462349.mp4', trimStartSec: 2, durationSec: 3.5 },
  { src: 'source-prepped/musico_02_acoustic_dark_16542678.mp4', trimStartSec: 3, durationSec: 3 },
  { src: 'source-prepped/musico_03_stage_6174522.mp4', trimStartSec: 2, durationSec: 4 },
  { src: 'source-prepped/musico_04_keyboard_17443927.mp4', trimStartSec: 1, durationSec: 2.5 },
  { src: 'source-prepped/musico_05_bass_7722806.mp4', trimStartSec: 1, durationSec: 2.5 },
  { src: 'source-prepped/musico_06_drummer_8515274.mp4', trimStartSec: 1, durationSec: 3 },
];

// "Sou Fã" — multidão/energia do público.
export const FAN_CLIPS: ClipSpec[] = [
  { src: 'source-prepped/fan_02_cellphone_35340079.mp4', trimStartSec: 1, durationSec: 4 },
  { src: 'source-prepped/fan_01_confetti_34636825.mp4', trimStartSec: 1, durationSec: 4 },
  { src: 'source-prepped/fan_03_singing_dancing_7520860.mp4', trimStartSec: 2, durationSec: 4 },
];

export function totalDurationInFrames(clips: ClipSpec[]): number {
  const sum = clips.reduce((acc, c) => acc + Math.round(c.durationSec * FPS), 0);
  const transitions = (clips.length - 1) * TRANSITION_FRAMES;
  return sum - transitions;
}
