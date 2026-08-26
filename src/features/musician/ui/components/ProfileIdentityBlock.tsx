import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { Star, Clock, Wallet } from 'lucide-react-native';
import { colors, spacing } from '@/shared/design-system/tokens';
import { formatPriceRange } from '../../domain/musician.constants';
import type { MusicianProfile } from '../../domain/musician.types';
import { ProfileHeader } from './ProfileHeader';
import { ProfileStatCard } from './ProfileStatCard';
import { ProfileTagPills } from './ProfileTagPills';

type Props = {
  musician: MusicianProfile;
};

// Stagger inspirado no reveal em cascata do mockup de referência (Home do
// Músico.dc.html) — mesmo mecanismo manual de useSharedValue usado no resto
// do app (sem a API declarativa `entering`, para consistência).
function useReveal(delay: number) {
  const opacity = useSharedValue(0);
  const y       = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
    y.value       = withDelay(delay, withTiming(0, { duration: 420 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: y.value }],
  }));
}

// Cabeçalho de identidade da ViewProfileScreen — extraído (limite de ~200
// linhas/screen) porque o redesign do hub (Bloco Perfil, jul/2026)
// adicionou ProfileMenuGroups à tela; header/stats/tags não mudaram de
// comportamento, só de arquivo.
export function ProfileIdentityBlock({ musician }: Props) {
  const headerStyle = useReveal(60);
  const statsStyle  = useReveal(140);
  const tagsStyle   = useReveal(220);

  const priceLabel = formatPriceRange(musician.profile?.price_ranges);

  return (
    <View style={s.root}>
      <Animated.View style={headerStyle}>
        <ProfileHeader musician={musician} />
      </Animated.View>

      <Animated.View style={[s.statsRow, statsStyle]}>
        <ProfileStatCard icon={Clock} value={String(musician.profile?.experience ?? musician.experience_years)} label="anos de palco" />
        <ProfileStatCard icon={Star} value={musician.rating.toFixed(1)} label="nota média" accentColor={colors.accent.amber} />
        <ProfileStatCard icon={Wallet} value={priceLabel ?? '—'} label="faixa de preço" accentColor={colors.accent.violet} />
      </Animated.View>

      {/* Lado a lado (antes empilhados): encurta o topo do perfil e aproxima
          as duas listas que o músico lê junto. Cada coluna quebra as pílulas
          internamente (flexWrap do ProfileTagPills), e se uma das listas estiver
          vazia o componente devolve null — a outra ocupa a linha inteira. */}
      <Animated.View style={[s.tagsGroup, tagsStyle]}>
        <ProfileTagPills title="Instrumentos" items={musician.instruments} color={colors.brand.primary} style={s.tagColumn} />
        <ProfileTagPills title="Gêneros musicais" items={musician.genres} color={colors.accent.coral} style={s.tagColumn} />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap:            spacing.md,
  },
  tagsGroup: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:             spacing.lg,
  },
  tagColumn: {
    flex:      1,
    // Sem isso uma pílula larga (ex.: "Música Popular Brasileira") força a
    // coluna a crescer e desequilibra a linha.
    flexBasis:  0,
    minWidth:   0,
  },
});
