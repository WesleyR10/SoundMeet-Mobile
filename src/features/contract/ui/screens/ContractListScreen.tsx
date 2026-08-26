import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FileSignature } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useContracts } from '../../application/useContracts';
import { awaitsMySignature } from '../../domain/contract.rules';
import { ContractCard } from '../components/ContractCard';
import { ContractScreenHeader } from '../components/ContractScreenHeader';
import type { Contract } from '../../domain/contract.types';
import type { RootScreenProps } from '@/navigation/types';

type Props = RootScreenProps<'ContractList'>;

/**
 * Contratos do músico — e, na prática, **a agenda de shows fechados**.
 *
 * Lista TODOS, não só os pendentes: o histórico é o que responde "quanto eu
 * fechei este mês?" e "o que eu combinei com aquela casa?", e o status já é
 * visível em cada linha.
 *
 * ⚠️ O escopo é do servidor. `GET /contracts` casa o JWT contra os três lados
 * (sub, `establishment_ids`, `band_ids`) e **só devolve contrato de quem é
 * parte** — a lista não filtra nada por conta própria, e não deve.
 */
export function ContractListScreen({ navigation }: Props) {
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data, isPending, isError, isRefetching, refetch } = useContracts(musicianId);
  const [onlyPending, setOnlyPending] = useState(false);

  const all = data?.data ?? [];
  const contracts = onlyPending
    ? all.filter((contract) => awaitsMySignature(contract, musicianId))
    : all;
  const pendingCount = all.filter((c) => awaitsMySignature(c, musicianId)).length;

  function renderBody() {
    if (isPending) {
      return (
        <View style={s.center}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={s.center}>
          <ErrorBanner message="Não conseguimos carregar seus contratos." />
          <Pressable onPress={() => refetch()} style={s.retryBtn} accessibilityRole="button">
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    if (contracts.length === 0) {
      return (
        <View style={s.center}>
          <FileSignature size={40} color={colors.text.muted} />
          <Text style={s.emptyTitle}>
            {onlyPending ? 'Nada esperando você' : 'Nenhum contrato ainda'}
          </Text>
          <Text style={s.emptySubtitle}>
            {onlyPending
              ? 'Todos os seus contratos já foram assinados do seu lado.'
              : 'Quando um show for confirmado, o contrato aparece aqui — com data, local, cachê e a ficha técnica do palco.'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList<Contract>
        data={contracts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl
            tintColor={colors.brand.primary}
            refreshing={isRefetching}
            onRefresh={() => refetch()}
          />
        }
        renderItem={({ item, index }) => (
          <ContractCard
            contract={item}
            musicianId={musicianId}
            riseDelay={index * 60}
            onPress={() => navigation.navigate('ContractDetail', { contractId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <ContractScreenHeader title="Contratos" onBack={() => navigation.goBack()} />

      {pendingCount > 0 && (
        <View style={s.filterRow}>
          <Pressable
            onPress={() => setOnlyPending((value) => !value)}
            style={[s.filterChip, onlyPending && s.filterChipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: onlyPending }}
            accessibilityLabel={`Mostrar somente os ${pendingCount} contratos aguardando sua assinatura`}
          >
            <Text style={[s.filterText, onlyPending && s.filterTextOn]}>
              Aguardando você ({pendingCount})
            </Text>
          </Pressable>
        </View>
      )}

      {renderBody()}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  filterRow: {
    flexDirection:     'row',
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.md,
  },
  filterChip: {
    minHeight:         48,
    justifyContent:    'center',
    paddingHorizontal: spacing.lg,
    borderRadius:      radius.full,
    borderWidth:       1,
    borderColor:       colors.accent.amber,
  },
  filterChipOn: { backgroundColor: colors.accent.amber },
  filterText:   { ...typography.bodySm, fontFamily: 'Inter-SemiBold', color: colors.accent.amber },
  filterTextOn: { color: colors.text.inverse },
  listContent:  { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.md,
    padding:         spacing.xl,
  },
  emptyTitle:    { ...typography.title, color: colors.text.primary, textAlign: 'center' },
  emptySubtitle: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
  retryBtn: {
    backgroundColor:   colors.brand.primary,
    borderRadius:      radius.xl,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  retryText: { ...typography.body, fontFamily: 'Inter-SemiBold', color: colors.text.inverse },
});
