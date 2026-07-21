import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Phone, Mail, Crown, StickyNote } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { MusicianProfile } from '../../domain/musician.types';

type Props = {
  musician: MusicianProfile;
};

const PLAN_LABEL: Record<string, string> = {
  free:      'Free',
  essential: 'Essencial',
  pro:       'Pro',
};

function InfoRow({ icon: Icon, label, value, accentColor = colors.brand.primary }: {
  icon:         LucideIcon;
  label:        string;
  value:        string;
  accentColor?: string;
}) {
  return (
    <View style={s.row}>
      <View style={[s.iconBox, { backgroundColor: `${accentColor}14` }]}>
        <Icon size={16} color={accentColor} />
      </View>
      <View style={s.rowText}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

// Seção "Informações" da ViewProfile (item 8 do feedback jul/2026): o perfil
// deve mostrar TUDO que o músico preencheu — antes localização, telefone,
// e-mail e plano só apareciam dentro do EditProfile.
export function ProfileInfoSection({ musician }: Props) {
  const location = musician.profile?.location ?? null;
  const cityLabel = location?.city
    ? location.state ? `${location.city} – ${location.state}` : location.city
    : null;
  // Com endereço completo (CEP), mostra rua/número acima da cidade.
  const streetLabel = location?.street
    ? `${location.street}${location.number ? `, ${location.number}` : ''}${location.neighborhood ? ` – ${location.neighborhood}` : ''}`
    : null;
  const locationLabel = streetLabel && cityLabel
    ? `${streetLabel}\n${cityLabel}`
    : streetLabel ?? cityLabel;

  const planLabel = PLAN_LABEL[musician.plan_tier ?? ''] ?? null;

  const priceNotes = (musician.profile?.price_ranges ?? [])
    .filter((range) => !!range.notes)
    .map((range) => ({
      model: range.model === 'per_hour' ? 'por hora' : 'por evento',
      notes: range.notes as string,
    }));

  const hasAnything = locationLabel || musician.phone || musician.email || planLabel || priceNotes.length > 0;
  if (!hasAnything) return null;

  return (
    <View style={s.root}>
      <Text style={s.title}>Informações</Text>

      <View style={s.card}>
        {locationLabel && (
          <InfoRow icon={MapPin} label="Localização" value={locationLabel} accentColor={colors.accent.coral} />
        )}
        {!!musician.phone && (
          <InfoRow icon={Phone} label="Telefone" value={musician.phone} />
        )}
        {!!musician.email && (
          <InfoRow icon={Mail} label="E-mail" value={musician.email} />
        )}
        {planLabel && (
          <InfoRow icon={Crown} label="Plano" value={planLabel} accentColor={colors.accent.violet} />
        )}
        {priceNotes.map((entry) => (
          <InfoRow
            key={entry.model}
            icon={StickyNote}
            label={`Notas de preço (${entry.model})`}
            value={entry.notes}
            accentColor={colors.accent.amber}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  title: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.8,
    textTransform: 'uppercase',
    color:          colors.text.secondary,
  },
  card: {
    gap:                spacing.lg,
    padding:            spacing.lg,
    borderRadius:       radius.lg,
    borderWidth:         1,
    borderColor:        colors.border.default,
    backgroundColor:    'rgba(255,255,255,0.03)',
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
  },
  iconBox: {
    width:           32,
    height:          32,
    borderRadius:    radius.sm,
    alignItems:     'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  rowValue: {
    ...typography.body,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
  },
});
