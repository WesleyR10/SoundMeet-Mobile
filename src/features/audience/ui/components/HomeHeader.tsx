import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Sparkles } from 'lucide-react-native';
import { colors, spacing, radius, typography, gradients } from '@/shared/design-system/tokens';
import type { AudienceProfile } from '../../domain/audience.types';

type Props = {
  audience: AudienceProfile | null | undefined;
};

const AVATAR_SIZE = 56;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia,';
  if (hour < 18) return 'Boa tarde,';
  return 'Boa noite,';
}

// Header da Home do fã (Bloco 11.3) — mesmo idioma visual do HomeHeader do
// músico (avatar com ring gradiente + saudação), mas com chip de
// nível/pontos no lugar do saldo (o fã não tem carteira).
export function HomeHeader({ audience }: Props) {
  const name = audience?.nickname || audience?.name || '';

  return (
    <View style={s.root}>
      <View style={s.identity}>
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatarRing}>
          <View style={s.avatarInner}>
            {audience?.avatar ? (
              <Image source={{ uri: audience.avatar }} style={s.avatarImg} />
            ) : (
              <User size={22} color={colors.text.muted} />
            )}
          </View>
        </LinearGradient>
        <View style={s.textCol}>
          <Text style={s.greeting}>{greeting()}</Text>
          <Text style={s.name} numberOfLines={1}>{name}</Text>
        </View>
      </View>

      {!!audience && (
        <View style={s.levelChip}>
          <Sparkles size={13} color={colors.accent.amber} />
          <Text style={s.levelText}>Nível {audience.current_level}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingTop:      spacing.md,
    paddingBottom:   spacing.lg,
  },
  identity: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
    flexShrink:     1,
  },
  avatarRing: {
    width:          AVATAR_SIZE,
    height:         AVATAR_SIZE,
    borderRadius:   AVATAR_SIZE / 2,
    padding:         2,
    alignItems:     'center',
    justifyContent: 'center',
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
  textCol:  { flexShrink: 1 },
  greeting: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  name: {
    ...typography.title,
    color:    colors.text.primary,
    maxWidth: 160,
  },
  levelChip: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:               spacing.xs,
    paddingVertical:   spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius:      radius.md,
    backgroundColor:  `${colors.accent.amber}1F`,
  },
  levelText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.accent.amber,
  },
});
