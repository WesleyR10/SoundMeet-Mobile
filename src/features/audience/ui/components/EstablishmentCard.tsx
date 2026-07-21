import { View, Text, Image, StyleSheet } from 'react-native';
import { Star, MapPin, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import { formatDistanceKm } from '@/shared/utils/geo';
import type { Establishment } from '../../domain/establishment.types';

type Props = {
  establishment: Establishment;
  onPress:       () => void;
  /** Distância até o usuário (km) — presente quando o filtro de raio está ativo. */
  distanceKm?:   number | null;
};

const TYPE_LABEL: Record<Establishment['establishment_type'], string> = {
  bar:        'Bar',
  restaurant: 'Restaurante',
  club:       'Casa noturna',
};

// Card de descoberta (Home/Explorar do fã, Bloco 11.3/11.4) — usa
// Pressable3DCard pro toque com profundidade; distância aparece quando o
// filtro de raio (7.13, jul/2026) está ativo.
export function EstablishmentCard({ establishment, onPress, distanceKm }: Props) {
  const city = (establishment.profile?.location as { city?: string } | undefined)?.city ?? null;
  const genres = establishment.profile?.preferred_genres ?? [];

  return (
    <Pressable3DCard onPress={onPress} style={s.card} accessibilityLabel={establishment.name}>
      <View style={s.row}>
        <View style={s.avatarBox}>
          {establishment.avatar ? (
            <Image source={{ uri: establishment.avatar }} style={s.avatarImg} />
          ) : (
            <Text style={s.avatarFallback}>{establishment.name.charAt(0).toUpperCase()}</Text>
          )}
        </View>

        <View style={s.info}>
          <View style={s.nameRow}>
            <Text style={s.name} numberOfLines={1}>{establishment.name}</Text>
            {establishment.is_open_now && (
              <View style={s.openPill}>
                <Text style={s.openPillText}>Aberto agora</Text>
              </View>
            )}
          </View>

          <Text style={s.meta} numberOfLines={1}>
            {TYPE_LABEL[establishment.establishment_type]}
            {city ? ` · ${city}` : ''}
            {distanceKm !== null && distanceKm !== undefined ? ` · ${formatDistanceKm(distanceKm)}` : ''}
          </Text>

          <View style={s.bottomRow}>
            <View style={s.ratingRow}>
              <Star size={13} color={colors.accent.amber} fill={colors.accent.amber} />
              <Text style={s.ratingText}>{establishment.rating.toFixed(1)}</Text>
            </View>
            {genres.slice(0, 2).map((genre) => (
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
  avatarBox: {
    width:            52,
    height:           52,
    borderRadius:     radius.md,
    backgroundColor: colors.bg.elevated,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:         'hidden',
  },
  avatarImg: {
    width:  '100%',
    height: '100%',
  },
  avatarFallback: {
    ...typography.title,
    color: colors.brand.primary,
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
  openPill: {
    paddingHorizontal: spacing.xs,
    paddingVertical:    2,
    borderRadius:       radius.sm,
    backgroundColor:   colors.brand.muted,
  },
  openPillText: {
    ...typography.caption,
    color:      colors.brand.primary,
    fontFamily: 'Inter-SemiBold',
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
