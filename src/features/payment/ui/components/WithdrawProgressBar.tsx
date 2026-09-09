import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { ArrowUpRight, CheckCircle2, KeyRound } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import type { WithdrawEligibility } from '../../domain/tip.types';
import type { WithdrawBlocker } from '../../domain/withdraw.rules';

type Props = {
  eligibility: WithdrawEligibility;
  /**
   * Por que o saque não pode ser pedido agora, vindo de
   * `getWithdrawAvailability`. `null` = pode.
   *
   * 🔴 Existe porque `WithdrawEligibility` só olha VALOR. Sem chave PIX
   * cadastrada o backend recusa o saque com 422 — e antes deste campo esta
   * barra anunciava "Você já pode sacar!" para quem não tinha destino nenhum,
   * mandando o músico bater numa porta fechada.
   */
  blocker: WithdrawBlocker | null;
  onWithdraw: () => void;
  /** Leva ao lugar onde a chave PIX é cadastrada (edição de perfil). */
  onAddPixKey: () => void;
};

const NEAR_THRESHOLD = 0.85;

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Item 5.5 do roadmap — diferente do precedente estático de BadgeGrid.progressTrack
// (width calculado direto no JSX): aqui a barra anima de verdade via
// useSharedValue + withTiming quando os dados chegam, e ganha glow pulsante
// (mesmo idioma de BadgeGrid.shadowOpacity) quando perto de 100%.
const useStyles = makeStyles((colors) => ({
  card: {
    borderRadius:    radius.lg,
    borderWidth:      1,
    borderColor:     `${colors.accent.coral}30`,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding:          spacing.lg,
    gap:              spacing.sm,
  },
  eligibleCard: {
    gap:         spacing.md,
    borderColor: `${colors.status.success}40`,
  },
  eligibleHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  pixKeyCard: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
    minHeight:      48,
    borderColor:   `${colors.accent.amber}40`,
  },
  eligibleText: {
    ...typography.body,
    color: colors.text.primary,
    flex:  1,
  },
  withdrawBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:              spacing.sm,
    minHeight:        48,
    borderRadius:     radius.md,
    backgroundColor:  colors.status.success,
    paddingVertical:  spacing.md,
  },
  withdrawBtnText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
  },
  actionPressed: { opacity: 0.85 },
  title: {
    ...typography.body,
    color: colors.text.secondary,
  },
  highlight: {
    fontFamily: 'Inter-SemiBold',
    color:      colors.accent.coral,
  },
  track: {
    height:           8,
    borderRadius:     radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow:         'hidden',
  },
  fill: {
    height:           '100%',
    borderRadius:     radius.full,
    backgroundColor: colors.accent.coral,
    shadowColor:      colors.accent.coral,
    shadowOffset:     { width: 0, height: 0 },
    shadowRadius:      10,
    elevation:          4,
  },
  hint: {
    ...typography.caption,
    color: colors.text.muted,
  },
}));

export function WithdrawProgressBar({ eligibility, blocker, onWithdraw, onAddPixKey }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { isEligible, missingAmount, minWithdrawalAmount, withdrawalDays } = eligibility;
  const currentAmount = Math.max(0, minWithdrawalAmount - missingAmount);
  const percentage = minWithdrawalAmount > 0
    ? Math.min(100, (currentAmount / minWithdrawalAmount) * 100)
    : 100;

  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const glow = useSharedValue(0.3);

  useEffect(() => {
    progress.value = withTiming(percentage, { duration: 600, easing: Easing.out(Easing.cubic) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentage]);

  useEffect(() => {
    if (percentage / 100 < NEAR_THRESHOLD || isEligible) return;
    // O glow sinaliza "está quase lá" na barra de saque. Para aceso, não
    // apagado: é informação sobre o dinheiro do músico, não enfeite.
    if (reducedMotion) {
      glow.value = 0.9;
      return;
    }
    glow.value = withDelay(200, withRepeat(withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentage, isEligible, reducedMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    width:         `${progress.value}%`,
    shadowOpacity: glow.value,
  }));

  // Vem ANTES da checagem de valor: sem chave cadastrada não há destino, e
  // falar de saldo aqui mandaria o músico esperar dinheiro entrar quando o que
  // falta é uma linha do perfil. Mesma ordem de `getWithdrawAvailability`.
  if (blocker === 'no-pix-key') {
    return (
      <Pressable
        onPress={onAddPixKey}
        style={({ pressed }) => [s.card, s.pixKeyCard, pressed && s.actionPressed]}
        accessibilityRole="button"
        accessibilityLabel="Cadastrar chave PIX de recebimento"
      >
        <KeyRound size={20} color={colors.accent.amber} />
        <Text style={s.eligibleText}>
          Cadastre sua chave PIX para poder sacar
        </Text>
        <ArrowUpRight size={18} color={colors.text.secondary} />
      </Pressable>
    );
  }

  if (isEligible) {
    return (
      <View style={[s.card, s.eligibleCard]}>
        <View style={s.eligibleHeader}>
          <CheckCircle2 size={20} color={colors.status.success} />
          <Text style={s.eligibleText}>Você já pode sacar! Prazo de até {withdrawalDays} {withdrawalDays === 1 ? 'dia' : 'dias'}.</Text>
        </View>

        <Pressable
          onPress={onWithdraw}
          style={({ pressed }) => [s.withdrawBtn, pressed && s.actionPressed]}
          accessibilityRole="button"
          accessibilityLabel="Sacar para o PIX"
        >
          <ArrowUpRight size={18} color={colors.text.inverse} strokeWidth={2.4} />
          <Text style={s.withdrawBtnText}>Sacar para o PIX</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.card}>
      <Text style={s.title}>
        Você está a <Text style={s.highlight}>{formatBRL(missingAmount)}</Text> de poder sacar
      </Text>

      <View style={s.track}>
        <Animated.View style={[s.fill, fillStyle]} />
      </View>

      <Text style={s.hint}>Saque em até {withdrawalDays} {withdrawalDays === 1 ? 'dia' : 'dias'} após liberado</Text>
    </View>
  );
}
