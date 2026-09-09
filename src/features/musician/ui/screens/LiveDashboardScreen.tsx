import { useCallback, useMemo, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { Radio } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { Skeleton, SkeletonList } from '@/shared/components/Skeleton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { MusicianTabScreenProps, RootStackParamList } from '@/navigation/types';
import {
  useRequests,
  useAcceptRequest,
  useRejectRequest,
  useBatchRespondRequests,
} from '../../application/useRequests';
import { LiveSetControl } from '../components/LiveSetControl';
import { RequestCard } from '../components/RequestCard';
import { SelectionActionBar } from '../components/SelectionActionBar';
import { BatchRejectSheet } from '../components/BatchRejectSheet';
import { pruneSelection, summarizeBatchOutcome } from '../../domain/request-batch.rules';
import type { MusicRequest, RespondToRequestAction } from '../../domain/request.types';

// Tela ao vivo (Bloco 4) — sempre dark, mesmo padrão de QRCodeScreen/
// ViewProfileScreen (nenhuma tela do músico consome ThemeContext hoje).
// expo-keep-awake ativo enquanto montada: musico não pode deixar a tela
// apagar durante o show.
type Props = MusicianTabScreenProps<'LiveDashboard'>;

const useStyles = makeStyles((colors) => ({
  // Mesmo respiro do conteúdo real — é o que evita o salto na troca.
  skeleton: { flex: 1, gap: spacing.xl, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
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
  // A barra flutua sobre a lista; sem folga extra o último pedido fica
  // embaixo dela e o músico não consegue marcá-lo.
  listWithBar: {
    paddingBottom: 172,
  },
  selectionHint: {
    ...typography.bodySm,
    color:             colors.text.muted,
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.sm,
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
}));

export function LiveDashboardScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
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

  // --- Modo seleção (responder em lote) ---
  const batchMutation = useBatchRespondRequests(musicianId);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectSheetOpen, setRejectSheetOpen] = useState(false);
  // request_id -> motivo, do ÚLTIMO lote. É o relatório parcial: sobrevive à
  // invalidação da query justamente porque os que falharam continuam pendentes
  // e voltam na lista recarregada.
  const [failures, setFailures] = useState<Record<string, string>>({});

  const requests = useMemo(() => data?.requests ?? [], [data]);

  // Um pedido respondido em outro aparelho some da lista no refetch. A poda é
  // DERIVADA no render, não sincronizada por efeito: sincronizar exigiria
  // setState dentro de useEffect (cascata de renders, e a regra
  // react-hooks/set-state-in-effect reprova). `selectedIds` pode guardar um id
  // morto por um instante; `selection` é a única coisa que a tela consome, e
  // essa nunca contém um pedido fora da fila.
  const selection = useMemo(
    () => pruneSelection(selectedIds, requests.map((r) => r.id)),
    [selectedIds, requests],
  );

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setRejectSheetOpen(false);
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const startSelection = useCallback((id: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
    // O relatório do lote anterior deixa de valer no instante em que um novo
    // começa a ser montado — manter marcas velhas descreveria outra tentativa.
    setFailures({});
  }, []);

  async function runBatch(action: RespondToRequestAction, rejectionReason?: string) {
    const ids = [...selection];
    if (ids.length === 0) return;

    try {
      const result = await batchMutation.mutateAsync({ requestIds: ids, action, rejectionReason });
      setRejectSheetOpen(false);

      // 🔴 O ponto inteiro desta tela: o que falhou PERMANECE, marcado e com o
      // motivo. Sair do modo seleção aqui esconderia a diferença entre "30
      // respondidos" e "27 respondidos, 3 não" — que é justamente o que o
      // músico precisa saber para agir de novo, ainda no palco.
      const outcome = summarizeBatchOutcome(result);
      if (!outcome.allSucceeded) {
        setFailures(outcome.failures);
        setSelectedIds(new Set(outcome.retryIds));
        return;
      }

      setFailures({});
      exitSelection();
    } catch {
      // Falha da chamada inteira (rede, 422 de lote inválido, 429 do throttle
      // de 6/min): nada foi respondido, então a seleção fica intacta para o
      // músico tentar de novo. O ErrorBanner abaixo explica.
      setRejectSheetOpen(false);
    }
  }

  const batchErrorMessage = batchMutation.isError
    ? 'Não foi possível responder os pedidos selecionados. Tente novamente.'
    : null;

  const partialFailureCount = Object.keys(failures).length;

  function renderItem({ item }: { item: MusicRequest }) {
    return (
      <RequestCard
        request={item}
        disabled={isMutating || batchMutation.isPending}
        failed={item.id === failedRequestId}
        failureReason={failures[item.id] ?? null}
        selectable={selectionMode}
        selected={selection.has(item.id)}
        onToggleSelect={() => toggleSelected(item.id)}
        onLongPress={() => startSelection(item.id)}
        onAccept={() => acceptMutation.mutate(item.id)}
        onReject={() => rejectMutation.mutate(item.id)}
      />
    );
  }

  function renderBody() {
    if (isPending) {
      return (
        <View style={s.skeleton}>
          {/* Set ao vivo no topo, depois a fila de pedidos. */}
          <Skeleton height={120} borderRadius={radius.lg} />
          <SkeletonList count={3} itemHeight={132} />
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
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[s.list, selectionMode && s.listWithBar]}
        // Puxar-para-atualizar em modo seleção competiria com o toque de
        // marcar e traria uma lista nova por baixo da seleção em curso.
        onRefresh={selectionMode ? undefined : refetch}
        refreshing={isRefetching}
        showsVerticalScrollIndicator={false}
        extraData={selectionMode ? selection : failures}
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
      {!!batchErrorMessage && <ErrorBanner message={batchErrorMessage} style={s.mutationError} />}

      {/*
        Relatório parcial do último lote. O número aparece aqui e o motivo
        aparece em cada card — separados de propósito: um diz QUANTOS, o outro
        diz QUAIS e POR QUÊ, e nenhum dos dois some sozinho.
      */}
      {partialFailureCount > 0 && (
        <ErrorBanner
          message={
            partialFailureCount === 1
              ? '1 pedido não pôde ser respondido e continua na fila.'
              : `${partialFailureCount} pedidos não puderam ser respondidos e continuam na fila.`
          }
          style={s.mutationError}
        />
      )}

      {selectionMode && (
        <Text style={s.selectionHint}>Toque nos pedidos para marcar ou desmarcar.</Text>
      )}

      {renderBody()}

      {selectionMode && (
        <SelectionActionBar
          count={selection.size}
          loading={batchMutation.isPending}
          onAccept={() => runBatch('accept')}
          onReject={() => setRejectSheetOpen(true)}
          onCancel={exitSelection}
        />
      )}

      <BatchRejectSheet
        count={selection.size}
        visible={rejectSheetOpen}
        loading={batchMutation.isPending}
        onConfirm={(reason) => runBatch('reject', reason || undefined)}
        onClose={() => setRejectSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
