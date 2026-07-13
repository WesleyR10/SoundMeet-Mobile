import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  label:       string;
  icon?:       LucideIcon;
  selected:    boolean;
  accentColor?: string;
  onPress:     () => void;
};

// Átomo genérico reaproveitando o padrão interpolateColor de seleção do RoleCard,
// mas em formato compacto de pílula — para grupos com muitas opções (instrumentos,
// gêneros) onde cards grandes não caberiam.
export function MultiSelectChip({ label, icon: Icon, selected, accentColor = colors.brand.primary, onPress }: Props) {
  const progress = useSharedValue(selected ? 1 : 0);
  const scale    = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 220 });
  }, [selected, progress]);

  const handlePress = () => {
    scale.value = withSpring(1.08, { damping: 8, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 260 });
    });
    onPress();
  };

  const chipStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, [0, 1], [colors.border.default, accentColor]),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.03)', `${accentColor}1F`],
    ),
    transform: [{ scale: scale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colors.text.secondary, colors.text.primary]),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <Animated.View style={[s.chip, chipStyle]}>
        {Icon && (
          <Animated.View style={iconStyle}>
            <Icon size={14} color={accentColor} strokeWidth={2.5} />
          </Animated.View>
        )}
        <Animated.Text style={[s.label, labelStyle]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  chip: {
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 spacing.xs,
    borderWidth:         1,
    borderRadius:        radius.full,
    paddingVertical:     spacing.sm,
    paddingHorizontal:   spacing.md,
    minHeight:           40,
  },
  label: {
    ...typography.bodySm,
    fontFamily: 'Inter-Medium',
  },
});
