import { useEffect, useMemo, useRef, useState } from 'react';
import { nearestGuitarString } from '../domain/tuner.math';
import { TUNER_IN_TUNE_CENTS, type GuitarStringReading } from '../domain/tuner.types';

type PitchInput = {
  frequencyHz: number | null;
  hasSignal:   boolean;
};

// Tempo que a corda precisa se manter dentro de ±TUNER_IN_TUNE_CENTS pra
// ganhar o check de "afinada" — evita marcar por um pico transitório do MPM.
const SUSTAIN_MS = 800;

// Estado do modo guitarra: corda ativa (mais próxima do Hz atual), desvio em
// cents em relação a ELA e o conjunto de cordas já afinadas na sessão (reseta
// ao sair da tela — afinação não é um dado persistente).
export function useGuitarTuning(pitch: PitchInput) {
  const [tunedStrings, setTunedStrings] = useState<ReadonlySet<number>>(new Set());
  const inTuneSinceRef = useRef<number | null>(null);

  const reading: GuitarStringReading | null = useMemo(() => {
    if (!pitch.hasSignal || pitch.frequencyHz === null) return null;
    return nearestGuitarString(pitch.frequencyHz);
  }, [pitch.hasSignal, pitch.frequencyHz]);

  useEffect(() => {
    if (!reading || Math.abs(reading.cents) > TUNER_IN_TUNE_CENTS) {
      inTuneSinceRef.current = null;
      return;
    }

    if (inTuneSinceRef.current === null) {
      inTuneSinceRef.current = Date.now();
      return;
    }

    if (Date.now() - inTuneSinceRef.current >= SUSTAIN_MS) {
      const index = reading.stringIndex;
      setTunedStrings((prev) => {
        if (prev.has(index)) return prev;
        const next = new Set(prev);
        next.add(index);
        return next;
      });
    }
  }, [reading]);

  return { reading, tunedStrings };
}
