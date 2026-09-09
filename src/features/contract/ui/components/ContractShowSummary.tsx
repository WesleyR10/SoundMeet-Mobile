import { View, Text } from 'react-native';
import { CalendarDays, Clock, MapPin, Wallet } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { GlowCard } from '@/shared/components/GlowCard';
import type { Contract } from '../../domain/contract.types';

type Props = {
  variables: Contract['variables'];
};

/**
 * O cabeçalho do show — e a razão de o contrato ser a tela do show no app.
 *
 * O músico não tem lista de bookings aqui (`GET /scheduling/bookings` não é
 * chamado em lugar nenhum de `src/`), e construir uma só para isto seria
 * duplicar o que o snapshot já carrega: data, horário, duração, local e cachê.
 *
 * ⚠️ Todo texto vem **pronto do backend**. `data_show`, `hora_inicio`,
 * `duracao_formatada` e `cache_formatado` são o que foi impresso no documento
 * assinado; reformatar aqui criaria uma segunda verdade sobre um instrumento
 * congelado.
 */
const useStyles = makeStyles((colors) => ({
  card: {
    gap:     spacing.sm,
    padding: spacing.md,
  },
  local: {
    ...typography.title,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:            spacing.sm,
  },
  rowText: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex:  1,
  },
  cacheBox: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:              spacing.sm,
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.lg,
    padding:         spacing.md,
    marginTop:       spacing.xs,
  },
  cacheBody: {
    flex: 1,
    gap:  1,
  },
  cacheValue: {
    ...typography.title,
    color: colors.brand.primary,
  },
  cacheNote: {
    ...typography.caption,
    color: colors.text.muted,
  },
}));

export function ContractShowSummary({ variables }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const rows = [
    { Icon: CalendarDays, text: `${variables.data_show} · ${variables.dia_semana}` },
    { Icon: Clock,        text: `${variables.hora_inicio} às ${variables.hora_fim} (${variables.duracao_formatada})` },
    { Icon: MapPin,       text: variables.local_endereco },
  ];

  return (
    <GlowCard accentColor={colors.accent.violet} style={s.card}>
      <Text style={s.local}>{variables.local_nome}</Text>

      {rows.map(({ Icon, text }) => (
        <View key={text} style={s.row}>
          <Icon size={15} color={colors.text.muted} />
          <Text style={s.rowText}>{text}</Text>
        </View>
      ))}

      <View style={s.cacheBox}>
        <Wallet size={16} color={colors.brand.primary} />
        <View style={s.cacheBody}>
          <Text style={s.cacheValue}>{variables.cache_formatado}</Text>
          {/* O cachê é declarado BRUTO no contrato — dizer isso aqui evita a
              surpresa de receber menos do que o número da tela. */}
          <Text style={s.cacheNote}>Valor bruto · {variables.pagamento_prazo_texto}</Text>
        </View>
      </View>
    </GlowCard>
  );
}
