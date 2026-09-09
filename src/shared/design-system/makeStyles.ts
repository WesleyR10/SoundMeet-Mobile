import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/hooks/useTheme';
import type { ThemeColors } from '@/shared/services/ThemeContext';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * `StyleSheet.create` que enxerga o tema.
 *
 * ## O problema que isto resolve
 *
 * O app inteiro escreve estilo assim:
 *
 * ```ts
 * const s = StyleSheet.create({ root: { backgroundColor: colors.bg.primary } });
 * ```
 *
 * Isso roda **no carregamento do módulo**, uma vez, antes de qualquer
 * componente montar — não há como um hook alcançar ali. É a razão técnica de o
 * tema claro existir só no papel: `ThemeContext` e `useTheme` estavam prontos
 * e tinham **zero consumidores**, porque adotá-los exigiria reescrever cada
 * bloco de estilo. Não era esquecimento; era um beco.
 *
 * ## Como usar
 *
 * ```ts
 * const useStyles = makeStyles((colors) => ({
 *   root: { flex: 1, backgroundColor: colors.bg.primary },
 * }));
 *
 * export function MinhaTela() {
 *   const s = useStyles();          // ← única linha nova no componente
 *   return <View style={s.root} />;
 * }
 * ```
 *
 * A folha é memoizada **por tema**: trocar de tela não recria nada, e trocar de
 * tema recria uma vez. Sem o `useMemo`, cada render chamaria
 * `StyleSheet.create` de novo — que é justamente o custo que a API existe para
 * evitar.
 *
 * ## O que NÃO precisa migrar
 *
 * ⚠️ Estilo que só usa `spacing`, `radius` ou `typography` **não muda com o
 * tema** e deve continuar em `StyleSheet.create` no nível do módulo. Migrar
 * tudo por uniformidade trocaria uma folha estática por um hook, sem ganho —
 * e o `makeStyles` passaria a parecer obrigatório quando é uma ferramenta para
 * um caso específico: **estilo que depende de cor**.
 */
export function makeStyles<T extends NamedStyles<T>>(
  factory: (colors: ThemeColors) => T,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
