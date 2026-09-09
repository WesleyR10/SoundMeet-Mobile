import { useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Inbox } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { EmptyState } from '@/shared/components/EmptyState';
import { SkeletonList } from '@/shared/components/Skeleton';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useInquiries } from '../../application/useInquiries';
import { InquiryCard } from '../components/InquiryCard';
import { InquiryDecisionSheet } from '../components/InquiryDecisionSheet';
import type { Inquiry } from '../../domain/inquiry.types';
import type { RootScreenProps } from '@/navigation/types';

type Props = RootScreenProps<'InquiryList'>;

/**
 * Propostas recebidas pelo músico.
 *
 * Registrada no RootStack e não numa tab: o tab bar do músico está fixo em 5
 * rotas com ícones declarados à mão em `MusicianTabBar`, e o precedente da
 * casa (`ConversationList`, `Agenda`, `AvailabilityEditor`) é justamente este —
 * telas alcançáveis por tile da Home e por toque em push.
 *
 * Lista TODAS as propostas, não só as abertas: o histórico é o que responde
 * "o que eu respondi para essa casa?" e o status já é visível em cada linha.
 */
const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.lg,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  iconBtn: {
    width:          48,
    height:         48,
    alignItems:     'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
  },
  centerRoot: {
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
  retryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
  },
}));

export function InquiryListScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data, isPending, isError, isRefetching, refetch } = useInquiries(musicianId);
  const [selected, setSelected] = useState<Inquiry | null>(null);

  function renderBody() {
    if (isPending) {
      return (
        <View style={s.listContent}>
          <SkeletonList count={4} itemHeight={116} />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={s.centerRoot}>
          <ErrorBanner message="Não conseguimos carregar suas propostas." />
          <Pressable onPress={() => refetch()} style={s.retryBtn} accessibilityRole="button" accessibilityLabel="Tentar novamente">
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    const inquiries = data?.data ?? [];

    if (inquiries.length === 0) {
      return (
        <EmptyState
          icon={Inbox}
          title="Nenhuma proposta ainda"
          subtitle="Quando um estabelecimento te convidar para tocar, o convite aparece aqui — com a ficha técnica do palco antes de você decidir."
        />
      );
    }

    return (
      <FlatList<Inquiry>
        data={inquiries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl tintColor={colors.brand.primary} refreshing={isRefetching} onRefresh={() => refetch()} />
        }
        renderItem={({ item, index }) => (
          <InquiryCard
            inquiry={item}
            // O nome da casa exigiria uma busca por linha (o presenter só traz
            // o id). Resolvido no detalhe, onde a ficha também é carregada.
            establishmentName={null}
            riseDelay={index * 60}
            onPress={() => setSelected(item)}
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

      <View style={s.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={s.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={8}
        >
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={s.title}>Propostas</Text>
        <View style={s.iconBtn} />
      </View>

      {renderBody()}

      <InquiryDecisionSheet
        inquiry={selected}
        musicianId={musicianId}
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}
