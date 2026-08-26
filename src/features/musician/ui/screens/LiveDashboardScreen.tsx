import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { Radio } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { MusicianTabScreenProps, RootStackParamList } from '@/navigation/types';
import { useRequests, useAcceptRequest, useRejectRequest } from '../../application/useRequests';
import { LiveSetControl } from '../components/LiveSetControl';
import { RequestCard } from '../components/RequestCard';
import type { MusicRequest } from '../../domain/request.types';

// Tela ao vivo (Bloco 4) — sempre dark, mesmo padrão de QRCodeScreen/
// ViewProfileScreen (nenhuma tela do músico consome ThemeContext hoje).
// expo-keep-awake ativo enquanto montada: musico não pode deixar a tela
// apagar durante o show.
type Props = MusicianTabScreenProps<'LiveDashboard'>;

export function LiveDashboardScreen({ navigation }: Props) {
  useKeepAwake();

  // PerformanceReport vive no Root, não numa tab irmã — mesmo salto tab→root
  // de HomeScreen (`getParent()` sobe pro native-stack do RootNavigator).
  const rootNavigation =
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data, isPending, isError, refetch, isRefetching } = useRequests(musicianId, 'pending');
  const acceptMutation = useAcceptRequest(musicianId);
  const rejectMutation = useRejectRequest(musicianId);

  const isMutating = acceptMutation.isPending || rejectMutation.isPending;

  // Sem isso, uma falha de accept/reject (rede, ou 422 porque o pedido já
  // foi respondido em outro lugar) ficava silenciosa: o card já tinha
  // animado pra fora otimisticamente e o pedido continuava pendente de
  // verdade, sem o músico saber. `variables` guarda o id do último
  // mutate() — junto com isError, identifica qual card precisa voltar.
  const failedRequestId =
    (acceptMutation.isError ? acceptMutation.variables : null) ??
    (rejectMutation.isError ? rejectMutation.variables : null) ??
    null;
  const mutationErrorMessage =
    acceptMutation.isError || rejectMutation.isError
      ? 'Não foi possível atualizar o pedido. Tente novamente.'
      : null;

  function renderItem({ item }: { item: MusicRequest }) {
    return (
      <RequestCard
        request={item}
        disabled={isMutating}
        failed={item.id === failedRequestId}
        onAccept={() => acceptMutation.mutate(item.id)}
        onReject={() => rejectMutation.mutate(item.id)}
      />
    );
  }

  function renderBody() {
    if (isPending) {
      return (
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={s.centerRoot}>
          <ErrorBanner message="Não conseguimos carregar os pedidos." />
          <Pressable onPress={() => refetch()} style={s.retryBtn} accessibilityRole="button" accessibilityLabel="Tentar novamente">
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    if (!data || data.requests.length === 0) {
      return (
        <View style={s.centerRoot}>
          <Radio size={56} color={colors.text.muted} />
          <Text style={s.emptyTitle}>Nenhum pedido pendente</Text>
          <Text style={s.emptySubtitle}>Assim que alguém pedir uma música, ela aparece aqui na hora.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={data.requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />

      <View style={s.header}>
        <Text style={s.title}>Ao Vivo</Text>
        {!!data && data.pending_count > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countText}>{data.pending_count}</Text>
          </View>
        )}
      </View>

      {/*
        O interruptor do show fica ANTES da fila de pedidos: sem set aberto o
        Play Mode continua privado e nada do que o músico toca chega ao público,
        então esta é a primeira decisão da tela — não um detalhe no rodapé.
      */}
      <LiveSetControl
        onEnded={(performanceId) =>
          rootNavigation?.navigate('PerformanceReport', { performanceId })
        }
        onPressSuggestions={(establishmentId) =>
          rootNavigation?.navigate('SetlistSuggestions', { establishmentId })
        }
      />

      {!!mutationErrorMessage && <ErrorBanner message={mutationErrorMessage} style={s.mutationError} />}

      {renderBody()}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.lg,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  mutationError: {
    marginHorizontal: spacing.xl,
    marginBottom:     spacing.md,
  },
  countBadge: {
    minWidth:          28,
    height:            28,
    borderRadius:      radius.full,
    paddingHorizontal: spacing.sm,
    alignItems:        'center',
    justifyContent:    'center',
    backgroundColor:  colors.accent.coral,
  },
  countText: {
    ...typography.bodySm,
    fontFamily: 'Inter-Bold',
    color:      colors.text.inverse,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
  },
  centerRoot: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    gap:                spacing.md,
    padding:            spacing.xl,
  },
  retryBtn: {
    backgroundColor:   colors.brand.primary,
    borderRadius:      radius.xl,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  retryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
  },
  emptyTitle: {
    ...typography.title,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.liveBody,
    color:     colors.text.secondary,
    textAlign: 'center',
    maxWidth:  280,
  },
});
