import { View, Text, Pressable } from 'react-native';
import { Share2 } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  isShared: boolean;
  onToggle: () => void;
};

// Extraído de EditRepertoireScreen.tsx (limite ~200 linhas/arquivo).
const useStyles = makeStyles((colors) => ({
  section: {
    borderRadius:    radius.lg,
    borderWidth:      1,
    borderColor:      colors.border.default,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding:          spacing.lg,
    gap:              spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  sectionHint: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  toggleBtn: {
    alignSelf:          'flex-start',
    borderRadius:       radius.md,
    borderWidth:         1,
    borderColor:        colors.border.brand,
    paddingHorizontal:  spacing.lg,
    paddingVertical:    spacing.sm,
    marginTop:           spacing.xs,
  },
  toggleBtnActive: {
    backgroundColor: colors.brand.muted,
  },
  toggleBtnText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
}));

export function EditRepertoireShareSection({ isShared, onToggle }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Share2 size={18} color={colors.brand.primary} />
        <Text style={s.sectionTitle}>Compartilhamento público</Text>
      </View>
      <Text style={s.sectionHint}>
        {isShared
          ? 'Link ativo — expira 7 dias após ativado.'
          : 'Gere um link público (somente leitura) pra compartilhar esse repertório.'}
      </Text>
      <Pressable
        onPress={onToggle}
        style={[s.toggleBtn, isShared && s.toggleBtnActive]}
        accessibilityRole="button"
        accessibilityLabel={isShared ? 'Desativar compartilhamento' : 'Ativar compartilhamento'}
      >
        <Text style={s.toggleBtnText}>{isShared ? 'Desativar link' : 'Compartilhar'}</Text>
      </Pressable>
    </View>
  );
}
