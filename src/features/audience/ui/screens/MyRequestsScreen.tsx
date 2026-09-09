import { useState } from 'react';
import { FlatList, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ListMusic } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { FanStackScreenProps } from '@/navigation/types';
import { useAudienceRequests } from '../../application/useAudienceRequests';
import { EmptyState } from '@/shared/components/EmptyState';
import { SkeletonList } from '@/shared/components/Skeleton';
import { MyRequestCard } from '../components/MyRequestCard';
import { RequestBoostPaymentSheet } from '../components/RequestBoostPaymentSheet';

type Props = FanStackScreenProps<'MyRequests'>;

/**
 * Histórico de pedidos do fã.
 *
 * Existe desde `GET /requests/audiences/:audience_id` (backend 7.12) e ficou
 * **um ano** sem tela: a tile "Meus Pedidos" da Home estava desabilitada com um
 * comentário afirmando que o endpoint não existia — e o app já o consumia, no
 * cold start do destaque pago (`PendingBoostHost`).
 *
 * Reaproveita `RequestBoostPaymentSheet` em vez de duplicar o QR: a folha é a
 * mesma do banner flutuante, e a cobrança é a mesma cobrança. O que muda é o
 * caminho até ela — o banner é para quem está com o app aberto na hora do
 * aceite, esta lista é para quem voltou depois.
 */
const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  back: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  centerRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  retryBtn: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  retryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color: colors.brand.primary,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
}));

export function MyRequestsScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const audienceId = useAuthStore((s) => s.user?.audienceId ?? null);
  const { data, isPending, isError, isRefetching, refetch } = useAudienceRequests(audienceId);
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />

      <View style={s.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={s.back}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <ChevronLeft size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={s.title}>Meus pedidos</Text>
      </View>

      {isPending ? (
        <View style={s.list}>
          <SkeletonList count={4} itemHeight={104} />
        </View>
      ) : isError ? (
        <View style={s.centerRoot}>
          <ErrorBanner message="Não conseguimos carregar seus pedidos." />
          <Pressable
            onPress={() => refetch()}
            style={s.retryBtn}
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
          >
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="Você ainda não pediu nenhuma música"
          subtitle="Escaneie o QR do músico no palco ou escolha um show para fazer o primeiro pedido."
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item, index }) => (
            <MyRequestCard
              request={item}
              // Escalona só os primeiros: numa lista longa, delay crescente
              // deixaria o último card entrando segundos depois do scroll.
              riseDelay={Math.min(index, 6) * 60}
              onResumePayment={(request) => setOpenRequestId(request.id)}
            />
          )}
        />
      )}

      <RequestBoostPaymentSheet
        requestId={openRequestId}
        onClose={() => setOpenRequestId(null)}
      />
    </SafeAreaView>
  );
}
