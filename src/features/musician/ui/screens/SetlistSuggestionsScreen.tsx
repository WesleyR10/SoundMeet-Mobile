import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Lightbulb } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { SkeletonList } from '@/shared/components/Skeleton';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { RootScreenProps } from '@/navigation/types';
import { useSetlistSuggestions } from '../../application/usePerformance';
import { SetlistSuggestionRow } from '../components/SetlistSuggestionRow';

type Props = RootScreenProps<'SetlistSuggestions'>;

/**
 * Setlist inteligente por local (F5).
 *
 * Ranqueia por evidência DAQUELA casa, não por popularidade geral: o que enche
 * um bar de sertanejo esvazia um de jazz, e uma média nacional entregaria a
 * sugestão errada para os dois.
 *
 * 🔴 Quando `evidence_count` é zero, a tela **diz isso** em vez de fingir
 * insight. A lista vira "o que você tem no repertório", e o músico sabe que é
 * isso — apresentar um chute com cara de recomendação queima a confiança na
 * feature inteira no primeiro uso.
 */
const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  center: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: spacing.xl,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.xxxl,
    gap:               spacing.md,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    marginTop: -spacing.sm,
  },
  notice: {
    flexDirection: 'row',
    gap:            spacing.sm,
    padding:        spacing.md,
    borderRadius:   radius.lg,
    borderWidth:    1,
  },
  noticeInfo: {
    borderColor:     colors.border.brand,
    backgroundColor: colors.bg.elevated,
  },
  noticeWarn: {
    borderColor:     colors.accent.amber,
    backgroundColor: colors.bg.elevated,
  },
  noticeText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex:  1,
  },
  list: {
    padding:         spacing.lg,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.border.default,
    backgroundColor: colors.bg.elevated,
  },
  empty: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
}));

export function SetlistSuggestionsScreen({ route }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { establishmentId, establishmentName } = route.params;
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data, isPending, isError } = useSetlistSuggestions(
    musicianId,
    establishmentId,
  );

  if (isPending) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.list}><SkeletonList count={4} itemHeight={100} /></View>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.center}>
          <ErrorBanner message="Não conseguimos calcular as sugestões." />
        </View>
      </SafeAreaView>
    );
  }

  const hasEvidence = data.evidence_count > 0;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Setlist sugerido</Text>
        {!!establishmentName && (
          <Text style={s.subtitle}>para {establishmentName}</Text>
        )}

        <View style={[s.notice, hasEvidence ? s.noticeInfo : s.noticeWarn]}>
          <Lightbulb
            size={16}
            color={hasEvidence ? colors.brand.primary : colors.accent.amber}
          />
          <Text style={s.noticeText}>
            {hasEvidence
              ? 'Ordenado pelo que o público desta casa já pediu e pelo que já funcionou aqui.'
              : 'Ainda não temos histórico nesta casa. A lista abaixo é o seu repertório — as sugestões ficam reais depois do primeiro show registrado aqui.'}
          </Text>
        </View>

        {data.suggestions.length === 0 ? (
          <Text style={s.empty}>
            Nada a sugerir: seu repertório está vazio e não há pedidos
            registrados nesta casa.
          </Text>
        ) : (
          <View style={s.list}>
            {data.suggestions.map((suggestion, index) => (
              <SetlistSuggestionRow
                key={`${suggestion.title}-${suggestion.artist}`}
                suggestion={suggestion}
                position={index + 1}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
