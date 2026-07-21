import { Text, View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { GUITAR_STANDARD_TUNING } from '../../domain/tuner.types';

type Props = {
  side:          'left' | 'right';
  /** Índice da corda ativa (mais próxima do Hz detectado) ou null. */
  activeIndex:   number | null;
  tunedStrings:  ReadonlySet<number>;
};

// Colunas de cordas como na referência (3+3): esquerda D-A-E (4ª,5ª,6ª,
// topo→base) e direita G-B-E (3ª,2ª,1ª). Índices de GUITAR_STANDARD_TUNING.
const LEFT_COLUMN  = [2, 1, 0] as const;
const RIGHT_COLUMN = [3, 4, 5] as const;

export function TunerStringChips({ side, activeIndex, tunedStrings }: Props) {
  const column = side === 'left' ? LEFT_COLUMN : RIGHT_COLUMN;

  return (
    <View style={s.column}>
      {column.map((stringIndex) => {
        const string  = GUITAR_STANDARD_TUNING[stringIndex];
        const isActive = activeIndex === stringIndex;
        const isTuned  = tunedStrings.has(stringIndex);

        return (
          <View
            key={stringIndex}
            style={[
              s.chip,
              isTuned && s.chipTuned,
              isActive && s.chipActive,
              isActive && shadows.brand,
            ]}
            accessibilityLabel={`Corda ${string.label}${string.octave}${isTuned ? ' afinada' : ''}${isActive ? ' — detectada' : ''}`}
          >
            <Text style={[s.chipText, isTuned && s.chipTextTuned, isActive && s.chipTextActive]}>
              {string.label}
            </Text>
            {isTuned && (
              <View style={s.tunedBadge}>
                <Check size={10} color={colors.text.inverse} strokeWidth={3.5} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  column: {
    justifyContent: 'space-between',
    // altura casa com os 3 tarraxais do TunerHeadstock (PEG_YS)
    height:          190,
    paddingVertical: spacing.xs,
  },
  chip: {
    width:            48,
    height:           48,
    borderRadius:     radius.md,
    borderWidth:       1,
    borderColor:      colors.border.strong,
    backgroundColor:  'rgba(255,255,255,0.04)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  chipActive: {
    borderColor:     colors.brand.primary,
    backgroundColor: colors.brand.muted,
  },
  chipTuned: {
    borderColor: colors.status.success,
  },
  chipText: {
    ...typography.title,
    fontFamily: 'SpaceGrotesk-Bold',
    color:      colors.text.secondary,
  },
  chipTextActive: {
    color: colors.brand.primary,
  },
  chipTextTuned: {
    color: colors.status.success,
  },
  tunedBadge: {
    position:        'absolute',
    top:              -6,
    right:            -6,
    width:            16,
    height:           16,
    borderRadius:     radius.full,
    backgroundColor: colors.status.success,
    alignItems:      'center',
    justifyContent:  'center',
  },
});
