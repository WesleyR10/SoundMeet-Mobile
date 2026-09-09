import { View, Text, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import type { PublicRepertoireItem } from '../../domain/repertoire.types';

type Props = {
  item:      PublicRepertoireItem;
  selected:  boolean;
  /** Primeira linha não desenha divisória — a borda do cartão já separa. */
  isFirst:   boolean;
  onPress:   (item: PublicRepertoireItem) => void;
};

function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 spacing.md,
    // 56 > o mínimo de 48px de alvo de toque, com folga para as duas linhas.
    minHeight:           56,
    paddingHorizontal:   spacing.md,
    paddingVertical:     spacing.sm,
    borderTopWidth:       1,
  },
  rowSelected: {
    backgroundColor: colors.brand.muted,
  },
  texts: {
    flex: 1,
    gap:  2,
  },
  // Título em mono: mesma decisão do `RepertoireList` do soundmeet-web, onde o
  // token `--text-chord` existe com o comentário "repertório público". Os dois
  // clientes falam a mesma língua tipográfica sobre o mesmo dado.
  title: {
    ...typography.mono,
    color: colors.text.primary,
  },
  meta: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
  duration: {
    ...typography.caption,
    color: colors.text.muted,
  },
}));

export function RepertoireRow({ item, selected, isFirst, onPress }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const duration = formatDuration(item.duration_seconds);

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={[
        s.row,
        { borderTopColor: isFirst ? 'transparent' : colors.border.default },
        selected && s.rowSelected,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${item.title}, de ${item.artist}${duration ? `, ${duration}` : ''}`}
      accessibilityHint="Usa esta música no pedido"
    >
      <View style={s.texts}>
        <Text style={s.title} numberOfLines={1}>{item.title}</Text>
        <Text style={s.meta} numberOfLines={1}>
          {item.artist}{item.genre ? ` · ${item.genre}` : ''}
        </Text>
      </View>

      {duration && <Text style={s.duration}>{duration}</Text>}
      {selected && <Check size={18} color={colors.brand.primary} />}
    </Pressable>
  );
}
