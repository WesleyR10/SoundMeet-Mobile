import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme } from 'nativewind';
import { colors as darkTokens, lightColors } from '../design-system/tokens';

export type ThemeMode = 'dark' | 'light';

interface ThemeColors {
  bg: {
    primary:  string;
    surface:  string;
    elevated: string;
    overlay:  string;
  };
  brand: {
    primary: string;
    light:   string;
    dark:    string;
    muted:   string;
    glow:    string;
  };
  text: {
    primary:   string;
    secondary: string;
    muted:     string;
    inverse:   string;
    brand:     string;
  };
  border: {
    default: string;
    strong:  string;
    brand:   string;
  };
}

interface ThemeContextValue {
  mode:   ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = 'sm_theme_mode';

const dark: ThemeColors = {
  bg:     darkTokens.bg,
  brand:  darkTokens.brand,
  text:   darkTokens.text,
  border: darkTokens.border,
};

const light: ThemeColors = {
  bg: {
    primary:  lightColors.bg.primary,
    surface:  lightColors.bg.surface,
    elevated: lightColors.bg.elevated,
    overlay:  'rgba(0,0,0,0.50)',
  },
  brand: {
    primary: lightColors.brand.primary,
    light:   lightColors.brand.light,
    dark:    '#007A63',
    muted:   'rgba(0,143,116,0.12)',
    glow:    'rgba(0,143,116,0.15)',
  },
  text: {
    primary:   lightColors.text.primary,
    secondary: lightColors.text.secondary,
    muted:     '#64748B',
    inverse:   '#F8FAFC',
    brand:     lightColors.brand.primary,
  },
  border: {
    default: lightColors.border.default,
    strong:  '#A0D8CC',
    brand:   'rgba(0,143,116,0.30)',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Leitura síncrona no lazy initializer → sem flash de tema na startup
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const saved = SecureStore.getItem(THEME_KEY);
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Sincroniza NativeWind dark: classes com o modo atual
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(mode);
  }, [mode, setColorScheme]);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      // Persiste de forma assíncrona (fire-and-forget)
      void SecureStore.setItemAsync(THEME_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    isDark: mode === 'dark',
    colors: mode === 'dark' ? dark : light,
    toggle,
  }), [mode, toggle]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
