import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Star } from 'lucide-react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';

type Props = {
  value:    number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  /** Rótulo do estado atual — omitido quando ainda não há nota. */
  showLabel?: boolean;
};

const STARS = [1, 2, 3, 4, 5] as const;

/**
 * Nota de 1 a 5 em estrelas — o primeiro rating EDITÁVEL do app.
 *
 * Até aqui a estrela existia só como exibição (`ProfileHeader`,
 * `MusicianResultCard`), sempre em `colors.accent.amber`; a cor e o ícone são os
 * mesmos de propósito, para que dar a nota e ler a nota pareçam a mesma coisa.
 *
 * O alvo de toque é 48×48 (regra do CLAUDE.md) mesmo com a estrela desenhada em
 * 32 — quem avalia costuma estar de pé, no fim do show, com uma mão só.
 */
export function StarRatingInput({ value, onChange, disabled = false, showLabel = true }: Props) {
  function select(rating: number) {
    if (disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(rating);
  }

  return (
    <View style={s.root}>
      <View style={s.row} accessibilityRole="radiogroup" accessibilityLabel="Nota de 1 a 5 estrelas">
        {STARS.map((star) => {
          const filled = star <= value;
          return (
            <Pressable
              key={star}
              onPress={() => select(star)}
              disabled={disabled}
              style={s.hit}
              hitSlop={4}
              accessibilityRole="radio"
              accessibilityState={{ selected: filled, disabled }}
              accessibilityLabel={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
            >
              <Star
                size={32}
                color={filled ? colors.accent.amber : colors.text.muted}
                fill={filled ? colors.accent.amber : 'transparent'}
              />
            </Pressable>
          );
        })}
      </View>

      {showLabel && value > 0 && <Text style={s.label}>{RATING_LABEL[value]}</Text>}
    </View>
  );
}

/**
 * Rótulo por nota. Existe porque "3 estrelas" significa coisas diferentes para
 * pessoas diferentes — nomear o degrau deixa a escala explícita para quem avalia.
 */
const RATING_LABEL: Record<number, string> = {
  1: 'Ruim',
  2: 'Regular',
  3: 'Bom',
  4: 'Muito bom',
  5: 'Excelente',
};

const s = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap:        spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
  hit: {
    width:          48,
    height:         48,
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.accent.amber,
  },
});
