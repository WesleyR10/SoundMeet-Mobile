import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/shared/hooks/useTheme';

/**
 * Barra de status que acompanha o tema DO APP (não o do sistema — por isso
 * não é `style="auto"`: o usuário pode escolher claro com o aparelho no escuro).
 *
 * `<StatusBar style="light" />` fixo deixa relógio e bateria brancos sobre o
 * fundo claro. Telas que são escuras nos dois temas (Play Mode, palco)
 * continuam com o `light` fixo, de propósito.
 */
export function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}
