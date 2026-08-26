import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Wallet as WalletIcon } from 'lucide-react-native';
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
          {/*
            "Disponível para saque", e não "Saldo": desde que a gorjeta passou a
            cair direto na conta Mercado Pago do músico, o que sobra aqui é o
            cachê já LIBERADO da custódia. Chamar de "saldo" faria a tela
            prometer que tudo que ele recebeu está aqui dentro.
          */}
          <Text style={s.label}>Disponível para saque</Text>
        </View>

        <AnimatedBalance value={wallet.balance} style={s.balance} />

        {/*
          🔴 Custódia NÃO entra no saldo. É cachê recebido e ainda retido até a
          apresentação ser registrada e o prazo de contestação vencer — somar os
          dois ofereceria um saque que o gateway recusa.
        */}
        {wallet.held_balance > 0 && (
          <View style={s.heldRow}>
            <Clock size={13} color={colors.text.muted} />
            <Text style={s.heldText}>
              {wallet.held_balance.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}{' '}
              em custódia, liberado após o show
            </Text>
          </View>
        )}

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
  heldRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  heldText: {
    ...typography.caption,
    color: colors.text.muted,
    flex:  1,
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
