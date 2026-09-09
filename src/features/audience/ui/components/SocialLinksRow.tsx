import { View, Text, Pressable, StyleSheet } from 'react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { useTheme } from '@/shared/hooks/useTheme';
import type { ThemeColors } from '@/shared/services/ThemeContext';
import { openExternalUrl } from '@/shared/services/external-link/openExternalUrl';
import { buildSocialUrl, type SocialPlatform } from '@/shared/utils/external-url';
import type { MusicianPublicSocialLinks } from '../../domain/musician-public.types';

type Props = {
  socialLinks: MusicianPublicSocialLinks | null;
};

// Mesmo padrão de badge-de-letra de ProfileSocialLinks (musician feature) —
// lucide-react-native não tem ícones de marca (Instagram/YouTube), cópia
// intencional, não import (FSD: nunca cruzar features).
//
// SM-025 — a allowlist, essa sim, mora em `shared/utils/external-url.ts` e é a
// MESMA nos dois. Duplicar regra de segurança em duas features é como as duas
// cópias do `normalizeSocialUrl` divergem em silêncio; duplicar estilo, não.
// Esta tela é a mais exposta das duas: o perfil aqui é de OUTRA pessoa.
/*
 * Função do tema, não constante de módulo: avaliada no carregamento, ela
 * congelaria a paleta escura.
 */
const badges = (colors: ThemeColors): { key: SocialPlatform; label: string; color: string }[] => [
  { key: 'instagram', label: 'IG', color: colors.accent.coral },
  { key: 'youtube',   label: 'YT', color: colors.accent.violetLight },
  { key: 'spotify',   label: 'SP', color: colors.brand.primary },
];

export function SocialLinksRow({ socialLinks }: Props) {
  const { colors } = useTheme();
  const active = badges(colors).filter((b) => !!socialLinks?.[b.key]);
  if (active.length === 0) return null;

  return (
    <View style={s.row}>
      {active.map((b) => {
        const value = socialLinks![b.key]!;
        return (
          <Pressable
            key={b.key}
            onPress={() => void openExternalUrl(buildSocialUrl(b.key, value))}
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
