import { useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { X, RotateCcw } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { useRemoveBandMember, getRemoveBandMemberErrorMessage } from '../../application/useRemoveBandMember';
import { useInviteBandMember, getInviteBandMemberErrorMessage } from '../../application/useInviteBandMember';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import type { BandMember } from '../../domain/band.types';

type Props = {
  member: BandMember;
  bandId: string;
  // Só o líder vê os botões de convidar/remover — restrição de UI (mobile),
  // API ainda permite qualquer membro accepted (ver plano/CLAUDE.md).
  canManage: boolean;
};

const ROLE_LABEL: Record<string, string> = {
  leader: 'Líder',
  member: 'Membro',
};

const STATUS_LABEL: Record<BandMember['status'], string> = {
  pending:  'Pendente',
  accepted: 'Aceito',
  declined: 'Recusou',
};

const STATUS_COLOR: Record<BandMember['status'], string> = {
  pending:  colors.status.warning,
  accepted: colors.status.success,
  declined: colors.status.error,
};

// Linha de membro na BandDetailScreen — sem avatar (backend não expõe
// nome/foto do músico aqui, só musician_id; resolver isso é trabalho de uma
// v2 com um endpoint de lookup em lote, fora do escopo desta versão).
export function BandMemberRow({ member, bandId, canManage }: Props) {
  const roleLabel = ROLE_LABEL[member.role] ?? member.role;
  const [error, setError] = useState<string | null>(null);

  const removeMember = useRemoveBandMember(bandId, null);
  const reinvite      = useInviteBandMember(bandId, null);

  const isBusy = removeMember.isPending || reinvite.isPending;

  const confirmRemove = () => {
    const isPending = member.status === 'pending';
    Alert.alert(
      isPending ? 'Cancelar convite' : 'Remover membro',
      isPending
        ? 'Cancelar o convite pendente desse músico?'
        : 'Remover esse músico da banda? Ele perde acesso à agenda e ao split de gorjeta.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: isPending ? 'Cancelar convite' : 'Remover',
          style: 'destructive',
          onPress: async () => {
            setError(null);
            try {
              await removeMember.mutateAsync(member.musician_id);
            } catch (err) {
              setError(getRemoveBandMemberErrorMessage(err));
            }
          },
        },
      ],
    );
  };

  const handleReinvite = async () => {
    setError(null);
    try {
      await reinvite.mutateAsync({ musician_id: member.musician_id, role: member.role, instrument: member.instrument });
    } catch (err) {
      setError(getInviteBandMemberErrorMessage(err));
    }
  };

  return (
    <View>
      <View style={s.row}>
        <View style={s.initialCircle}>
          <Text style={s.initial}>{member.instrument.charAt(0).toUpperCase() || '?'}</Text>
        </View>
        <View style={s.info}>
          <Text style={s.instrument}>{member.instrument}</Text>
          <Text style={s.role}>{roleLabel}</Text>
        </View>

        <View style={[s.statusPill, { backgroundColor: `${STATUS_COLOR[member.status]}1F` }]}>
          <Text style={[s.statusText, { color: STATUS_COLOR[member.status] }]}>{STATUS_LABEL[member.status]}</Text>
        </View>

        {canManage && isBusy && <ActivityIndicator size="small" color={colors.text.muted} />}

        {canManage && !isBusy && member.status === 'declined' && (
          <Pressable onPress={handleReinvite} accessibilityRole="button" accessibilityLabel="Convidar de novo" hitSlop={8}>
            <RotateCcw size={18} color={colors.brand.primary} />
          </Pressable>
        )}

        {canManage && !isBusy && member.status !== 'declined' && (
          <Pressable onPress={confirmRemove} accessibilityRole="button" accessibilityLabel="Remover membro" hitSlop={8}>
            <X size={18} color={colors.accent.coral} />
          </Pressable>
        )}
      </View>
      {!!error && <ErrorBanner message={error} style={s.error} />}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
  },
  initialCircle: {
    width:           36,
    height:          36,
    borderRadius:    18,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: colors.brand.muted,
    borderWidth:     1,
    borderColor:     colors.border.brand,
  },
  initial: {
    ...typography.bodySm,
    fontFamily: 'Inter-Bold',
    color:      colors.brand.primary,
  },
  info: {
    flex: 1,
  },
  instrument: {
    ...typography.body,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
  },
  role: {
    ...typography.caption,
    color: colors.text.muted,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical:   2,
    borderRadius:      radius.sm,
  },
  statusText: {
    ...typography.caption,
    fontFamily: 'Inter-Bold',
  },
  error: {
    marginTop: spacing.xs,
  },
});
