import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, BadgeCheck, User } from 'lucide-react-native';
import { colors, spacing, gradients, typography, shadows } from '@/shared/design-system/tokens';
import type { MusicianProfile } from '../../domain/musician.types';

type Props = {
  musician: MusicianProfile;
};

const AVATAR_SIZE = 108;

// Extraído de ViewProfileScreen.tsx (limite de ~200 linhas/screen) — hero da
// tela: avatar com ring gradiente (mesma técnica de bezel do QRFrame), nome,
// badge verificado, rating e bio.
export function ProfileHeader({ musician }: Props) {
  return (
    <View style={s.root}>
      <LinearGradient colors={gradients.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatarRing}>
        <View style={s.avatarInner}>
          {musician.avatar ? (
            <Image source={{ uri: musician.avatar }} style={s.avatarImg} />
          ) : (
            <User size={40} color={colors.text.muted} />
          )}
        </View>
      </LinearGradient>

      <View style={s.nameRow}>
        <Text style={s.name}>{musician.display_name || musician.stage_name || musician.name}</Text>
        {musician.is_verified && <BadgeCheck size={20} color={colors.brand.primary} />}
      </View>

      <View style={s.ratingRow}>
        <Star size={15} color={colors.accent.amber} fill={colors.accent.amber} />
        <Text style={s.ratingText}>
          {musician.rating.toFixed(1)} · {musician.total_ratings} avaliaç{musician.total_ratings === 1 ? 'ão' : 'ões'}
        </Text>
      </View>

      {!!musician.bio && <Text style={s.bio}>{musician.bio}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap:         spacing.sm,
  },
  avatarRing: {
    width:          AVATAR_SIZE,
    height:         AVATAR_SIZE,
    borderRadius:   AVATAR_SIZE / 2,
    padding:         3,
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
  avatarImg: {
    width:  '100%',
    height: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
    marginTop:      spacing.sm,
  },
  name: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  ratingText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  bio: {
    ...typography.body,
    color:      colors.text.secondary,
    textAlign:  'center',
    marginTop:  spacing.sm,
  },
});
