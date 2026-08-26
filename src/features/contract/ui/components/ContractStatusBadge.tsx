import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { statusLabel, statusTone, type StatusTone } from '../../domain/contract.rules';
import type { Contract } from '../../domain/contract.types';

type Props = {
  contract: Pick<Contract, 'status'>;
};

/** O domínio devolve tom semântico; a cor mora aqui, que é a camada de UI. */
const TONE_COLOR: Record<StatusTone, string> = {
  pending:  colors.accent.amber,
  positive: colors.status.success,
  negative: colors.status.error,
  neutral:  colors.text.muted,
};

export function ContractStatusBadge({ contract }: Props) {
  const color = TONE_COLOR[statusTone(contract)];

  return (
    <View style={[s.pill, { borderColor: color }]}>
      <Text style={[s.text, { color }]}>{statusLabel(contract)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    borderWidth:       1,
    borderRadius:      radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical:   2,
  },
  text: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
  },
});
