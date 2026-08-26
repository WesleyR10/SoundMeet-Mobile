import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { Contract } from '../../domain/contract.types';

type Props = {
  variables: Contract['variables'];
};

/**
 * Qualificação das partes, como congelada no documento.
 *
 * Lê de `variables` e não de `contractor`/`contracted`: são os mesmos dados,
 * mas já formatados em pt-BR pelo backend (CPF/CNPJ com máscara, endereço em
 * uma linha) — e é esse texto exato que foi para dentro do instrumento
 * assinado. Remontar a partir dos objetos de parte criaria uma segunda verdade
 * sobre um documento congelado.
 */
export function ContractPartiesSection({ variables }: Props) {
  const rows: { label: string; party: 'contratante' | 'contratado' }[] = [
    { label: 'Contratante', party: 'contratante' },
    { label: 'Contratado',  party: 'contratado' },
  ];

  return (
    <View style={s.root}>
      {rows.map(({ label, party }) => {
        const nome = party === 'contratante' ? variables.contratante_nome : variables.contratado_nome;
        const doc = party === 'contratante' ? variables.contratante_documento : variables.contratado_documento;
        const endereco = party === 'contratante' ? variables.contratante_endereco : variables.contratado_endereco;
        const representante =
          party === 'contratante' ? variables.contratante_representante : variables.contratado_representante;

        return (
          <View key={party} style={s.card}>
            <Text style={s.role}>{label}</Text>
            <Text style={s.name}>{nome}</Text>
            <Text style={s.detail}>{doc}</Text>
            <Text style={s.detail}>{endereco}</Text>
            {!!representante && <Text style={s.detail}>Rep.: {representante}</Text>}
          </View>
        );
      })}

      {variables.contratado_e_banda && variables.contratado_integrantes.length > 0 && (
        <View style={s.card}>
          <Text style={s.role}>Formação</Text>
          {/* Nomeada no contrato de propósito: "contratei o Trio Maré" sem
              dizer quem toca é o que permite trocar a banda no dia. */}
          {variables.contratado_integrantes.map((nome) => (
            <Text key={nome} style={s.detail}>• {nome}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.lg,
    padding:         spacing.md,
    gap:             2,
  },
  role: {
    ...typography.caption,
    fontFamily:    'Inter-SemiBold',
    color:         colors.text.muted,
    letterSpacing: 0.6,
    marginBottom:  spacing.xs,
  },
  name: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  detail: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
});
