import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import { spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { canSubmitBatch } from '../../domain/request-batch.rules';
import { BATCH_RESPOND_MAX_ITEMS } from '../../domain/request.types';

type Props = {
  count:     number;
  onAccept:  () => void;
  onReject:  () => void;
  onCancel:  () => void;
  loading?:  boolean;
};

/**
 * Barra de ação do modo seleção da fila ao vivo.
 *
 * 🔴 **O teto de 50 é bloqueado AQUI, antes da chamada.** `BatchRespondRequestsDto`
 * tem `@ArrayMaxSize(BATCH_RESPOND_MAX_ITEMS)`, então um lote maior volta 422
 * inteiro — nenhum pedido respondido. E a rota tem throttle próprio de 6/min
 * (`@Throttle({ ttl: 60000, limit: 6 })`), bem mais apertado que o global: cada
 * 422 desperdiçado custa uma das seis tentativas que o músico tem no minuto,
 * no meio do show. Barrar na UI é mais barato que qualquer mensagem de erro.
 */
const useStyles = makeStyles((colors) => ({
  root: {
    position:          'absolute',
    left:               spacing.xl,
    right:              spacing.xl,
    borderRadius:       radius.xl,
    backgroundColor:   colors.bg.elevated,
    borderWidth:        1,
    borderColor:       colors.border.strong,
    padding:            spacing.md,
    gap:                spacing.sm,
    ...shadows.sm,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:             spacing.sm,
  },
  count: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
    flex:       1,
  },
  cancelLabel: {
    ...typography.bodySm,
    color:              colors.text.muted,
    textDecorationLine: 'underline',
  },
  overLimit: {
    ...typography.caption,
    color: colors.status.error,
  },
  actions: {
    flexDirection: 'row',
    gap:            spacing.md,
  },
  rejectBtn: {
    flex:            1,
    height:          48,
    borderRadius:    radius.md,
    borderWidth:     1.5,
    borderColor:     colors.accent.coral,
    flexDirection:  'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.xs,
  },
  rejectLabel: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.accent.coral,
  },
  acceptBtn: {
    flex:              1,
    height:            48,
    borderRadius:      radius.md,
    backgroundColor:  colors.brand.primary,
    flexDirection:    'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               spacing.xs,
    ...shadows.brand,
  },
  acceptLabel: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
  },
  disabled: {
    opacity: 0.5,
  },
}));

export function SelectionActionBar({ count, onAccept, onReject, onCancel, loading }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const overLimit = count > BATCH_RESPOND_MAX_ITEMS;
  // Zero selecionado não é erro, é só nada a fazer — a barra continua visível
  // (o músico está em modo seleção), mas as ações não convidam ao toque.
  const blocked = loading || !canSubmitBatch(count);

  return (
    <View style={[s.root, { bottom: insets.bottom + spacing.lg }]}>
      <View style={s.topRow}>
        <Text style={s.count}>
          {count === 1 ? '1 pedido selecionado' : `${count} pedidos selecionados`}
        </Text>
        <Pressable
          onPress={onCancel}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Cancelar seleção"
          hitSlop={8}
        >
          <Text style={s.cancelLabel}>Cancelar</Text>
        </Pressable>
      </View>

      {overLimit && (
        <Text style={s.overLimit}>
          Máximo de {BATCH_RESPOND_MAX_ITEMS} por vez — desmarque {count - BATCH_RESPOND_MAX_ITEMS} para continuar.
        </Text>
      )}

      <View style={s.actions}>
        <Pressable
          onPress={onReject}
          disabled={blocked}
          style={[s.rejectBtn, blocked && s.disabled]}
          accessibilityRole="button"
          accessibilityLabel={`Recusar ${count} pedidos`}
        >
          <X size={18} color={colors.accent.coral} />
          <Text style={s.rejectLabel}>Recusar</Text>
        </Pressable>

        <Pressable
          onPress={onAccept}
          disabled={blocked}
          style={[s.acceptBtn, blocked && s.disabled]}
          accessibilityRole="button"
          accessibilityLabel={`Aceitar ${count} pedidos`}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <>
              <Check size={18} color={colors.text.inverse} />
              <Text style={s.acceptLabel}>Aceitar</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
