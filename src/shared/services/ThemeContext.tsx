import React, { createContext, useState, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors as darkTokens, lightColors } from '../design-system/tokens';

/**
 * "sistema" é um estado DISTINTO de "escuro", e é o default.
 *
 * Quem escolhe escuro explicitamente quer escuro **mesmo se o aparelho virar
 * claro de manhã**. Um interruptor de dois estados obriga a decidir por um
 * deles e perde essa intenção — que é a que a maioria tem. Mesmo modelo do
 * `ThemeToggle` do `soundmeet-web`.
 */
export type ThemeChoice = 'dark' | 'light' | 'system';
export type ThemeMode = 'dark' | 'light';

/**
 * O tema inteiro, não um recorte dele.
 *
 * 🔴 **`accent` e `status` faltavam nesta interface**, e é a razão técnica de o
 * tema claro nunca ter saído do papel: uma tela migrada quebraria no primeiro
 * `colors.accent.coral` (gorjeta) ou `colors.status.success` (PIX confirmado) —
 * que são exatamente as cores do que o produto faz. Só `bg`/`brand`/`text`/
 * `border` estavam cobertos.
 */
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/*
 * `Widen` alarga os literais que o `as const` de `tokens.ts` produz. Sem ele o
 * tipo exigiria que o tema claro tivesse EXATAMENTE `'#0C0C14'` em
 * `bg.primary` — o compilador trataria a paleta dark como o formato, não como
 * um dos dois valores possíveis.
 */
export type ThemeColors = Widen<typeof darkTokens>;

interface ThemeContextValue {
  /** O que o usuário escolheu (inclui "system"). */
  choice: ThemeChoice;
  /** O que está valendo agora (nunca "system"). */
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  /** Cicla sistema → claro → escuro. */
  toggle: () => void;
  setChoice: (choice: ThemeChoice) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = 'sm_theme_mode';

const dark = darkTokens;

/*
 * O tema claro monta a partir de `lightColors`, que desde 05/set/2026 é a
 * paleta COMPLETA e medida contra WCAG. Antes, metade das chaves era inventada
 * aqui em runtime (`dark: '#007A63'`, `muted: '#64748B'`) — valores que não
 * existiam em documento nenhum e que ninguém tinha medido.
 */
const light: ThemeColors = lightColors;

const ORDER: ThemeChoice[] = ['system', 'light', 'dark'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();

  const [choice, setChoiceState] = useState<ThemeChoice>(() => {
    try {
      const saved = SecureStore.getItem(THEME_KEY);
      return saved === 'light' || saved === 'dark' ? saved : 'system';
    } catch {
      // `SecureStore` pode falhar (keystore indisponível logo após o boot).
      // Cair para "system" é o comportamento certo: o app abre no tema do
      // aparelho em vez de não abrir.
      return 'system';
    }
  });

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);
    try {
      // "system" é a AUSÊNCIA de escolha — apagar, nunca gravar a string.
      // Gravá-la faria a leitura acima cair no ramo do sistema por acidente
      // em vez de por desenho.
      if (next === 'system') void SecureStore.deleteItemAsync(THEME_KEY);
      else void SecureStore.setItemAsync(THEME_KEY, next);
    } catch {
      // Sem persistência, o tema vale para esta sessão. Derrubar a troca por
      // causa do armazenamento seria pior que não lembrar.
    }
  }, []);

  const toggle = useCallback(() => {
    setChoiceState((prev) => {
      const next = ORDER[(ORDER.indexOf(prev) + 1) % ORDER.length]!;
      try {
        if (next === 'system') void SecureStore.deleteItemAsync(THEME_KEY);
        else void SecureStore.setItemAsync(THEME_KEY, next);
      } catch {
        // idem
      }
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    // `useColorScheme` reage à troca com o app aberto, então "system" segue o
    // aparelho de verdade em vez de congelar o valor do boot.
    const mode: ThemeMode =
      choice === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : choice;

    return {
      choice,
      mode,
      isDark: mode === 'dark',
      colors: mode === 'dark' ? dark : light,
      toggle,
      setChoice,
    };
  }, [choice, systemScheme, toggle, setChoice]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
