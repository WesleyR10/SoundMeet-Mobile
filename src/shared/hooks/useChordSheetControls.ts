import { useEffect, useState } from 'react';
import type { ChordInstrument } from '@/shared/components/InstrumentToggle';

const MIN_TRANSPOSE = -11;
const MAX_TRANSPOSE = 11;

// Estado dos controles da folha de cifra (instrumento / tom / capotraste) —
// vive por sessão de tela (Play Mode ou visualizador compartilhado), não é
// persistido entre músicas nem entre aberturas do app. Cada tela instancia
// o próprio hook.
export function useChordSheetControls() {
  const [instrument, setInstrument] = useState<ChordInstrument>('guitar');
  const [transposeSemitones, setTransposeSemitonesRaw] = useState(0);
  const [capoFret, setCapoFretRaw] = useState<number | null>(null);

  // Capotraste só existe pra violão — trocar pra teclado limpa a seleção.
  useEffect(() => {
    if (instrument === 'piano' && capoFret !== null) setCapoFretRaw(null);
  }, [instrument, capoFret]);

  const setTransposeSemitones = (value: number) => {
    setTransposeSemitonesRaw(Math.max(MIN_TRANSPOSE, Math.min(MAX_TRANSPOSE, value)));
  };

  const setCapoFret = (value: number | null) => {
    setCapoFretRaw(instrument === 'piano' ? null : value);
  };

  // Deslocamento aplicado ao que é MOSTRADO na cifra: soma o tom manual e
  // subtrai o capotraste (ver chord-transpose.ts pro racional completo).
  const displayShiftSemitones = transposeSemitones - (capoFret ?? 0);

  return {
    instrument,
    setInstrument,
    transposeSemitones,
    setTransposeSemitones,
    capoFret,
    setCapoFret,
    displayShiftSemitones,
  };
}
