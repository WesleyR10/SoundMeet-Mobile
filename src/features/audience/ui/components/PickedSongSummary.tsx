import { View, Text } from 'react-native';
import { Music4 } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  title:  string;
  artist: string;
};

const useStyles = makeStyles((colors) => ({
  card: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.md,
    minHeight:          64,
    paddingHorizontal:  spacing.md,
    paddingVertical:    spacing.md,
    borderRadius:       radius.md,
    borderWidth:         1,
    borderColor:        colors.border.brand,
    backgroundColor:    colors.bg.surface,
  },
  label: {
    ...typography.caption,
    color:          colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing:  0.6,
  },
  texts: {
    flex: 1,
    gap:  2,
  },
  title: {
    ...typography.mono,
    color: colors.text.primary,
  },
  artist: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  empty: {
    ...typography.bodySm,
    flex:  1,
    color: colors.text.muted,
  },
}));

/**
 * O que o fã vai pedir, quando não há campo de texto para mostrá-lo.
 *
 * Existe só no modo restrito (o músico aceita apenas o próprio repertório).
 * Ali a escolha no catálogo É o pedido, e sem este resumo a única pista do que
 * foi escolhido seria o check dentro da lista — que sai de vista assim que o
 * fã rola a tela até o botão de enviar.
 */
export function PickedSongSummary({ title, artist }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const hasPick = title.trim().length > 0;

  return (
    <View style={s.card}>
      <Music4 size={20} color={hasPick ? colors.brand.primary : colors.text.muted} />
      {hasPick ? (
        <View style={s.texts}>
          <Text style={s.label}>Seu pedido</Text>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          <Text style={s.artist} numberOfLines={1}>{artist}</Text>
        </View>
      ) : (
        <Text style={s.empty}>Escolha uma música na lista acima.</Text>
      )}
    </View>
  );
}
