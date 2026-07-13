import { Text, View, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import type { NoteName } from '../../domain/tuner.types';

type Props = {
  note:        NoteName | null;
  octave:      number | null;
  // `null` = ainda sem leitura confirmada (ver useTunerPitch.ts) — nunca
  // tratar como 0: cents=0 pareceria "afinado" (verde) e Hz=0 apareceria na
  // tela antes da nota ser realmente detectada.
  frequencyHz: number | null;
  cents:       number | null;
  hasSignal:   boolean;
};

// Mesmos limiares de TunerCentsMeter.tsx (interpolação de cor do arco) —
// aqui em degraus (texto não anima suavemente como o arco).
const IN_TUNE_CENTS = 5;
const CLOSE_CENTS = 15;

// Verde dentro de ±5 cents, âmbar dentro de ±15, coral além disso — mesma
// semântica de colors.status.* usada no resto do app (PIX confirmado/pendente/
// erro), aplicada aqui à proximidade da afinação.
function colorForCents(cents: number | null, hasSignal: boolean): string {
  if (!hasSignal || cents === null) return colors.text.muted;
  const abs = Math.abs(cents);
  if (abs <= IN_TUNE_CENTS) return colors.status.success;
  if (abs <= CLOSE_CENTS) return colors.status.warning;
  return colors.accent.coral;
}

export function TunerNoteDisplay({ note, octave, frequencyHz, cents, hasSignal }: Props) {
  const color = colorForCents(cents, hasSignal);
  const hasReading = hasSignal && frequencyHz !== null;

  return (
    <View style={s.root}>
      <Text style={[s.note, { color }]}>
        {note ?? '--'}
        {note !== null && octave !== null && <Text style={s.octave}>{octave}</Text>}
      </Text>
      <Text style={s.hz}>{hasReading ? `${frequencyHz.toFixed(1)} Hz` : 'Toque uma nota'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap:         spacing.xs,
  },
  note: {
    ...typography.displayXl,
    textAlign: 'center',
  },
  octave: {
    ...typography.title,
    color: colors.text.secondary,
  },
  hz: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
