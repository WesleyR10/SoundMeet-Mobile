import { useEffect, useRef, useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { useCardShare } from '@/shared/hooks/useCardShare';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import {
  getRecapShowTips,
  setRecapShowTips,
} from '@/shared/services/storage/recap-preferences.storage';
import type { PerformanceReport } from '@/shared/services/performance/performance.types';
import { useMusician } from '../../application/useMusician';
import { QRActionRow } from './QRActionRow';
import { ShowRecapCard, type ShowRecapCardHandle } from './ShowRecapCard';

type Props = {
  report: PerformanceReport;
};

/**
 * "Compartilhe seu show" (B1) — o relatório vira post.
 *
 * ## Por que gera conteúdo sozinho
 *
 * A dor de divulgação não é falta de vontade, é que produzir post dá trabalho
 * depois de quatro horas de palco. Aqui o conteúdo já existe: o card é
 * subproduto de o músico ter mantido o set aberto, e o custo dele é um toque.
 *
 * ## 🔴 Gorjeta é opt-in, e o padrão é não mostrar
 *
 * O total de gorjetas é a renda do músico naquela noite. Um card que a publica
 * por padrão transformaria "compartilhar o show" em "divulgar quanto ganhei" —
 * decisão que ninguém tomou conscientemente, num toque que parecia inofensivo.
 * É o mesmo princípio que mantém `Booking.fee` fora do currículo verificado
 * (F4): o número existe, mas quem decide expor é o dono dele.
 *
 * O preview mostra exatamente o que será postado, então a decisão é tomada
 * vendo o resultado — não lendo um rótulo de checkbox.
 */
export function ShowRecapSection({ report }: Props) {
  const cardRef = useRef<ShowRecapCardHandle>(null);
  const [showTips, setShowTips] = useState(false);

  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data: musician } = useMusician(musicianId);

  // Lembra a escolha entre um show e outro — quem sempre inclui não religa toda
  // vez. Só liga: o estado inicial já é `false`, então enquanto o disco não
  // responde o card está no lado que não publica renda. Um toque em
  // "Compartilhar" antes disso resolver compartilha SEM gorjeta, que é a
  // direção segura de errar.
  useEffect(() => {
    if (!musicianId) return;
    let cancelled = false;
    void getRecapShowTips(musicianId).then((stored) => {
      if (!cancelled && stored) setShowTips(true);
    });
    return () => {
      cancelled = true;
    };
  }, [musicianId]);

  const toggleTips = (next: boolean) => {
    setShowTips(next);
    // Fire-and-forget, como em liveSet.store: o estado em memória é a verdade da
    // sessão, e o toggle não pode esperar o keychain para responder ao toque.
    if (musicianId) void setRecapShowTips(musicianId, next);
  };

  const {
    shareCard, isSharing, justShared,
    saveCard, isSaving, justSaved,
    bannerError,
  } = useCardShare(cardRef, {
    dialogTitle: 'Compartilhar show',
    subject:     'o card do seu show',
    shareError:  'Não foi possível compartilhar o card do show.',
    saveError:   'Não foi possível salvar o card do show.',
  });

  // Nome ausente enquanto o perfil carrega: o card omite a linha em vez de
  // piscar um placeholder que pode acabar capturado numa foto.
  const musicianName =
    musician?.display_name || musician?.stage_name || musician?.name || null;

  return (
    <View style={s.root}>
      <Text style={s.title}>Compartilhe seu show</Text>

      <ShowRecapCard report={report} musicianName={musicianName} showTips={showTips} />

      {report.tips_total > 0 && (
        <View style={s.tipsRow}>
          <View style={s.tipsText}>
            <Text style={s.tipsTitle}>Mostrar gorjetas no card</Text>
            <Text style={s.tipsHint}>
              Desligado por padrão — quanto você ganhou é seu, não do post. Sua
              escolha fica lembrada para os próximos shows.
            </Text>
          </View>
          <Switch
            value={showTips}
            onValueChange={toggleTips}
            trackColor={{ false: colors.border.default, true: colors.brand.muted }}
            thumbColor={showTips ? colors.brand.primary : colors.text.muted}
            accessibilityLabel="Mostrar gorjetas no card"
            accessibilityRole="switch"
          />
        </View>
      )}

      {bannerError && <ErrorBanner message={bannerError} />}

      <View style={s.actions}>
        <QRActionRow
          onShare={shareCard}
          onSave={saveCard}
          isSharing={isSharing}
          isSaving={isSaving}
          justShared={justShared}
          justSaved={justSaved}
          shareAccessibilityLabel="Compartilhar card do show"
          saveAccessibilityLabel="Salvar card do show na galeria"
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap:       spacing.md,
    marginTop: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  tipsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
    padding:        spacing.md,
    borderRadius:   radius.lg,
    borderWidth:    1,
    borderColor:    colors.border.default,
    backgroundColor: colors.bg.elevated,
  },
  tipsText: {
    flex: 1,
    gap:   2,
  },
  tipsTitle: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  tipsHint: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap:            spacing.md,
  },
});
