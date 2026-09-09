import { View, Text, Pressable } from 'react-native';
import { CheckCircle2, Link2, TriangleAlert } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { GlowCard } from '@/shared/components/GlowCard';

type Props = {
  linked:      boolean;
  onConnect:   () => void;
  isConnecting: boolean;
};

/**
 * O vínculo que faz a gorjeta chegar.
 *
 * 🔴 **Sem conta conectada o músico simplesmente não recebe gorjeta.** A
 * cobrança é criada na conta Mercado Pago DELE (a plataforma nunca detém o
 * dinheiro), então sem vínculo não há para onde o valor ir — o fã tentaria e
 * falharia. Por isso o estado desconectado é um aviso, e não uma sugestão
 * discreta.
 *
 * E é por isso também que a gorjeta **não tem saque por aqui**: o valor já cai
 * na conta dele, na hora. O saque desta tela é do cachê liberado da custódia.
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
  titleWarn: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.accent.amber,
    flex:       1,
  },
  titleOk: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.status.success,
    flex:       1,
  },
  body: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  button: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:              spacing.sm,
    minHeight:       48,
    borderRadius:    radius.xl,
    backgroundColor: colors.accent.amber,
    marginTop:       spacing.xs,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
  },
}));

export function MercadoPagoLinkCard({ linked, onConnect, isConnecting }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  if (linked) {
    return (
      <GlowCard accentColor={colors.status.success} style={s.card}>
        <View style={s.headerRow}>
          <CheckCircle2 size={18} color={colors.status.success} />
          <Text style={s.titleOk}>Conta conectada</Text>
        </View>
        <Text style={s.body}>
          As gorjetas caem direto na sua conta Mercado Pago, na hora. O saque de
          gorjeta é feito por lá.
        </Text>
      </GlowCard>
    );
  }

  return (
    <GlowCard accentColor={colors.accent.amber} style={s.card}>
      <View style={s.headerRow}>
        <TriangleAlert size={18} color={colors.accent.amber} />
        <Text style={s.titleWarn}>Você ainda não recebe gorjetas</Text>
      </View>

      <Text style={s.body}>
        Conecte sua conta Mercado Pago para receber. O dinheiro cai direto na sua
        conta, na hora — a SoundMeet nunca fica com ele.
      </Text>

      <Pressable
        onPress={onConnect}
        disabled={isConnecting}
        style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Conectar conta Mercado Pago"
        accessibilityState={{ disabled: isConnecting }}
      >
        <Link2 size={16} color={colors.text.inverse} />
        <Text style={s.buttonText}>
          {isConnecting ? 'Abrindo…' : 'Conectar Mercado Pago'}
        </Text>
      </Pressable>
    </GlowCard>
  );
}
