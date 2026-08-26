import { useEffect } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  label:     string;
  icon:      LucideIcon;
  isFocused: boolean;
  onPress:   () => void;
  // Contador de pedidos pendentes. Vive aqui (e não só no FAB) porque o
  // destaque de FAB passou a seguir a aba ativa: sem isso o badge do "Ao Vivo"
  // desapareceria sempre que o músico estivesse em outra aba.
  pendingCount?: number;
};

// Extraído de MusicianTabBar.tsx (limite de ~200 linhas/arquivo). Chip
// circular atrás do ícone ao ficar ativo — mesma linguagem visual do círculo
// do FAB (TabBarFabItem), só que discreta (fundo translúcido, não sólido),
// pra deixar claro que "esse efeito de destaque" não é exclusividade do Ao
// Vivo. Ícone preenchido (fill, não só stroke) quando ativo — outline quando
// inativo, mesmo idioma de tab bar do iOS (SF Symbols outline→filled).
export function TabBarItem({ label, icon: Icon, isFocused, onPress, pendingCount = 0 }: Props) {
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
        {pendingCount > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
          </View>
        )}
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
  // Mesmas medidas do badge de TabBarFabItem — o contador é o mesmo dado, então
  // não pode "mudar de tamanho" ao trocar de aba.
  badge: {
    position:          'absolute',
    top:                0,
    right:              2,
    minWidth:           18,
    height:             18,
    paddingHorizontal:  4,
    borderRadius:       9,
    backgroundColor:   colors.accent.coral,
    borderWidth:        2,
    borderColor:       colors.bg.primary,
    alignItems:        'center',
    justifyContent:    'center',
  },
  badgeText: {
    ...typography.caption,
    fontSize:   10,
    lineHeight: 12,
    fontFamily: 'Inter-Bold',
    color:      '#fff',
  },
});
