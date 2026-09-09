import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { MultiSelectChip } from '@/shared/components/MultiSelectChip';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { INSTRUMENT_OPTIONS, GENRE_OPTIONS } from '../../domain/musician.constants';

type Props = {
  instruments:        string[];
  genres:              string[];
  onToggleInstrument: (id: string) => void;
  onToggleGenre:       (id: string) => void;
};

const useStyles = makeStyles((colors) => ({
  root: {
    gap: spacing.lg,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.8,
    color:          'rgba(255,255,255,0.55)',
    textTransform:  'uppercase',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.sm,
  },
}));

export function StepTwoTags({ instruments, genres, onToggleInstrument, onToggleGenre }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const y       = useSharedValue(16);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 320 });
    y.value       = withTiming(0, { duration: 320 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View style={[s.root, animStyle]}>
      <Text style={s.title}>O que você toca e o que toca em você</Text>
      <Text style={s.subtitle}>Escolha ao menos 1 instrumento e 1 gênero — isso ajuda o público a te encontrar.</Text>

      <View style={s.group}>
        <Text style={s.groupLabel}>Instrumentos</Text>
        <View style={s.chipWrap}>
          {INSTRUMENT_OPTIONS.map((opt) => (
            <MultiSelectChip
              key={opt.id}
              label={opt.label}
              icon={opt.icon}
              selected={instruments.includes(opt.id)}
              accentColor={colors.brand.primary}
              onPress={() => onToggleInstrument(opt.id)}
            />
          ))}
        </View>
      </View>

      <View style={s.group}>
        <Text style={s.groupLabel}>Gêneros</Text>
        <View style={s.chipWrap}>
          {GENRE_OPTIONS.map((opt) => (
            <MultiSelectChip
              key={opt.id}
              label={opt.label}
              icon={opt.icon}
              selected={genres.includes(opt.id)}
              accentColor={colors.accent.violet}
              onPress={() => onToggleGenre(opt.id)}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
