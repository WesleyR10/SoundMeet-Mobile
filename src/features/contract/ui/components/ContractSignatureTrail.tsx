import { View, Text } from 'react-native';
import { CheckCircle2, Clock } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { signatureOf } from '../../domain/contract.rules';
import type { Contract, ContractPartyRole } from '../../domain/contract.types';

type Props = {
  contract: Pick<Contract, 'signatures' | 'pending_signatures' | 'content_hash' | 'verification_code'>;
};

const ROLE_LABEL: Record<ContractPartyRole, string> = {
  contractor: 'Estabelecimento',
  contracted: 'Artista',
};

/** `2026-08-16T10:00:00Z` → `16/08/2026 às 10:00`. */
function formatSignedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()} às ${hh}:${min}`;
}

/**
 * Trilha de aceites — o que sustenta a validade da assinatura eletrônica.
 *
 * Mostra quem assinou, quando e de onde. O IP aparece cru, **sem
 * interpretação**: confiar no `X-Forwarded-For` exige saber quantos proxies
 * existem na frente, e o backend registra a procedência justamente para a
 * trilha dizer o que sabe, não o que supõe.
 *
 * O `content_hash` é impresso porque é o que torna a verificação pública útil:
 * quem tem o PDF confere o SHA-256 do rodapé contra este número.
 */
const useStyles = makeStyles((colors) => ({
  root: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap:            spacing.sm,
    alignItems:    'flex-start',
  },
  rowBody: {
    flex: 1,
    gap:  1,
  },
  roleLabel: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  detail: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  meta: {
    ...typography.caption,
    color: colors.text.muted,
  },
  hashBox: {
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.lg,
    padding:         spacing.md,
    gap:             2,
  },
  hashLabel: {
    ...typography.caption,
    color:      colors.text.muted,
    marginTop:  spacing.xs,
  },
  hashValue: {
    ...typography.body,
    fontFamily:    'Inter-SemiBold',
    color:         colors.text.primary,
    letterSpacing: 2,
  },
  hashMono: {
    ...typography.caption,
    color: colors.text.secondary,
  },
}));

export function ContractSignatureTrail({ contract }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const roles: ContractPartyRole[] = ['contractor', 'contracted'];

  return (
    <View style={s.root}>
      {roles.map((role) => {
        const sig = signatureOf(contract, role);

        return (
          <View key={role} style={s.row}>
            {sig
              ? <CheckCircle2 size={18} color={colors.status.success} />
              : <Clock size={18} color={colors.accent.amber} />}

            <View style={s.rowBody}>
              <Text style={s.roleLabel}>{ROLE_LABEL[role]}</Text>
              {sig ? (
                <>
                  <Text style={s.detail}>{sig.signer_name}</Text>
                  <Text style={s.detail}>{formatSignedAt(sig.signed_at)}</Text>
                  {!!sig.ip && <Text style={s.meta}>IP {sig.ip}</Text>}
                </>
              ) : (
                <Text style={s.detail}>Ainda não assinou</Text>
              )}
            </View>
          </View>
        );
      })}

      <View style={s.hashBox}>
        <Text style={s.hashLabel}>Código de verificação</Text>
        <Text style={s.hashValue}>{contract.verification_code}</Text>
        <Text style={s.hashLabel}>Hash do conteúdo (SHA-256)</Text>
        <Text style={s.hashMono} selectable>{contract.content_hash}</Text>
      </View>
    </View>
  );
}
