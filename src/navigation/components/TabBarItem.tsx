import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  label:     string;
  icon:      LucideIcon;
  isFocused: boolean;
  onPress:   () => void;
};

// Extraído de MusicianTabBar.tsx (limite de ~200 linhas/arquivo). Chip
// circular atrás do ícone ao ficar ativo — mesma linguagem visual do círculo
// do FAB (TabBarFabItem), só que discreta (fundo translúcido, não sólido),
// pra deixar claro que "esse efeito de destaque" não é exclusividade do Ao
// Vivo. Ícone preenchido (fill, não só stroke) quando ativo — outline quando
// inativo, mesmo idioma de tab bar do iOS (SF Symbols outline→filled).
export function TabBarItem({ label, icon: Icon, isFocused, onPress }: Props) {
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, { damping: 10, stiffness: 220 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['transparent', `${colors.brand.primary}20`]),
    transform:        [{ scale: 1 + progress.value * 0.1 }],
  }));
  const colorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colors.text.secondary, colors.brand.primary]),
  }));

  return (
    <Pressable
      onPress={onPress}
      style={s.tabWrap}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      hitSlop={8}
    >
      <Animated.View style={[s.iconChip, chipStyle]}>
        <Icon
          size={20}
          color={isFocused ? colors.brand.primary : colors.text.secondary}
          fill={isFocused ? colors.brand.primary : 'none'}
          strokeWidth={2.2}
        />
      </Animated.View>
      <Animated.Text style={[s.label, colorStyle, isFocused && s.labelActive]}>{label}</Animated.Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  tabWrap: {
    alignItems: 'center',
    gap:         4,
    width:       60,
    paddingTop:  spacing.xs,
  },
  iconChip: {
    width:          40,
    height:         40,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
  },
  labelActive: {
    fontFamily: 'Inter-Bold',
  },
});
