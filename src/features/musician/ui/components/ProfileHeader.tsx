import { View, Text } from 'react-native';
import { Star, BadgeCheck } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import type { MusicianProfile } from '../../domain/musician.types';
import { ProfileAvatarButton } from './ProfileAvatarButton';

type Props = {
  musician: MusicianProfile;
};

// Extraído de ViewProfileScreen.tsx (limite de ~200 linhas/screen) — hero da
// tela: avatar com ring gradiente (mesma técnica de bezel do QRFrame), nome,
// badge verificado, rating e bio.
const useStyles = makeStyles((colors) => ({
  root: {
    alignItems: 'center',
    gap:         spacing.sm,
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
}));

export function ProfileHeader({ musician }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.root}>
      {/* Tocar na foto troca a foto (25/set/2026) — antes só por Editar perfil. */}
      <ProfileAvatarButton avatarUrl={musician.avatar} />

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
