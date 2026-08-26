import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import type { RenderedClause } from '../../domain/contract.types';

type Props = {
  clauses: RenderedClause[];
};

/**
 * O corpo do contrato, renderizado NATIVAMENTE a partir do snapshot.
 *
 * Não é um PDF num WebView de propósito: o snapshot **é** a fonte (o PDF é
 * derivado dele), e texto nativo respeita o tamanho de fonte do sistema, o
 * leitor de tela e o tema — coisas que um PDF embutido joga fora.
 *
 * ⚠️ **`body` já vem refluido pelo backend** (`RenderedClause` VO): linha em
 * branco separa parágrafo, quebra interna virou espaço. Reformatar aqui
 * desfaria isso e produziria parágrafos esfarrapados — que foi exatamente o
 * defeito que o refluxo veio corrigir.
 */
export function ContractClauseList({ clauses }: Props) {
  return (
    <View style={s.root}>
      {clauses.map((clause) => (
        <View key={`${clause.number}-${clause.key}`} style={s.clause}>
          <Text style={s.title}>
            {clause.number}. {clause.title}
          </Text>

          {clause.body
            .split('\n\n')
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph, index) => (
              <Text key={index} style={s.paragraph}>
                {paragraph}
              </Text>
            ))}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
  clause: {
    gap: spacing.sm,
  },
  title: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  paragraph: {
    ...typography.bodySm,
    color:      colors.text.secondary,
    lineHeight: 21,
  },
});
