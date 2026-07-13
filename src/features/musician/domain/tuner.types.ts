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
