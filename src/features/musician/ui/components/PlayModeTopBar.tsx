import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  title:         string;
  artist:        string;
  progress:      number; // 0..1, só pra UI — não precisa ser reanimated aqui
  pendingCount:  number;
  onPressBadge:  () => void;
  onPressBack:   () => void;
};

// Barra superior fina do Play Mode — título + linha de progresso ultra-fina
// na borda (per Stitch prompt em soundmeet-mobile-plan.md §11) + badge de
// pedidos pendentes tappable → LiveDashboard (7.8d).
export function PlayModeTopBar({ title, artist, progress, pendingCount, onPressBadge, onPressBack }: Props) {
  return (
    <View style={s.root}>
      <View style={s.row}>
        <Pressable onPress={onPressBack} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Sair do Play Mode" hitSlop={8}>
          <Text style={s.backText}>Sair</Text>
        </Pressable>

        <View style={s.titleWrap}>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          <Text style={s.artist} numberOfLines={1}>{artist}</Text>
        </View>

        {pendingCount > 0 ? (
          <Pressable onPress={onPressBadge} style={s.badge} accessibilityRole="button" accessibilityLabel={`${pendingCount} pedidos pendentes`}>
            <Text style={s.badgeText}>{pendingCount}</Text>
          </Pressable>
        ) : (
          <View style={s.badgeSpacer} />
        )}
      </View>

      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
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
    justifyContent: 'space-between',
    gap:             spacing.sm,
  },
  backBtn: {
    minWidth:       44,
    height:         44,
    justifyContent: 'center',
  },
  backText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  titleWrap: {
    flex:      1,
    alignItems: 'center',
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
    width: 44,
  },
  badgeText: {
    ...typography.caption,
    color:      colors.text.inverse,
    fontFamily: 'Inter-Bold',
  },
  progressTrack: {
    height:          2,
    borderRadius:    1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow:        'hidden',
  },
  progressFill: {
    height:          2,
    backgroundColor: colors.brand.primary,
  },
});
