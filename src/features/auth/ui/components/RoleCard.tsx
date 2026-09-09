import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolateColor,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Check, type LucideIcon } from 'lucide-react-native';
import { spacing, radius, shadows, typography } from '@/shared/design-system/tokens';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

// rgba() explícito em vez de concatenar alpha em hex (`${accentColor}0A`) — remove
// qualquer ambiguidade de parsing de hex8 entre plataformas dentro do interpolateColor.
function withAlpha(hex: string, alpha: number): string {
  'worklet';
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type Props = {
  icon:        LucideIcon;
  emoji:       string;
  title:       string;
  subtitle:    string;
  accentColor: string;
  selected:    boolean;
  // true quando OUTRO card está selecionado — dessatura este para dar foco à escolha
  dimmed?:     boolean;
  onPress:     () => void;
};

const useStyles = makeStyles((colors) => ({
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  card: {
    flexDirection:      'row',
    alignItems:         'center',
    minHeight:           108,
    borderRadius:        radius.xl,
    paddingHorizontal:   spacing.xl,
    paddingVertical:     spacing.lg,
    gap:                 spacing.md,
    backgroundColor:     colors.bg.elevated,
    shadowOffset:        { width: 0, height: 8 },
    shadowRadius:        20,
    elevation:           4,
  },
  iconWrap: {
    width:          52,
    height:         52,
    borderRadius:   radius.lg,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap:  spacing.xs / 2,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodySm,
    fontFamily: 'Inter-Regular',
    color:      colors.text.secondary,
  },
  checkBadge: {
    width:          24,
    height:         24,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
}));

export function RoleCard({ icon: Icon, emoji, title, subtitle, accentColor, selected, dimmed = false, onPress }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const selectProgress = useSharedValue(0);
  const pulseScale      = useSharedValue(1);
  const dimOpacity      = useSharedValue(1);

  useEffect(() => {
    selectProgress.value = withTiming(selected ? 1 : 0, { duration: 260 });
    // O pulso é reforço do estado "selecionado"; quem carrega esse estado é a
    // cor da borda (`selectProgress`) e o check. Parar em 1 não perde
    // informação — só o respiro.
    pulseScale.value = selected && !reducedMotion
      ? withRepeat(withTiming(1.015, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true)
      : withTiming(1, { duration: 200 });
  }, [selected, reducedMotion, selectProgress, pulseScale]);

  useEffect(() => {
    dimOpacity.value = withTiming(dimmed ? 0.5 : 1, { duration: 260 });
  }, [dimmed, dimOpacity]);

  // Fundo NUNCA leva a cor do accent — só a borda. Colorir os dois ao mesmo tempo é o que
  // criava a leitura de "caixa dentro de caixa"; com o fundo neutro fixo, a borda passa a
  // ser o único elemento colorido (mesma lógica do FormField: cor animada só na borda).
  const cardStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      selectProgress.value,
      [0, 1],
      [withAlpha(accentColor, 0.3), accentColor],
    ),
    borderWidth: interpolate(selectProgress.value, [0, 1], [1, 1.5]),
    shadowOpacity: selectProgress.value * 0.20,
    opacity:       dimOpacity.value,
    transform:     [{ scale: pulseScale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity:   selectProgress.value,
    transform: [{ scale: selectProgress.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && s.pressed]}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
    >
      <Animated.View style={[s.card, cardStyle, { shadowColor: accentColor }]}>
        <View style={[s.iconWrap, { backgroundColor: `${accentColor}1F`, borderColor: `${accentColor}40` }]}>
          <Icon size={26} color={accentColor} strokeWidth={2} />
        </View>

        <View style={s.textBlock}>
          <Text style={s.title}>
            {title} <Text>{emoji}</Text>
          </Text>
          <Text style={s.subtitle}>{subtitle}</Text>
        </View>

        <Animated.View style={[s.checkBadge, badgeStyle, { backgroundColor: accentColor }]}>
          <Check size={14} color={colors.text.inverse} strokeWidth={3} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
