import { View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, User } from 'lucide-react-native';
import { spacing, radius, typography, gradients, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import type { MusicianPublic } from '../../domain/musician-public.types';

type Props = {
  musician: MusicianPublic;
  onPress:  () => void;
};

const CARD_WIDTH = 148;
const AVATAR_SIZE = 72;

// Carrossel "Recomendados pra você" da Home do fã (GET
// /audiences/:id/recommendations/musicians, Bloco 11.3) — mesmo anel
// gradiente teal→violeta do avatar do músico (ver HomeHeader/ProfileHeader),
// reforçando consistência visual entre as duas personas.
const useStyles = makeStyles((colors) => ({
  card: {
    width:             CARD_WIDTH,
    alignItems:       'center',
    gap:               spacing.xs,
    borderRadius:      radius.lg,
    borderWidth:        1,
    borderColor:      colors.border.default,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical:    spacing.md,
    paddingHorizontal:  spacing.sm,
  },
  avatarRing: {
    width:          AVATAR_SIZE,
    height:         AVATAR_SIZE,
    borderRadius:   AVATAR_SIZE / 2,
    padding:         2,
    alignItems:     'center',
    justifyContent: 'center',
    ...shadows.violet,
  },
  avatarInner: {
    width:            '100%',
    height:           '100%',
    borderRadius:     AVATAR_SIZE / 2,
    backgroundColor: colors.bg.surface,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:         'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  name: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
    maxWidth:   CARD_WIDTH - spacing.sm * 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            4,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  genre: {
    ...typography.caption,
    color:     colors.text.muted,
    textAlign: 'center',
  },
}));

export function MusicianRecommendationCard({ musician, onPress }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const name = musician.stage_name || musician.display_name || musician.name;

  return (
    <Pressable3DCard onPress={onPress} style={s.card} accessibilityLabel={name}>
      <LinearGradient colors={gradients.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatarRing}>
        <View style={s.avatarInner}>
          {musician.avatar ? (
            <Image source={{ uri: musician.avatar }} style={s.avatarImg} />
          ) : (
            <User size={28} color={colors.text.muted} />
          )}
        </View>
      </LinearGradient>

      <Text style={s.name} numberOfLines={1}>{name}</Text>

      <View style={s.ratingRow}>
        <Star size={12} color={colors.accent.amber} fill={colors.accent.amber} />
        <Text style={s.ratingText}>{musician.rating.toFixed(1)}</Text>
      </View>

      {musician.genres.length > 0 && (
        <Text style={s.genre} numberOfLines={1}>{musician.genres.slice(0, 2).join(' · ')}</Text>
      )}
    </Pressable3DCard>
  );
}
