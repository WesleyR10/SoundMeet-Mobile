import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { User, Users, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import { useMusicianPublic } from '../../application/useMusicianPublic';
import type { EventPerformer } from '../../domain/event.types';

type Props = {
  performer: EventPerformer;
  onPress:   (musicianId: string) => void;
};

// Uma linha por performer escalado no evento (EventPerformersScreen). Bandas
// (band_id, sem musician_id) ainda não têm perfil público navegável no app —
// mostrada como informativa, sem CTA, até essa feature existir.
export function PerformerRow({ performer, onPress }: Props) {
  const { data: musician, isPending } = useMusicianPublic(performer.musician_id);

  if (!performer.musician_id) {
    return (
      <View style={[s.card, s.cardDisabled]}>
        <View style={s.iconBox}>
          <Users size={20} color={colors.text.muted} />
        </View>
        <Text style={s.name}>Banda escalada</Text>
      </View>
    );
  }

  if (isPending || !musician) {
    return (
      <View style={s.card}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }

  const name = musician.stage_name || musician.display_name || musician.name;

  return (
    <Pressable3DCard onPress={() => onPress(performer.musician_id!)} style={s.card} accessibilityLabel={name}>
      <View style={s.iconBox}>
        {musician.avatar ? (
          <Image source={{ uri: musician.avatar }} style={s.avatarImg} />
        ) : (
          <User size={20} color={colors.brand.primary} />
        )}
      </View>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{name}</Text>
        {musician.genres.length > 0 && (
          <Text style={s.genres} numberOfLines={1}>{musician.genres.slice(0, 2).join(' · ')}</Text>
        )}
      </View>
      <ChevronRight size={18} color={colors.text.muted} />
    </Pressable3DCard>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
    borderRadius:   radius.lg,
    borderWidth:     1,
    borderColor:    colors.border.default,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding:          spacing.md,
    minHeight:        60,
  },
  cardDisabled: { opacity: 0.6 },
  iconBox: {
    width:            40,
    height:           40,
    borderRadius:     radius.md,
    backgroundColor: colors.brand.muted,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:         'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  info:  { flex: 1, gap: 2 },
  name: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  genres: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
