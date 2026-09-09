import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Check, Mail, ShieldCheck } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import {
  getSignContractErrorMessage,
  useRequestSignatureChallenge,
  useSignContract,
} from '../../application/useContracts';
import { challengeExpiryLabel } from '../../domain/contract.rules';
import { ContractPayoutBreakdown } from './ContractPayoutBreakdown';
import type { Contract, SignatureChallenge } from '../../domain/contract.types';
import type { ContractPayout } from '../../domain/payout.types';

type Props = {
  contract:      Contract | null;
  musicianId:    string | null;
  /** O documento foi rolado até o fim? Aceite exige leitura, não só um toque. */
  hasReadToEnd:  boolean;
  /** Decomposição do cachê — `null` quando o pagamento não passa pela plataforma. */
  payout:        ContractPayout | null;
  visible:       boolean;
  onClose:       () => void;
  onSigned:      () => void;
};

const CODE_LENGTH = 6;

/**
 * Assinatura em DOIS passos — e o briefing original dizia um.
 *
 * `challenge_code` é `@IsNotEmpty()` no `SignContractInput`: sem ele o backend
 * recusa. O fluxo é pedir o código (vai para o e-mail congelado da parte),
 * digitá-lo e assinar.
 *
 * ⚠️ **O botão NÃO trava em ter um desafio vivo nesta sessão.** O código vale
 * 10 minutos no servidor e sobrevive a um reload do app, enquanto pedir outro
 * invalida o que a pessoa acabou de receber. Travar aqui puniria exatamente
 * quem fechou o app para abrir o e-mail — que é o caminho normal.
 *
 * ⚠️ **O aceite é explícito e exige leitura.** Marcar a caixa E ter rolado o
 * documento até o fim: é o que sustenta o "admitido como válido pelas partes"
 * do art. 10, §2º da MP 2.200-2/2001 — consentimento inequívoco não se infere
 * de navegação.
 */
const useStyles = makeStyles((colors) => ({
  sheetBg: {
    backgroundColor: colors.bg.surface,
  },
  handle: {
    backgroundColor: colors.text.muted,
  },
  content: {
    padding:       spacing.xl,
    paddingBottom: spacing.xxxl,
    gap:           spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  acceptRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
    minHeight:     48,
  },
  checkbox: {
    width:          26,
    height:         26,
    borderRadius:   radius.sm,
    borderWidth:    2,
    borderColor:    colors.text.muted,
    alignItems:     'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.brand.primary,
    borderColor:     colors.brand.primary,
  },
  acceptText: {
    ...typography.bodySm,
    color: colors.text.primary,
    flex:  1,
  },
  readHint: {
    ...typography.caption,
    color: colors.accent.amber,
  },
  divider: {
    height:          1,
    backgroundColor: colors.bg.elevated,
    marginVertical:  spacing.xs,
  },
  codeHeaderRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  codeHeader: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  codeHelp: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  expiry: {
    ...typography.caption,
    color: colors.accent.amber,
  },
  linkBtn: {
    minHeight:      48,
    justifyContent: 'center',
  },
  linkText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
  codeInput: {
    ...typography.displayMd,
    color:           colors.text.primary,
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.lg,
    paddingVertical: spacing.md,
    textAlign:       'center',
    letterSpacing:   10,
  },
  legalNote: {
    ...typography.caption,
    color: colors.text.muted,
  },
}));

export function ContractSignSheet({
  contract,
  musicianId,
  hasReadToEnd,
  payout,
  visible,
  onClose,
  onSigned,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [accepted, setAccepted] = useState(false);
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<SignatureChallenge | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestChallenge = useRequestSignatureChallenge(contract?.id ?? null);
  const sign = useSignContract(musicianId, contract?.id ?? null);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  // Estado local é por contrato: reabrir noutro não pode herdar o aceite nem o
  // código digitado no anterior.
  useEffect(() => {
    setAccepted(false);
    setCode('');
    setChallenge(null);
    setError(null);
  }, [contract?.id]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  if (!contract) return null;

  const busy = requestChallenge.isPending || sign.isPending;
  const canSubmit = accepted && hasReadToEnd && code.trim().length === CODE_LENGTH && !busy;

  async function askForCode() {
    setError(null);
    try {
      setChallenge(await requestChallenge.mutateAsync());
      setCode('');
    } catch (err) {
      setError(getSignContractErrorMessage(err));
    }
  }

  async function submit() {
    setError(null);
    try {
      await sign.mutateAsync(code);
      onSigned();
    } catch (err) {
      setError(getSignContractErrorMessage(err));
    }
  }

  const expiry = challenge ? challengeExpiryLabel(challenge.expires_at) : null;

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      snapPoints={['78%']}
    >
      <BottomSheetScrollView contentContainerStyle={s.content}>
        <View style={s.titleRow}>
          <ShieldCheck size={20} color={colors.brand.primary} />
          <Text style={s.title}>Assinar contrato</Text>
        </View>

        <Text style={s.subtitle}>
          Show em {contract.variables.local_nome}, {contract.variables.data_show}, no valor de{' '}
          {contract.variables.cache_formatado}.
        </Text>

        {/*
          🔴 O número concreto, imediatamente ACIMA do aceite.
          A cláusula de pagamento remete à comissão "informada às partes e
          vigente na data de emissão" — o texto não traz o percentual de
          propósito, para que um reajuste não exija nova versão de template. Em
          troca, ele precisa aparecer aqui: é este momento, e não outro, que a
          cláusula chama de "informado às partes".
        */}
        <ContractPayoutBreakdown payout={payout} compact />

        {/* Aceite explícito, nunca inferido de navegação. */}
        <Pressable
          onPress={() => setAccepted((value) => !value)}
          style={s.acceptRow}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          accessibilityLabel="Declaro que li e concordo com os termos do contrato"
        >
          <View style={[s.checkbox, accepted && s.checkboxOn]}>
            {accepted && <Check size={16} color={colors.text.inverse} />}
          </View>
          <Text style={s.acceptText}>
            Li o contrato inteiro e concordo expressamente com os seus termos.
          </Text>
        </Pressable>

        {!hasReadToEnd && (
          <Text style={s.readHint}>
            Role o contrato até o fim para liberar a assinatura.
          </Text>
        )}

        <View style={s.divider} />

        <View style={s.codeHeaderRow}>
          <Mail size={16} color={colors.text.muted} />
          <Text style={s.codeHeader}>Código de confirmação</Text>
        </View>

        <Text style={s.codeHelp}>
          {challenge
            ? `Enviamos um código para ${challenge.destination_masked}.`
            : 'Enviamos um código de 6 dígitos para o e-mail cadastrado no contrato.'}
        </Text>
        {!!expiry && <Text style={s.expiry}>{expiry}</Text>}

        <Pressable
          onPress={askForCode}
          disabled={busy}
          style={s.linkBtn}
          accessibilityRole="button"
          accessibilityLabel={challenge ? 'Enviar outro código' : 'Enviar código'}
        >
          <Text style={s.linkText}>
            {requestChallenge.isPending
              ? 'Enviando…'
              : challenge
                ? 'Enviar outro código'
                : 'Enviar código'}
          </Text>
        </Pressable>

        <TextInput
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          placeholder="000000"
          placeholderTextColor={colors.text.muted}
          style={s.codeInput}
          accessibilityLabel="Código de confirmação"
        />

        {!!error && <ErrorBanner message={error} />}

        <PrimaryButton
          label="Assinar contrato"
          onPress={submit}
          loading={sign.isPending}
          disabled={!canSubmit}
        />

        {/* Registrado com o usuário na fatia B3: dizer o que a assinatura é, e
            o que ela não é, ao lado do aceite. */}
        <Text style={s.legalNote}>
          A assinatura eletrônica vale como prova escrita entre as partes
          (MP 2.200-2/2001, art. 10, §2º). Não é título executivo.
        </Text>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
