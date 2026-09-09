import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, Pressable, TextInput } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { REJECTION_REASON_MAX_LENGTH } from '../../domain/request.types';

type Props = {
  /** Quantos pedidos serão recusados. `0` mantém o sheet fechado. */
  count:     number;
  visible:   boolean;
  loading?:  boolean;
  onConfirm: (reason: string) => void;
  onClose:   () => void;
};

/**
 * Motivo da recusa em lote.
 *
 * ⚠️ **O motivo é UM só para todo o lote** — é o que o contrato da rota
 * permite (`BatchRespondRequestsDto.rejection_reason`, campo único). O texto da
 * tela diz isso explicitamente: quem espera escrever um motivo por música
 * descobriria a limitação só depois, com os pedidos já recusados.
 *
 * O campo é opcional, espelhando `@IsOptional()` no DTO e a recusa individual
 * do app, que hoje nem pergunta.
 */
const useStyles = makeStyles((colors) => ({
  sheetBg: {
    backgroundColor: colors.bg.elevated,
    borderRadius:     radius.xl,
  },
  handle: {
    backgroundColor: colors.border.strong,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom:      spacing.xxxl,
    paddingTop:         spacing.sm,
    gap:                 spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  helper: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  input: {
    minHeight:         88,
    borderRadius:      radius.md,
    borderWidth:        1,
    borderColor:       colors.border.default,
    padding:            spacing.md,
    ...typography.body,
    color:             colors.text.primary,
    textAlignVertical: 'top',
  },
  counter: {
    ...typography.caption,
    color:     colors.text.muted,
    textAlign: 'right',
  },
  cancel: {
    ...typography.bodySm,
    color:              colors.text.muted,
    textDecorationLine: 'underline',
    textAlign:          'center',
  },
}));

export function BatchRejectSheet({ count, visible, loading, onConfirm, onClose }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  // Reabrir noutro lote não pode herdar o motivo digitado no anterior.
  // Ajuste durante o render (padrão "adjusting state when a prop changes" do
  // React), não useEffect: um efeito aqui renderizaria uma vez com o texto
  // velho antes de limpar, e a regra react-hooks/set-state-in-effect reprova.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setReason('');
  }

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      enableDynamicSizing
    >
      <BottomSheetView style={s.content}>
        <Text style={s.title}>
          {count === 1 ? 'Recusar 1 pedido' : `Recusar ${count} pedidos`}
        </Text>
        <Text style={s.helper}>
          O mesmo motivo vale para todos os pedidos deste lote. Pode deixar em branco.
        </Text>

        <TextInput
          value={reason}
          onChangeText={(v) => setReason(v.slice(0, REJECTION_REASON_MAX_LENGTH))}
          placeholder="Ex.: não está no repertório de hoje"
          placeholderTextColor={colors.text.muted}
          style={s.input}
          multiline
          maxLength={REJECTION_REASON_MAX_LENGTH}
          editable={!loading}
          accessibilityLabel="Motivo da recusa em lote"
        />
        <Text style={s.counter}>
          {reason.length}/{REJECTION_REASON_MAX_LENGTH}
        </Text>

        <PrimaryButton
          label="Confirmar recusa"
          onPress={() => onConfirm(reason.trim())}
          loading={loading}
        />
        <Pressable
          onPress={onClose}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Voltar sem recusar"
          hitSlop={8}
        >
          <Text style={s.cancel}>Voltar</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
