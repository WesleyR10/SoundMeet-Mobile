import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { PrimaryButton } from '@/shared/components/PrimaryButton';

type Props = {
  /** Dia selecionado no formato curto DD/MM. */
  dayLabel:      string;
  /** true após "Selecionar até…" — aguardando o toque no dia final. */
  awaitingEnd:   boolean;
  onBlockSingle: () => void;
  onSelectUntil: () => void;
};

// Barra contextual da seleção de dia na agenda: bloquear 1 dia com um toque
// (caso mais comum — compromisso pontual) ou estender pra período. Torna a
// ação explícita em vez de escondê-la atrás de gesto; o long-press do grid
// existe só como atalho.
export function BlockSelectionBar({ dayLabel, awaitingEnd, onBlockSingle, onSelectUntil }: Props) {
  if (awaitingEnd) {
    return (
      <View style={s.root}>
        <Text style={s.hint}>
          Toque no dia final no calendário — ou no dia inicial pra cancelar.
        </Text>
      </View>
    );
  }

  return (
    <View style={[s.root, s.row]}>
      <PrimaryButton
        label={`Bloquear ${dayLabel}`}
        onPress={onBlockSingle}
        variant="coral"
        style={s.blockBtn}
      />
      <Pressable
        onPress={onSelectUntil}
        style={({ pressed }) => [s.untilBtn, pressed && s.untilPressed]}
        accessibilityRole="button"
        accessibilityLabel="Selecionar período até outro dia"
      >
        <Text style={s.untilText}>Selecionar até…</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    padding:          spacing.md,
    borderRadius:     radius.lg,
    borderWidth:       1,
    borderColor:      colors.border.strong,
    backgroundColor:  colors.bg.elevated,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
  },
  blockBtn: {
    flex:   1,
    height: 48,
  },
  untilBtn: {
    minHeight:         48,
    paddingHorizontal:  spacing.md,
    alignItems:        'center',
    justifyContent:    'center',
    borderRadius:       radius.lg,
    borderWidth:         1,
    borderColor:        colors.border.strong,
  },
  untilPressed: {
    backgroundColor: colors.brand.muted,
  },
  untilText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
  hint: {
    ...typography.bodySm,
    color: colors.brand.primary,
  },
});
