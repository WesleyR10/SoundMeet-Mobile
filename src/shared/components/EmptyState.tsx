import { View, Text, Pressable } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /**
   * A saída do estado vazio.
   *
   * 🔴 **Estado vazio sem ação é um beco sem saída**, e este projeto já pagou
   * por isso duas vezes: a tile "Meus Pedidos" desabilitada e o "peça pro líder
   * te convidar" do `MyBandsScreen` — os dois com o endpoint pronto do outro
   * lado. Quando existe algo que o usuário possa fazer, ofereça aqui.
   */
  action?: {
    label: string;
    onPress: () => void;
  };
};

/**
 * Estado vazio compartilhado.
 *
 * **Promovido de `features/audience/ui/components/` em 05/set/2026.** Morando
 * dentro de uma feature, a regra de ouro do FSD impedia `features/musician`,
 * `scheduling`, `contract` e `payment` de importá-lo — então **21 lugares**
 * reescreveram o mesmo `View` centralizado com `emptyTitle`/`emptySubtitle` à
 * mão, cada um com um espaçamento e uma decisão de ícone diferente. Mesmo
 * precedente (e mesmo motivo) de `StageTechSpecSection`, promovido no F1.2.
 *
 * O ícone é **obrigatório**: metade dos sites à mão não tinha nenhum, e uma
 * tela vazia só com duas linhas de texto centralizadas lê como erro de
 * carregamento, não como "ainda não há nada aqui".
 */
const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  message: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Ícone dentro de um disco discreto, e não solto: é o mesmo idioma de
  // `QuickActionsRow`/`MyRequestCard`, e é o que faz o estado vazio parecer
  // parte do app em vez de um erro de renderização.
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    // Linha curta lê melhor num bloco centralizado; sem o teto, o subtítulo
    // ocupa a largura toda da tela e vira parágrafo.
    maxWidth: 300,
  },
  action: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.brand,
    backgroundColor: colors.brand.muted,
    paddingHorizontal: spacing.xl,
  },
  actionPressed: { opacity: 0.8 },
  actionText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color: colors.text.brand,
  },
}));

export function EmptyState({ icon: Icon, title, subtitle, action }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.root}>
      {/*
        `accessible` agrupa ícone, título e subtítulo numa leitura só. Sem isso
        o leitor de tela anuncia três nós soltos, e o usuário ouve o título sem
        a explicação que o segue.
      */}
      <View style={s.message} accessible accessibilityRole="summary">
        <View style={s.iconBox}>
          <Icon size={26} color={colors.text.secondary} strokeWidth={1.8} />
        </View>
        <Text style={s.title}>{title}</Text>
        {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      </View>

      {!!action && (
        <Pressable
          onPress={action.onPress}
          style={({ pressed }) => [s.action, pressed && s.actionPressed]}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={s.actionText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

