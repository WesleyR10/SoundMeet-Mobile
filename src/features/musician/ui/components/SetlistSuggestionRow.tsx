import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type {
  SetlistEvidenceReason,
  SetlistSuggestion,
} from '@/shared/services/performance/performance.types';

type Props = { suggestion: SetlistSuggestion; position: number };

/**
 * Rótulo humano da evidência.
 *
 * 🔴 Cada sugestão mostra DE ONDE veio o sinal. Sugestão sem evidência exibível
 * é palpite: o músico precisa poder discordar do motivo, não só do resultado —
 * e um número sem procedência ele não tem como avaliar.
 */
const REASON_LABEL: Record<SetlistEvidenceReason, (n: number) => string> = {
  requested_and_played:  (n) => `${n}× pedida e tocada aqui`,
  requested_and_accepted: (n) => `${n}× pedida e aceita aqui`,
  requested_not_played:  (n) => `${n}× pedida e não tocada`,
  played_here_before:    (n) => `${n}× tocada nesta casa`,
  in_repertoire_never_played_here: () => 'no seu repertório, nunca tocada aqui',
};

const REASON_COLOR: Record<SetlistEvidenceReason, string> = {
  requested_and_played:  colors.status.success,
  requested_and_accepted: colors.brand.primary,
  requested_not_played:  colors.accent.amber,
  played_here_before:    colors.accent.violet,
  in_repertoire_never_played_here: colors.text.muted,
};

export function SetlistSuggestionRow({ suggestion, position }: Props) {
  return (
    <View style={s.root}>
      <Text style={s.position}>{String(position).padStart(2, '0')}</Text>

      <View style={s.info}>
        <Text style={s.title} numberOfLines={1}>{suggestion.title}</Text>
        <Text style={s.artist} numberOfLines={1}>{suggestion.artist}</Text>

        <View style={s.evidenceRow}>
          {suggestion.evidence.map((evidence) => (
            <View
              key={evidence.reason}
              style={[s.chip, { borderColor: REASON_COLOR[evidence.reason] }]}
            >
              <Text style={[s.chipText, { color: REASON_COLOR[evidence.reason] }]}>
                {REASON_LABEL[evidence.reason](evidence.occurrences)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap:            spacing.md,
    paddingVertical: spacing.sm,
  },
  position: {
    ...typography.mono,
    color: colors.text.muted,
    width: 24,
  },
  info: {
    flex: 1,
    gap:  2,
  },
  title: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  artist: {
    ...typography.caption,
    color: colors.text.muted,
  },
  evidenceRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.xs,
    marginTop:      spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical:   3,
    borderRadius:      radius.full,
    borderWidth:       1,
  },
  chipText: {
    ...typography.caption,
    fontSize: 10,
  },
});
