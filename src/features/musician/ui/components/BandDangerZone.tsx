import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Crown, Trash2 } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import type { Band } from '../../domain/band.types';
import { confirmsBandDeletion } from '../../domain/band.validation';
import {
  getBandMutationErrorMessage,
  useDeleteBand,
  useTransferBandLeadership,
} from '../../application/useBandMutations';

type Props = {
  band: Band;
  musicianId: string | null;
  /** Chamado depois de dissolver — a tela de detalhe deixa de ter assunto. */
  onDissolved: () => void;
};

/**
 * As duas ações que só o líder faz e que mudam a banda de forma irreversível.
 *
 * Ficam fora do accordion de configurações de propósito: transferir liderança e
 * dissolver não são "ajustes", e escondê-las no mesmo idioma visual de
 * "Disponibilidade" e "Endereço" convidaria ao toque distraído.
 *
 * 🔴 **Transferir só oferece membros ACEITOS.** O backend recusa `pending` com
 * 422, e um convidado que ainda não respondeu virando líder deixaria a banda
 * sem ninguém que possa aceitar um show — que é exatamente o que a regra do
 * agregado existe para impedir.
 */
const useStyles = makeStyles((colors) => ({
  root: { gap: spacing.md },
  sectionTitle: {
    ...typography.caption,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.text.secondary,
  },
  card: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.lg,
  },
  dangerCard: { borderColor: `${colors.status.error}33` },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color: colors.text.primary,
  },
  help: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  bold: { fontFamily: 'Inter-SemiBold', color: colors.text.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
  },
  rowPressed: { opacity: 0.8 },
  rowText: {
    ...typography.bodySm,
    color: colors.text.primary,
    flex: 1,
  },
  rowCta: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color: colors.accent.amber,
  },
  confirmInput: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.status.error}55`,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cancelBtn: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  cancelText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  dangerBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.status.error}55`,
    paddingHorizontal: spacing.lg,
  },
  dangerBtnText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color: colors.status.error,
  },
  dangerBtnFilled: {
    flex: 1,
    backgroundColor: colors.status.error,
    borderColor: colors.status.error,
  },
  dangerBtnDisabled: { opacity: 0.45 },
  dangerBtnFilledText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color: colors.text.inverse,
  },
}));

export function BandDangerZone({ band, musicianId, onDissolved }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const [confirmText, setConfirmText] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [pendingLeaderId, setPendingLeaderId] = useState<string | null>(null);

  const transfer = useTransferBandLeadership(band.id, musicianId);
  const remove = useDeleteBand(musicianId);

  const successors = band.members.filter(
    (member) => member.status === 'accepted' && member.musician_id !== musicianId,
  );

  const canDelete = confirmsBandDeletion(confirmText, band.name);

  const handleTransfer = async (newLeaderMusicianId: string) => {
    setPendingLeaderId(newLeaderMusicianId);
    try {
      await transfer.mutateAsync(newLeaderMusicianId);
    } catch {
      // Visível no ErrorBanner. Não inferimos liderança no cliente: se o
      // servidor recusar (403), ele é a autoridade — mesma decisão registrada
      // no F1.2 e no contrato digital.
    } finally {
      setPendingLeaderId(null);
    }
  };

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(band.id);
      onDissolved();
    } catch {
      // Visível no ErrorBanner.
    }
  };

  return (
    <View style={s.root}>
      <Text style={s.sectionTitle}>Liderança e encerramento</Text>

      <View style={s.card}>
        <View style={s.cardHeader}>
          <Crown size={18} color={colors.accent.amber} />
          <Text style={s.cardTitle}>Passar a liderança</Text>
        </View>

        {successors.length === 0 ? (
          <Text style={s.help}>
            Só é possível passar a liderança para quem já aceitou o convite. Convide alguém e
            aguarde o aceite.
          </Text>
        ) : (
          <>
            <Text style={s.help}>
              Quem receber passa a decidir shows pela banda — e você deixa de decidir.
            </Text>
            {successors.map((member) => (
              <Pressable
                key={member.member_id}
                onPress={() => handleTransfer(member.musician_id)}
                disabled={transfer.isPending}
                style={({ pressed }) => [s.row, pressed && s.rowPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Passar a liderança para ${member.instrument}`}
              >
                <Text style={s.rowText} numberOfLines={1}>
                  {member.instrument} · {member.role === 'leader' ? 'líder' : 'integrante'}
                </Text>
                {pendingLeaderId === member.musician_id ? (
                  <ActivityIndicator color={colors.accent.amber} size="small" />
                ) : (
                  <Text style={s.rowCta}>Passar</Text>
                )}
              </Pressable>
            ))}
          </>
        )}

        {transfer.isError && <ErrorBanner message={getBandMutationErrorMessage(transfer.error)} />}
      </View>

      <View style={[s.card, s.dangerCard]}>
        <View style={s.cardHeader}>
          <Trash2 size={18} color={colors.status.error} />
          <Text style={s.cardTitle}>Dissolver a banda</Text>
        </View>

        {!showDelete ? (
          <Pressable
            onPress={() => setShowDelete(true)}
            style={({ pressed }) => [s.dangerBtn, pressed && s.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel="Dissolver a banda"
          >
            <Text style={s.dangerBtnText}>Dissolver…</Text>
          </Pressable>
        ) : (
          <>
            {/*
              🔴 Confirmação por digitação do nome, não um "tem certeza?".
              A ação é irreversível e o backend só checa liderança — nada
              impede apagar uma banda com histórico de shows por um toque no
              lugar errado.
            */}
            <Text style={s.help}>
              Isso não pode ser desfeito. Digite <Text style={s.bold}>{band.name}</Text> para
              confirmar.
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder={band.name}
              placeholderTextColor={colors.text.muted}
              autoCapitalize="none"
              autoCorrect={false}
              style={s.confirmInput}
              cursorColor={colors.status.error}
              accessibilityLabel="Confirme digitando o nome da banda"
            />

            <View style={s.actionsRow}>
              <Pressable
                onPress={() => {
                  setShowDelete(false);
                  setConfirmText('');
                }}
                disabled={remove.isPending}
                style={s.cancelBtn}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
              >
                <Text style={s.cancelText}>Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={handleDelete}
                disabled={!canDelete || remove.isPending}
                style={({ pressed }) => [
                  s.dangerBtn,
                  s.dangerBtnFilled,
                  (!canDelete || remove.isPending) && s.dangerBtnDisabled,
                  pressed && s.rowPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Confirmar dissolução da banda"
                accessibilityState={{ disabled: !canDelete || remove.isPending }}
              >
                {remove.isPending ? (
                  <ActivityIndicator color={colors.text.inverse} size="small" />
                ) : (
                  <Text style={s.dangerBtnFilledText}>Dissolver</Text>
                )}
              </Pressable>
            </View>
          </>
        )}

        {remove.isError && <ErrorBanner message={getBandMutationErrorMessage(remove.error)} />}
      </View>
    </View>
  );
}
