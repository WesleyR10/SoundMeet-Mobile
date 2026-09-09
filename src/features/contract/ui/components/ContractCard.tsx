import { View, Text } from 'react-native';
import { CalendarDays, Users } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { GlowCard } from '@/shared/components/GlowCard';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import { pendingActorLabel, resolveMySide } from '../../domain/contract.rules';
import { ContractStatusBadge } from './ContractStatusBadge';
import type { Contract } from '../../domain/contract.types';

type Props = {
  contract:   Contract;
  musicianId: string | null;
  onPress:    () => void;
  riseDelay?: number;
};

/**
 * Linha da lista — e, na prática, **o cartão do show**.
 *
 * O músico não tem tela de booking no app, e o snapshot do contrato já carrega
 * data, horário, local e cachê. Mostrar isso aqui é o que faz a lista responder
 * "quais shows eu tenho fechados?" e não só "quais papéis eu tenho para
 * assinar".
 *
 * ⚠️ Os textos de data e valor vêm **prontos do backend** (`data_show`,
 * `cache_formatado`). Reformatar aqui criaria uma segunda verdade sobre um
 * documento congelado.
 */
const useStyles = makeStyles((colors) => ({
  card: {
    gap:     spacing.sm,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  local: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
    flex:       1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  date: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex:  1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
  },
  cache: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
  bandTag: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  bandText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  pending: {
    ...typography.caption,
    color:      colors.accent.amber,
    marginLeft: 'auto',
    textAlign:  'right',
  },
}));

export function ContractCard({ contract, musicianId, onPress, riseDelay = 0 }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const mySide = resolveMySide(contract, musicianId);
  const pending = pendingActorLabel(contract, mySide);
  const { variables } = contract;

  return (
    <Pressable3DCard
      onPress={onPress}
      accessibilityLabel={`Ver contrato do show em ${variables.local_nome}`}
    >
      <GlowCard accentColor={colors.accent.violet} riseDelay={riseDelay} style={s.card}>
        <View style={s.headerRow}>
          <Text style={s.local} numberOfLines={1}>{variables.local_nome}</Text>
          <ContractStatusBadge contract={contract} />
        </View>

        <View style={s.dateRow}>
          <CalendarDays size={13} color={colors.text.muted} />
          <Text style={s.date} numberOfLines={1}>
            {variables.data_show} · {variables.hora_inicio}
          </Text>
        </View>

        <View style={s.footerRow}>
          <Text style={s.cache}>{variables.cache_formatado}</Text>

          {variables.contratado_e_banda && (
            <View style={s.bandTag}>
              <Users size={12} color={colors.text.muted} />
              {/* Só o líder assina (403 para os demais) — avisar aqui evita que
                  o membro comum descubra isso só ao apertar o botão. */}
              <Text style={s.bandText}>Pela banda</Text>
            </View>
          )}

          {!!pending && <Text style={s.pending}>{pending}</Text>}
        </View>
      </GlowCard>
    </Pressable3DCard>
  );
}
