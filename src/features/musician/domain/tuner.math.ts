import { NOTE_NAMES, TUNER_MAX_HZ, TUNER_MIN_HZ, type TunerNoteReading } from './tuner.types';

const A4_HZ = 440;
const A4_MIDI = 69; // número MIDI padrão de A4

// react-native-pitchy só devolve Hz/confidence/volume — a conversão pra
// nota+oitava+cents é feita aqui (matemática padrão de semitons a partir de
// A4), não delegada à lib.
export function frequencyToNote(hz: number): TunerNoteReading {
  const semitonesFromA4 = 12 * Math.log2(hz / A4_HZ);
  const nearestMidi = Math.round(semitonesFromA4) + A4_MIDI;
  const cents = Math.round((semitonesFromA4 + A4_MIDI - nearestMidi) * 100);

  const noteIndex = ((nearestMidi % 12) + 12) % 12;
  const octave = Math.floor(nearestMidi / 12) - 1;

  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    cents,
    frequencyHz: hz,
  };
}

export function isWithinTunerRange(hz: number): boolean {
  return hz >= TUNER_MIN_HZ && hz <= TUNER_MAX_HZ;
}
