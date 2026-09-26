import { View, Text, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import type { SongCatalogItem } from '../../domain/repertoire.types';

type Props = {
  item:      SongCatalogItem;
  selected:  boolean;
  /** Primeira linha não desenha divisória — a borda do cartão já separa. */
  isFirst:   boolean;
  /**
   * Marca "no repertório". Só faz sentido na busca da plataforma: no modo
   * restrito TODA linha é do repertório, e o selo em todas não informa nada.
   */
  showsInRepertoire: boolean;
  onPress:   (item: SongCatalogItem) => void;
};

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
  badge: {
    ...typography.caption,
    color: colors.brand.primary,
  },
}));

export function RepertoireRow({
  item,
  selected,
  isFirst,
  showsInRepertoire,
  onPress,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  // `library_id` não nulo significa que ESTE músico já tem a música na
  // biblioteca dele — o sinal mais útil para o fã escolher o que pedir.
  const inRepertoire = showsInRepertoire && item.library_id !== null;

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
      accessibilityLabel={`${item.title}, de ${item.artist}${inRepertoire ? ', no repertório do artista' : ''}`}
      accessibilityHint="Usa esta música no pedido"
    >
      <View style={s.texts}>
        <Text style={s.title} numberOfLines={1}>{item.title}</Text>
        <Text style={s.meta} numberOfLines={1}>
          {item.artist}{item.genre ? ` · ${item.genre}` : ''}
        </Text>
      </View>

      {inRepertoire && <Text style={s.badge}>toca isso</Text>}
      {selected && <Check size={18} color={colors.brand.primary} />}
    </Pressable>
  );
}
