import { View, Text, Pressable } from 'react-native';
import { Mail } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { StageTechSpecSection } from '@/shared/components/StageTechSpecSection';
import { ContractClauseList } from './ContractClauseList';
import { ContractPartiesSection } from './ContractPartiesSection';
import { ContractPayoutBreakdown } from './ContractPayoutBreakdown';
import { ContractShowSummary } from './ContractShowSummary';
import { ContractSignatureTrail } from './ContractSignatureTrail';
import { ContractStatusBadge } from './ContractStatusBadge';
import type { Contract } from '../../domain/contract.types';
import type { ContractPayout } from '../../domain/payout.types';

type Props = {
  contract:        Contract;
  pendingLabel:    string | null;
  onEmailDocument: () => void;
  isEmailing:      boolean;
  deliveryNote:    string | null;
  /** `null` quando o pagamento não passa pela plataforma. */
  payout:          ContractPayout | null;
};

/**
 * O documento inteiro, renderizado nativamente a partir do snapshot.
 *
 * Extraído da screen porque ela passava de 200 linhas — e porque a ordem das
 * seções **é** o documento: resumo do show, qualificação das partes, cláusulas,
 * Anexo I e trilha de assinaturas, na mesma sequência do PDF. Paridade de
 * rótulos entre PDF e tela é travada por teste nos outros dois projetos.
 */
const useStyles = makeStyles((colors) => ({
  statusRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  pending: {
    ...typography.caption,
    color: colors.accent.amber,
  },
  annulBox: {
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.error,
    padding:         spacing.md,
    gap:             2,
  },
  annulTitle: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
    color:      colors.status.error,
  },
  annulReason: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  sectionTitle: {
    ...typography.title,
    color:     colors.text.primary,
    marginTop: spacing.md,
  },
  annexNote: {
    ...typography.caption,
    color:     colors.text.muted,
    marginTop: -spacing.sm,
  },
  mailBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
    minHeight:     48,
  },
  mailText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
  deliveryNote: {
    ...typography.caption,
    color: colors.text.secondary,
  },
}));

export function ContractDocument({
  contract,
  pendingLabel,
  onEmailDocument,
  isEmailing,
  deliveryNote,
  payout,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <>
      <View style={s.statusRow}>
        <ContractStatusBadge contract={contract} />
        {!!pendingLabel && <Text style={s.pending}>{pendingLabel}</Text>}
      </View>

      {/*
        Contrato anulado sem o motivo à vista é a pior forma de contá-lo: o
        músico vê "Anulado" e não sabe se perdeu o show, se houve erro de cachê
        ou se vem outro no lugar. `annul_reason` é obrigatório na rota de
        anulação justamente para poder ser mostrado aqui.
      */}
      {contract.status === 'annulled' && !!contract.annul_reason && (
        <View style={s.annulBox}>
          <Text style={s.annulTitle}>Motivo da anulação</Text>
          <Text style={s.annulReason}>{contract.annul_reason}</Text>
        </View>
      )}

      <ContractShowSummary variables={contract.variables} />

      {/*
        Logo abaixo do cachê BRUTO, e não numa seção distante: é a resposta
        imediata para "então quanto sobra pra mim?". O contrato declara o valor
        cheio e remete a comissão ao que foi "informado às partes" — este bloco
        é onde essa informação acontece.
      */}
      <ContractPayoutBreakdown payout={payout} />

      <ContractPartiesSection variables={contract.variables} />

      <Text style={s.sectionTitle}>Cláusulas</Text>
      <ContractClauseList clauses={contract.clauses} />

      {/*
        Anexo I: SEMPRE do snapshot, NUNCA da ficha atual do estabelecimento.
        O documento é congelado e a ficha do perfil muda — mostrar a atual
        exibiria como parte do contrato algo que não estava lá na assinatura,
        que é exatamente o defeito que congelar este campo veio corrigir.

        A chave é AUSENTE (não `null`) quando a casa não preencheu: renderizar
        por presença é o que preserva contratos emitidos antes de ela existir.
      */}
      {contract.variables.ficha_tecnica_anexo && (
        <>
          <Text style={s.sectionTitle}>Anexo I — Ficha técnica do palco</Text>
          <Text style={s.annexNote}>
            Como declarada pelo estabelecimento na emissão. Item aqui declarado e
            não entregue no dia é inadimplemento contratual.
          </Text>
          <StageTechSpecSection spec={contract.variables.ficha_tecnica_anexo} title={null} />
        </>
      )}

      <Text style={s.sectionTitle}>Assinaturas</Text>
      <ContractSignatureTrail contract={contract} />

      {/*
        "Baixar" é mandar para o próprio e-mail, e é decisão, não limitação:
        `expo-file-system` não está instalado, o documento carrega CPF, CNPJ,
        endereço e cachê, e a caixa de entrada persiste fora do telefone — que é
        o valor probatório que a camada 4 de anti-chargeback busca.
      */}
      <Pressable
        onPress={onEmailDocument}
        disabled={isEmailing}
        style={s.mailBtn}
        accessibilityRole="button"
        accessibilityLabel="Receber o contrato em PDF por e-mail"
      >
        <Mail size={16} color={colors.brand.primary} />
        <Text style={s.mailText}>
          {isEmailing ? 'Enviando…' : 'Receber o PDF por e-mail'}
        </Text>
      </Pressable>
      {!!deliveryNote && <Text style={s.deliveryNote}>{deliveryNote}</Text>}
    </>
  );
}
