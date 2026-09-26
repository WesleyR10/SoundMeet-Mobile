import { View, Text, Pressable } from 'react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import type { ThemeColors } from '@/shared/services/ThemeContext';
import { openExternalUrl } from '@/shared/services/external-link/openExternalUrl';
import { buildSocialUrl, type SocialPlatform } from '@/shared/utils/external-url';
import type { SocialLinks } from '../../domain/musician.types';

type Props = {
  socialLinks: SocialLinks | null;
};

// SM-025 — `key` é a plataforma, e a plataforma é o que define a allowlist do
// link. O `normalizeSocialUrl` local que existia aqui aceitava `http://` e
// qualquer host, incluindo `https://instagram.com@evil.example/`.
//
// Tema: FUNÇÃO das cores, não constante de módulo — como constante ela seria
// avaliada no carregamento e congelaria a paleta escura.
const badgesFor = (colors: ThemeColors): { key: SocialPlatform; label: string; color: string }[] => [
  { key: 'instagram', label: 'IG', color: colors.accent.coral },
  { key: 'youtube',   label: 'YT', color: colors.accent.violetLight },
  { key: 'spotify',   label: 'SP', color: colors.brand.primary },
];

export function ProfileSocialLinks({ socialLinks }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const active = badgesFor(colors).filter((b) => !!socialLinks?.[b.key]);
  if (active.length === 0) return null;

  return (
    <View style={s.root}>
      <Text style={s.label}>Links sociais</Text>
      <View style={s.list}>
        {active.map((b) => {
          const value = socialLinks![b.key]!;
          return (
            <Pressable
              key={b.key}
              onPress={() => void openExternalUrl(buildSocialUrl(b.key, value))}
              style={s.item}
              accessibilityRole="link"
              accessibilityLabel={b.key}
            >
              <View style={[s.badge, { backgroundColor: `${b.color}29` }]}>
                <Text style={[s.badgeText, { color: b.color }]}>{b.label}</Text>
              </View>
              <Text style={s.value} numberOfLines={1}>{value}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.6,
    color:          colors.text.secondary,
    textTransform:  'uppercase',
  },
  list: {
    gap: spacing.sm,
  },
  item: {
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 spacing.md,
    backgroundColor:    colors.bg.surface,
    borderWidth:         1,
    borderColor:        colors.border.default,
    borderRadius:        radius.lg,
    padding:             spacing.md,
  },
  badge: {
    width:            40,
    height:           40,
    borderRadius:     radius.md,
    alignItems:      'center',
    justifyContent:  'center',
  },
  badgeText: {
    ...typography.caption,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  value: {
    ...typography.body,
    color: colors.text.primary,
    flex:  1,
  },
}));
