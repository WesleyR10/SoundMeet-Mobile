import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, User, ChevronRight, BadgeCheck } from 'lucide-react-native';
import { colors, spacing, radius, typography, gradients } from '@/shared/design-system/tokens';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import { formatDistanceKm } from '@/shared/utils/geo';
import type { MusicianPublic } from '../../domain/musician-public.types';

type Props = {
  musician: MusicianPublic;
  onPress:  () => void;
  /** Distância até o usuário (km) — presente quando o filtro de raio está ativo. */
  distanceKm?: number | null;
};

const AVATAR_SIZE = 52;

// Formato compacto de faixa de preço pro card ("R$ 120–250/h") — prioriza a
// faixa por hora; sem faixas, a linha some.
function priceHint(musician: MusicianPublic): string | null {
  const ranges = musician.profile?.price_ranges ?? [];
  const range = ranges.find((r) => r.model === 'per_hour') ?? ranges[0];
  if (!range) return null;
  const suffix = range.model === 'per_hour' ? '/h' : '/show';
  return `R$ ${Math.round(range.min)}–${Math.round(range.max)}${suffix}`;
}

// Resultado de músico na busca do fã (FanExplore aba "Músicos", 7.13c) —
// layout de lista irmão do EstablishmentCard, com o anel gradiente
// teal→violeta que identifica músicos no resto do app.
export function MusicianResultCard({ musician, onPress, distanceKm }: Props) {
  const name = musician.stage_name || musician.display_name || musician.name;
  const city = musician.profile?.location?.city ?? null;
  const price = priceHint(musician);

  return (
    <Pressable3DCard onPress={onPress} style={s.card} accessibilityLabel={name}>
      <View style={s.row}>
        <LinearGradient colors={gradients.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatarRing}>
          <View style={s.avatarInner}>
            {musician.avatar ? (
              <Image source={{ uri: musician.avatar }} style={s.avatarImg} />
            ) : (
              <User size={22} color={colors.text.muted} />
            )}
          </View>
        </LinearGradient>

        <View style={s.info}>
          <View style={s.nameRow}>
            <Text style={s.name} numberOfLines={1}>{name}</Text>
            {musician.is_verified && (
              <BadgeCheck size={14} color={colors.brand.primary} />
            )}
          </View>

          <Text style={s.meta} numberOfLines={1}>
            {city ?? 'Sem cidade'}
            {distanceKm !== null && distanceKm !== undefined ? ` · ${formatDistanceKm(distanceKm)}` : ''}
            {price ? ` · ${price}` : ''}
          </Text>

          <View style={s.bottomRow}>
            <View style={s.ratingRow}>
              <Star size={13} color={colors.accent.amber} fill={colors.accent.amber} />
              <Text style={s.ratingText}>{musician.rating.toFixed(1)}</Text>
            </View>
            {musician.genres.slice(0, 2).map((genre) => (
              <View key={genre} style={s.chip}>
                <Text style={s.chipText}>{genre}</Text>
              </View>
            ))}
          </View>
        </View>

        <ChevronRight size={18} color={colors.text.muted} />
      </View>
    </Pressable3DCard>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius:     radius.lg,
    borderWidth:       1,
    borderColor:      colors.border.default,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding:           spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
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
    backgroundColor: colors.bg.elevated,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:         'hidden',
  },
  avatarImg: {
    width:  '100%',
    height: '100%',
  },
  info:  { flex: 1, gap: 4 },
  nameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  name: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
    flexShrink: 1,
  },
  meta: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
    marginTop:      2,
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
  chip: {
    paddingHorizontal: spacing.xs,
    paddingVertical:    2,
    borderRadius:       radius.sm,
    backgroundColor:   'rgba(255,255,255,0.05)',
  },
  chipText: {
    ...typography.caption,
    color: colors.text.muted,
  },
});
