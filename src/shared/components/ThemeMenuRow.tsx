import { View, Text, Pressable } from 'react-native';
import { Monitor, Moon, Sun } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import type { ThemeChoice } from '@/shared/services/ThemeContext';

const OPTIONS: { choice: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { choice: 'system', label: 'Sistema', icon: Monitor },
  { choice: 'light', label: 'Claro', icon: Sun },
  { choice: 'dark', label: 'Escuro', icon: Moon },
];

const useStyles = makeStyles((colors) => ({
  root: {
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.text.secondary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.sm,
  },
  optionActive: {
    borderColor: colors.border.brand,
    backgroundColor: colors.brand.muted,
  },
  optionText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  optionTextActive: {
    fontFamily: 'Inter-SemiBold',
    color: colors.text.brand,
  },
}));

/**
 * Seletor de tema — três opções explícitas, não um interruptor.
 *
 * 🔴 **"Sistema" é um estado distinto de "escuro", e é o default.** Quem
 * escolhe escuro de propósito quer escuro **mesmo quando o aparelho vira claro
 * de manhã**; um interruptor de dois estados obriga a decidir por um deles e
 * perde exatamente essa intenção. Mesmo modelo do `ThemeToggle` do
 * `soundmeet-web`.
 *
 * Três botões visíveis em vez de um que cicla: num menu de configurações o
 * usuário quer VER as opções e o estado atual, não descobrir por tentativa. O
 * ciclo faz sentido num ícone de topbar (é o que o web usa), não aqui.
 */
export function ThemeMenuRow() {
  const s = useStyles();
  const { colors, choice, setChoice } = useTheme();

  return (
    <View style={s.root}>
      <Text style={s.label}>Aparência</Text>
      <View style={s.row} accessibilityRole="radiogroup">
        {OPTIONS.map((option) => {
          const active = choice === option.choice;
          const Icon = option.icon;
          return (
            <Pressable
              key={option.choice}
              onPress={() => setChoice(option.choice)}
              style={({ pressed }) => [
                s.option,
                active && s.optionActive,
                pressed && !active && { opacity: 0.7 },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Tema ${option.label}`}
            >
              <Icon
                size={18}
                color={active ? colors.brand.primary : colors.text.secondary}
                strokeWidth={2}
              />
              <Text style={[s.optionText, active && s.optionTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
