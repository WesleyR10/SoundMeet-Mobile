import { View, Text, Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  title:   string;
  onBack:  () => void;
};

/**
 * Cabeçalho das duas telas de contrato.
 *
 * Extraído porque as screens estavam encostando no limite de ~200 linhas do
 * `CLAUDE.md` — e porque o par "voltar + título centralizado" já é o padrão de
 * `InquiryListScreen`, com o `View` vazio à direita mantendo o título no centro
 * sem medir nada.
 */
const useStyles = makeStyles((colors) => ({
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.md,
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
}));

export function ContractScreenHeader({ title, onBack }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.header}>
      <Pressable
        onPress={onBack}
        style={s.iconBtn}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={8}
      >
        <ArrowLeft size={22} color={colors.text.primary} />
      </Pressable>
      <Text style={s.title}>{title}</Text>
      <View style={s.iconBtn} />
    </View>
  );
}
