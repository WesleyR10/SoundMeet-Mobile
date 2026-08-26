import { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useContract, useSendContractDocument } from '../../application/useContracts';
import { useContractPayout } from '../../application/useContractPayout';
import {
  canSign,
  describeContractDelivery,
  pendingActorLabel,
  resolveMySide,
} from '../../domain/contract.rules';
import { ContractDocument } from '../components/ContractDocument';
import { ContractReviewAction } from '../components/ContractReviewAction';
import { ContractScreenHeader } from '../components/ContractScreenHeader';
import { ContractSignSheet } from '../components/ContractSignSheet';
import type { RootScreenProps } from '@/navigation/types';

type Props = RootScreenProps<'ContractDetail'>;

/** Margem de tolerância do "rolou até o fim" — o último pixel não é alcançável. */
const SCROLL_END_SLOP = 48;

/**
 * O contrato como documento — e, no app do músico, como **a tela do show**.
 *
 * Renderiza o snapshot nativamente em vez de embutir o PDF: o snapshot é a
 * fonte (o PDF é derivado dele), e texto nativo respeita fonte do sistema,
 * leitor de tela e tema.
 *
 * ⚠️ **A rolagem até o fim é pré-requisito da assinatura.** Aceite explícito
 * sustenta a validade (MP 2.200-2, art. 10, §2º), e oferecer o botão antes de
 * a pessoa ter tido a chance de ler enfraquece exatamente o que o documento
 * existe para provar.
 */
export function ContractDetailScreen({ route, navigation }: Props) {
  const { contractId } = route.params;
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);

  const { data: contract, isPending, isError, refetch } = useContract(contractId);
  const sendDocument = useSendContractDocument(contractId);
  const { data: payout } = useContractPayout(musicianId, contract?.booking_id ?? null);

  const [hasReadToEnd, setHasReadToEnd] = useState(false);
  const [signing, setSigning] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState<string | null>(null);
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (hasReadToEnd) return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const reachedEnd =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - SCROLL_END_SLOP;
    if (reachedEnd) setHasReadToEnd(true);
  }

  /*
   * 🔴 Conteúdo que CABE na tela nunca dispara `onScroll` — e, sem isto, um
   * contrato curto tornaria a assinatura impossível de liberar: o botão ficaria
   * eternamente travado esperando uma rolagem que não existe. O caso não é
   * teórico — contrato sem Anexo I e com poucas cláusulas cabe num tablet.
   *
   * As duas medidas chegam por callbacks DIFERENTES e **sem ordem garantida**,
   * então guardar as duas e reavaliar em ambas é o que evita o outro extremo:
   * medir só numa delas deixaria o caso em que ela chega primeiro sem nunca ser
   * reconferido.
   */
  function evaluateFits() {
    if (hasReadToEnd) return;
    if (viewportHeight.current === 0 || contentHeight.current === 0) return;
    if (contentHeight.current <= viewportHeight.current + SCROLL_END_SLOP) {
      setHasReadToEnd(true);
    }
  }

  async function emailDocument() {
    setDeliveryNote(null);
    try {
      setDeliveryNote(describeContractDelivery(await sendDocument.mutateAsync()));
    } catch {
      setDeliveryNote(describeContractDelivery(null));
    }
  }

  if (isPending) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.center}><ActivityIndicator color={colors.brand.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (isError || !contract) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.center}>
          <ErrorBanner message="Não conseguimos carregar este contrato." />
          <Pressable onPress={() => refetch()} style={s.retryBtn} accessibilityRole="button">
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const mySide = resolveMySide(contract, musicianId);
  const signable = canSign(contract, mySide);
  const pending = pendingActorLabel(contract, mySide);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <ContractScreenHeader title="Contrato" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={s.content}
        onScroll={handleScroll}
        onContentSizeChange={(_width, height) => {
          contentHeight.current = height;
          evaluateFits();
        }}
        onLayout={(event) => {
          viewportHeight.current = event.nativeEvent.layout.height;
          evaluateFits();
        }}
        scrollEventThrottle={64}
      >
        <ContractDocument
          contract={contract}
          pendingLabel={pending}
          onEmailDocument={emailDocument}
          isEmailing={sendDocument.isPending}
          deliveryNote={deliveryNote}
          payout={payout ?? null}
        />
      </ScrollView>

      {/*
        Assinar tem precedência sobre avaliar: enquanto houver assinatura
        pendente, ela é a ação do documento. A avaliação só faz sentido depois
        do show, quando assinar já não está em jogo — na prática os dois quase
        nunca coexistem, e um rodapé com dois CTAs competindo diluiria ambos.
      */}
      {signable ? (
        <View style={s.footer}>
          <PrimaryButton label="Assinar contrato" onPress={() => setSigning(true)} />
        </View>
      ) : (
        // Renderiza o próprio rodapé (ou nada) — um `<View style={s.footer}>`
        // aqui deixaria uma barra vazia com borda nos contratos sem ação.
        <ContractReviewAction contract={contract} footerStyle={s.footer} />
      )}

      <ContractSignSheet
        contract={contract}
        musicianId={musicianId}
        hasReadToEnd={hasReadToEnd}
        payout={payout ?? null}
        visible={signing}
        onClose={() => setSigning(false)}
        onSigned={() => setSigning(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg.primary },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  content:     { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical:   spacing.md,
    backgroundColor:   colors.bg.primary,
    borderTopWidth:    1,
    borderTopColor:    colors.bg.elevated,
  },
  retryBtn: {
    backgroundColor:   colors.brand.primary,
    borderRadius:      radius.xl,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  retryText:   { ...typography.body, fontFamily: 'Inter-SemiBold', color: colors.text.inverse },
});
