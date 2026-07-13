import { View, Text, Image, StyleSheet } from 'react-native';
import { Star, BadgeCheck, Building2 } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { Establishment } from '../../domain/establishment.types';

type Props = {
  establishment: Establishment;
};

const TYPE_LABEL: Record<Establishment['establishment_type'], string> = {
  bar:        'Bar',
  restaurant: 'Restaurante',
  club:       'Casa noturna',
};

export function EstablishmentHero({ establishment }: Props) {
  return (
    <View style={s.root}>
      <View style={s.avatarBox}>
        {establishment.avatar ? (
          <Image source={{ uri: establishment.avatar }} style={s.avatarImg} />
        ) : (
          <Building2 size={32} color={colors.text.muted} />
        )}
      </View>

      <View style={s.nameRow}>
        <Text style={s.name}>{establishment.name}</Text>
        {establishment.is_verified && <BadgeCheck size={20} color={colors.brand.primary} />}
      </View>

      <View style={s.metaRow}>
        <View style={s.ratingRow}>
          <Star size={15} color={colors.accent.amber} fill={colors.accent.amber} />
          <Text style={s.ratingText}>
            {establishment.rating.toFixed(1)} · {establishment.total_ratings} avaliaç{establishment.total_ratings === 1 ? 'ão' : 'ões'}
          </Text>
        </View>
        <Text style={s.typeText}>{TYPE_LABEL[establishment.establishment_type]}</Text>
        {establishment.is_open_now && (
          <View style={s.openPill}>
            <Text style={s.openPillText}>Aberto agora</Text>
          </View>
        )}
      </View>

      {!!establishment.description && <Text style={s.description}>{establishment.description}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  root:  { alignItems: 'center', gap: spacing.sm },
  avatarBox: {
    width:            88,
    height:           88,
    borderRadius:     radius.xl,
    backgroundColor: colors.bg.surface,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:         'hidden',
    borderWidth:       1,
    borderColor:      colors.border.default,
  },
  avatarImg: { width: '100%', height: '100%' },
  nameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
    marginTop:      spacing.sm,
  },
  name: {
    ...typography.displayMd,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
    flexWrap:       'wrap',
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            4,
  },
  ratingText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  typeText: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
  openPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical:    2,
    borderRadius:       radius.sm,
    backgroundColor:   colors.brand.muted,
  },
  openPillText: {
    ...typography.caption,
    color:      colors.brand.primary,
    fontFamily: 'Inter-SemiBold',
  },
  description: {
    ...typography.body,
    color:      colors.text.secondary,
    textAlign:  'center',
    marginTop:   spacing.xs,
  },
});
