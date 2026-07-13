import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { MusicianPublicSocialLinks } from '../../domain/musician-public.types';

type Props = {
  socialLinks: MusicianPublicSocialLinks | null;
};

// Mesmo padrão de badge-de-letra de ProfileSocialLinks (musician feature) —
// lucide-react-native não tem ícones de marca (Instagram/YouTube), cópia
// intencional, não import (FSD: nunca cruzar features).
const BADGES: { key: keyof MusicianPublicSocialLinks; label: string; color: string }[] = [
  { key: 'instagram', label: 'IG', color: colors.accent.coral },
  { key: 'youtube',   label: 'YT', color: colors.accent.violetLight },
  { key: 'spotify',   label: 'SP', color: colors.brand.primary },
];

function normalizeSocialUrl(key: keyof MusicianPublicSocialLinks, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  if (key === 'instagram') return `https://instagram.com/${value.replace(/^@/, '')}`;
  return `https://${value}`;
}

export function SocialLinksRow({ socialLinks }: Props) {
  const active = BADGES.filter((b) => !!socialLinks?.[b.key]);
  if (active.length === 0) return null;

  return (
    <View style={s.row}>
      {active.map((b) => {
        const value = socialLinks![b.key]!;
        return (
          <Pressable
            key={b.key}
            onPress={() => Linking.openURL(normalizeSocialUrl(b.key, value))}
            style={[s.badge, { backgroundColor: `${b.color}29` }]}
            accessibilityRole="link"
            accessibilityLabel={b.key}
          >
            <Text style={[s.badgeText, { color: b.color }]}>{b.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap:            spacing.md,
  },
  badge: {
    // 48×48 — tamanho mínimo de toque (CLAUDE.md).
    width:            48,
    height:           48,
    borderRadius:     radius.md,
    alignItems:      'center',
    justifyContent:  'center',
  },
  badgeText: {
    ...typography.bodySm,
    fontFamily: 'SpaceGrotesk-Bold',
  },
});
