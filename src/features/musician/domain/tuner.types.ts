// Faixa alvo do afinador cromático (Bloco 8): guitarra, baixo, violão,
// cavaquinho, banjo — não é um afinador universal (voz/instrumentos agudos
// fora do escopo). E1 (~41Hz) é a corda mais grave do baixo; o teto fica bem
// acima da nota mais aguda usada nesses instrumentos, mas bem abaixo da
// faixa vocal completa (~C8/4186Hz), permitindo otimizar buffer/threshold
// pro caso de uso real do app.
export const TUNER_MIN_HZ = 41.2; // E1
export const TUNER_MAX_HZ = 1500;

export const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

export type NoteName = (typeof NOTE_NAMES)[number];

export interface TunerNoteReading {
  note:        NoteName;
  octave:      number;
  /** Desvio em cents da nota mais próxima; negativo = grave, positivo = agudo. */
  cents:       number;
  frequencyHz: number;
}

// ── Modo guitarra (redesign jul/2026, referência Pinterest 654781233368977952) ─

export type TunerMode = 'guitar' | 'chromatic';

/** Dentro de ±5 cents consideramos afinado (mesmo limiar do display/arco). */
export const TUNER_IN_TUNE_CENTS = 5;

export interface GuitarString {
  /** Nome exibido no chip (E, A, D, G, B, E). */
  label:  NoteName;
  octave: number;
  /** Frequência alvo da corda solta (afinação standard, A4=440). */
  hz:     number;
}

// Standard tuning, da 6ª (mais grave) à 1ª corda. Índices 0..5 usados pelos
// chips e pelo estado de "corda afinada" da sessão.
export const GUITAR_STANDARD_TUNING: readonly GuitarString[] = [
  { label: 'E', octave: 2, hz: 82.41 },
  { label: 'A', octave: 2, hz: 110.0 },
  { label: 'D', octave: 3, hz: 146.83 },
  { label: 'G', octave: 3, hz: 196.0 },
  { label: 'B', octave: 3, hz: 246.94 },
  { label: 'E', octave: 4, hz: 329.63 },
] as const;

export interface GuitarStringReading {
  /** Índice da corda mais próxima em GUITAR_STANDARD_TUNING (0 = 6ª/E grave). */
  stringIndex: number;
  /** Desvio em cents em relação à corda alvo; negativo = grave, positivo = agudo. */
  cents:       number;
}
