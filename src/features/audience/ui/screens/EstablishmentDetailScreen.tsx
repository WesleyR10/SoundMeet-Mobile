import { ScrollView, View, Text, Pressable, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FileText, CalendarX } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { FanStackScreenProps } from '@/navigation/types';
import { useEstablishment, useEstablishmentEvents } from '../../application/useEstablishment';
import { formatEstablishmentPriceRange } from '../../domain/establishment.constants';
import { EstablishmentHero } from '../components/EstablishmentHero';
import { TagChipRow } from '../components/TagChipRow';
import { EventListItem } from '../components/EventListItem';
import { EmptyState } from '../components/EmptyState';

type Props = FanStackScreenProps<'EstablishmentDetail'>;

export function EstablishmentDetailScreen({ route, navigation }: Props) {
  const { establishmentId } = route.params;

  const { data: establishment, isPending } = useEstablishment(establishmentId);
  const { data: eventsData, isPending: eventsPending } = useEstablishmentEvents(establishmentId);

  if (isPending || !establishment) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const profile = establishment.profile;
  const priceLabel = formatEstablishmentPriceRange(profile?.price_range ?? null);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <EstablishmentHero establishment={establishment} />

        {!!priceLabel && (
          <View style={s.priceCard}>
            <Text style={s.priceLabel}>Faixa de preço</Text>
            <Text style={s.priceValue}>{priceLabel}</Text>
          </View>
        )}

        <TagChipRow label="Gêneros" tags={profile?.preferred_genres ?? []} accentColor={colors.accent.violet} />
        <TagChipRow label="Comodidades" tags={profile?.amenities ?? []} accentColor={colors.brand.primary} />

        {!!profile?.menu_pdfs.length && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Cardápio</Text>
            {profile.menu_pdfs.map((pdf) => (
              <Pressable
                key={pdf.id}
                onPress={() => Linking.openURL(pdf.url)}
                style={s.menuRow}
                accessibilityRole="button"
                accessibilityLabel="Abrir cardápio em PDF"
              >
                <FileText size={18} color={colors.brand.primary} />
                <Text style={s.menuText}>Ver cardápio (PDF)</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={s.section}>
          <Text style={s.sectionTitle}>Próximos eventos</Text>
          {eventsPending ? (
            <ActivityIndicator color={colors.brand.primary} />
          ) : eventsData?.data.length ? (
            <View style={{ gap: spacing.md }}>
              {eventsData.data.map((event) => (
                <EventListItem
                  key={event.id}
                  event={event}
                  onPress={() => navigation.navigate('EventPerformers', { establishmentId, eventId: event.id })}
                />
              ))}
            </View>
          ) : (
            <EmptyState icon={CalendarX} title="Nenhum evento ativo" subtitle="Volte em breve pra ver a próxima agenda." />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.xl,
  },
  centerRoot: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  priceCard: {
    borderRadius:      radius.lg,
    borderWidth:        1,
    borderColor:       colors.border.default,
    backgroundColor:  'rgba(255,255,255,0.03)',
    padding:             spacing.md,
    gap:                 4,
  },
  priceLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  priceValue: {
    ...typography.title,
    color: colors.text.primary,
  },
  section: { gap: spacing.md },
  sectionTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
    borderRadius:   radius.md,
    borderWidth:     1,
    borderColor:    colors.border.default,
    padding:          spacing.md,
  },
  menuText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
});
