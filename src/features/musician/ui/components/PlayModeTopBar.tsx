import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SlidersHorizontal, Music, GitFork } from 'lucide-react-native';
import { colors, spacing, radius, typography, gradients } from '@/shared/design-system/tokens';
import { Avatar } from '@/shared/components/Avatar';

type Props = {
  title:            string;
  artist:           string;
  avatarUrl?:       string | null;
  progress:         number; // 0..1 — anima suave via Reanimated (withTiming) aqui dentro
  pendingCount:     number;
  onPressBadge:     () => void;
  onPressBack:      () => void;
  onPressSettings:  () => void;
  onPressPersonalChordSheet?: () => void;
  /**
   * Há set aberto: esta música está sendo mostrada ao público como "tocando
   * agora". Sem este sinal o músico não teria como distinguir estudo de show —
   * a tela é idêntica nos dois casos.
   */
  isBroadcasting?: boolean;
};

// Barra superior do Play Mode — avatar do músico (anel gradiente teal,
// mesmo componente Avatar.tsx já usado no chat) + título/artista + botão de
// ajustes (instrumento/tom/capotraste, ver ChordSheetControlsSheet) + badge
// de pedidos pendentes tappable → LiveDashboard (7.8d). Progresso com
// gradiente animado (não salto por re-render) — acompanha o playhead
// virtual do usePlayModeAutoScroll com uma suavização própria de 260ms.
export function PlayModeTopBar({
  title, artist, avatarUrl, progress, pendingCount, onPressBadge, onPressBack, onPressSettings, onPressPersonalChordSheet, isBroadcasting,
}: Props) {
  const progressValue = useSharedValue(progress);
  useEffect(() => {
    progressValue.value = withTiming(progress, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [progress, progressValue]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(100, progressValue.value * 100))}%`,
  }));

  return (
    <View style={s.root}>
      <View style={s.row}>
        <Pressable onPress={onPressBack} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Sair do Play Mode" hitSlop={8}>
          <Text style={s.backText}>Sair</Text>
        </Pressable>

        <Avatar
          uri={avatarUrl}
          size={32}
          fallbackIcon={Music}
          ringColors={[colors.brand.primary, colors.brand.dark]}
        />

        <View style={s.titleWrap}>
          <View style={s.titleRow}>
            {isBroadcasting && <View style={s.liveDot} />}
            <Text style={s.title} numberOfLines={1}>{title}</Text>
          </View>
          <Text style={s.artist} numberOfLines={1}>
            {isBroadcasting ? `Ao vivo · ${artist}` : artist}
          </Text>
        </View>

        <Pressable onPress={onPressSettings} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Ajustes da cifra (instrumento, tom, capotraste)" hitSlop={8}>
          <SlidersHorizontal size={20} color={colors.text.secondary} />
        </Pressable>

        {onPressPersonalChordSheet && (
          <Pressable onPress={onPressPersonalChordSheet} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Abrir ou criar cifra pessoal" hitSlop={8}>
            <GitFork size={20} color={colors.brand.primary} />
          </Pressable>
        )}

        {pendingCount > 0 ? (
          <Pressable onPress={onPressBadge} style={s.badge} accessibilityRole="button" accessibilityLabel={`${pendingCount} pedidos pendentes`}>
            <Text style={s.badgeText}>{pendingCount}</Text>
          </Pressable>
        ) : (
          <View style={s.badgeSpacer} />
        )}
      </View>

      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFillWrap, animatedFillStyle]}>
          <LinearGradient
            colors={gradients.live}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.progressGradient}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.sm,
    gap:                spacing.xs,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             spacing.sm,
  },
  backBtn: {
    minWidth:       36,
    height:         44,
    justifyContent: 'center',
  },
  backText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    ...typography.body,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color:      colors.text.primary,
  },
  artist: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  iconBtn: {
    width:          40,
    height:         40,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  badge: {
    minWidth:          28,
    height:            28,
    borderRadius:      radius.full,
    paddingHorizontal:  spacing.xs,
    backgroundColor:  colors.accent.coral,
    alignItems:        'center',
    justifyContent:    'center',
  },
  badgeSpacer: {
    width: 28,
  },
  badgeText: {
    ...typography.caption,
    color:      colors.text.inverse,
    fontFamily: 'Inter-Bold',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  liveDot: {
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: colors.status.live,
  },
  progressTrack: {
    height:          2,
    borderRadius:    1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow:        'hidden',
  },
  progressFillWrap: {
    height: 2,
  },
  progressGradient: {
    flex: 1,
  },
});
