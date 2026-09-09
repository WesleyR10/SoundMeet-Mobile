import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FileSignature } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { EmptyState } from '@/shared/components/EmptyState';
import { SkeletonList } from '@/shared/components/Skeleton';
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
const useStyles = makeStyles((colors) => ({
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
  retryBtn: {
    backgroundColor:   colors.brand.primary,
    borderRadius:      radius.xl,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  retryText: { ...typography.body, fontFamily: 'Inter-SemiBold', color: colors.text.inverse },
}));

export function ContractListScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
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
        <View style={s.listContent}>
          {/* 112: altura do ContractCard (local + badge, data, cachê). */}
          <SkeletonList count={4} itemHeight={112} />
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
        <EmptyState
          icon={FileSignature}
          title={onlyPending ? 'Nada esperando você' : 'Nenhum contrato ainda'}
          subtitle={
            onlyPending
              ? 'Todos os seus contratos já foram assinados do seu lado.'
              : 'Quando um show for confirmado, o contrato aparece aqui — com data, local, cachê e a ficha técnica do palco.'
          }
        />
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
