import { View, Text } from 'react-native';
import { Users } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { GlowCard } from '@/shared/components/GlowCard';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import { Avatar } from '@/shared/components/Avatar';
import type { Band } from '../../domain/band.types';

type Props = {
  band:       Band;
  onPress:    () => void;
  riseDelay?: number;
};

// Linha da MyBandsScreen — mesmo idioma visual de ConversationListItem
// (GlowCard + Pressable3DCard + Avatar com anel), accent violeta (mesma
// escolha de "momento especial" do design-system.md usada no chat).
const useStyles = makeStyles((colors) => ({
  card: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
    padding:        spacing.md,
  },
  info: {
    flex: 1,
    gap:  2,
  },
  name: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  meta: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
}));

export function BandListItem({ band, onPress, riseDelay = 0 }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const memberCount = band.members.length;
  const memberLabel = memberCount === 1 ? '1 membro' : `${memberCount} membros`;

  return (
    <Pressable3DCard onPress={onPress} accessibilityLabel={`Ver detalhes da banda ${band.name}`}>
      <GlowCard accentColor={colors.accent.violet} riseDelay={riseDelay} style={s.card}>
        <Avatar
          uri={band.avatar}
          size={48}
          fallbackIcon={Users}
          ringColors={[colors.accent.violet, colors.brand.primary]}
        />

        <View style={s.info}>
          <Text style={s.name} numberOfLines={1}>{band.name}</Text>
          <Text style={s.meta} numberOfLines={1}>{memberLabel}{!band.is_active ? ' · inativa' : ''}</Text>
        </View>
      </GlowCard>
    </Pressable3DCard>
  );
}
