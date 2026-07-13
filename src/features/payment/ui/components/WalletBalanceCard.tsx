import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Wallet as WalletIcon } from 'lucide-react-native';
import { colors, spacing, radius, typography, gradients, shadows } from '@/shared/design-system/tokens';
import { AnimatedBalance } from '@/shared/components/AnimatedBalance';
import type { Wallet } from '../../domain/tip.types';

type Props = {
  wallet: Wallet;
};

// Hero da WalletScreen — saldo em destaque com contador animado (AnimatedBalance,
// sem precedente no projeto) + anel de gradiente energy (coral→magenta, mesmo
// idioma de HomeHeader/gradients.premium, mas na paleta de gorjetas) + sombra
// coral pulsante-por-elevação (shadows.coral). "3D": profundidade via sombra +
// gradiente diagonal, mesma filosofia hand-rolled do resto do app.
export function WalletBalanceCard({ wallet }: Props) {
  return (
    <LinearGradient
      colors={gradients.energy}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.ring}
    >
      <View style={[s.inner, shadows.coral]}>
        <View style={s.headerRow}>
          <View style={s.iconBox}>
            <WalletIcon size={18} color={colors.accent.coral} />
          </View>
          <Text style={s.label}>Saldo disponível</Text>
        </View>

        <AnimatedBalance value={wallet.balance} style={s.balance} />

        <View style={s.statsRow}>
          <MiniStat label="Recebido" value={wallet.total_earned} />
          <View style={s.statDivider} />
          <MiniStat label="Sacado" value={wallet.total_withdrawn} />
        </View>
      </View>
    </LinearGradient>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  const formatted = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return (
    <View style={s.miniStat}>
      <Text style={s.miniStatValue}>{formatted}</Text>
      <Text style={s.miniStatLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  ring: {
    borderRadius: radius.xl,
    padding:      1.5,
  },
  inner: {
    borderRadius:    radius.xl - 1.5,
    backgroundColor: colors.bg.surface,
    padding:         spacing.xl,
    gap:             spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
  },
  iconBox: {
    width:            32,
    height:           32,
    borderRadius:     radius.md,
    backgroundColor: `${colors.accent.coral}20`,
    alignItems:      'center',
    justifyContent:  'center',
  },
  label: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  balance: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.md,
    marginTop:     spacing.xs,
  },
  statDivider: {
    width:           1,
    height:          28,
    backgroundColor: colors.border.default,
  },
  miniStat: {
    gap: 2,
  },
  miniStatValue: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  miniStatLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
