import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FileText, CalendarX } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { SkeletonList, SkeletonProfileHeader, SkeletonText } from '@/shared/components/Skeleton';
import { PRODUCTION_HOST_ALLOWLIST } from '@/shared/services/config/env';
import { openExternalHref } from '@/shared/services/external-link/openExternalUrl';
import type { FanStackScreenProps } from '@/navigation/types';
import { useEstablishment, useEstablishmentEvents } from '../../application/useEstablishment';
import { formatEstablishmentPriceRange } from '../../domain/establishment.constants';
import { EstablishmentHero } from '../components/EstablishmentHero';
import { TagChipRow } from '../components/TagChipRow';
import { EventListItem } from '../components/EventListItem';
import { StageTechSpecSection } from '@/shared/components/StageTechSpecSection';
import { EmptyState } from '@/shared/components/EmptyState';

type Props = FanStackScreenProps<'EstablishmentDetail'>;

const useStyles = makeStyles((colors) => ({
  // Mesmo respiro do conteúdo real — é o que evita o salto na troca.
  skeleton: { flex: 1, gap: spacing.xl, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
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
}));

export function EstablishmentDetailScreen({ route, navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { establishmentId } = route.params;

  const { data: establishment, isPending } = useEstablishment(establishmentId);
  const { data: eventsData, isPending: eventsPending } = useEstablishmentEvents(establishmentId);

  if (isPending || !establishment) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.skeleton}>
          <SkeletonProfileHeader avatarSize={72} centered={false} />
          <SkeletonText lines={2} />
          {/* Amenidades e gêneros são grades de chip; eventos vêm em cards. */}
          <SkeletonList count={2} itemHeight={80} />
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

        <StageTechSpecSection spec={profile?.stage_tech_spec ?? null} />

        {!!profile?.menu_pdfs.length && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Cardápio</Text>
            {profile.menu_pdfs.map((pdf) => (
              <Pressable
                key={pdf.id}
                /*
                 * SM-025 — a URL é do nosso storage, não digitada por alguém,
                 * mas `getPublicUrl()` devolve `null` quando não há CDN
                 * configurada e o use-case grava a **object key** crua no lugar
                 * (`?? objectKey`). `Linking.openURL` sobre isso falhava em
                 * silêncio; agora o fã lê por que o cardápio não abriu.
                 */
                onPress={() => void openExternalHref(pdf.url, PRODUCTION_HOST_ALLOWLIST)}
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
            <SkeletonList count={2} itemHeight={80} />
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
