import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CheckCircle2, Link2, Music4 } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { GlowCard } from '@/shared/components/GlowCard';

type Props = {
  linked:       boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  onConnect:    () => void;
  onDisconnect: () => void;
};

/**
 * Vínculo com o Spotify — "gostei ao vivo, salva pra mim".
 *
 * Molde de `MercadoPagoLinkCard`, com **um tom deliberadamente diferente**: lá
 * o estado desconectado é um AVISO em âmbar, porque sem vínculo o músico
 * simplesmente não recebe dinheiro. Aqui é um convite em teal — não conectar
 * não quebra nada, só deixa de oferecer uma comodidade. Tratar as duas coisas
 * com a mesma urgência visual gastaria o alarme onde ele não é preciso.
 */
export function SpotifyLinkCard({
  linked,
  isConnecting,
  isDisconnecting,
  onConnect,
  onDisconnect,
}: Props) {
  if (linked) {
    return (
      <GlowCard accentColor={colors.status.success} style={s.card}>
        <View style={s.headerRow}>
          <CheckCircle2 size={18} color={colors.status.success} />
          <Text style={s.titleOk}>Spotify conectado</Text>
        </View>

        <Text style={s.body}>
          Quando você pedir uma música no show, dá pra salvá-la na sua biblioteca
          com um toque.
        </Text>

        <Pressable
          onPress={onDisconnect}
          disabled={isDisconnecting}
          style={s.unlinkRow}
          accessibilityRole="button"
          accessibilityLabel="Desconectar conta Spotify"
          accessibilityState={{ disabled: isDisconnecting }}
          hitSlop={8}
        >
          <Text style={s.unlinkText}>
            {isDisconnecting ? 'Desconectando…' : 'Desconectar'}
          </Text>
        </Pressable>
      </GlowCard>
    );
  }

  return (
    <GlowCard accentColor={colors.brand.primary} style={s.card}>
      <View style={s.headerRow}>
        <Music4 size={18} color={colors.brand.primary} />
        <Text style={s.title}>Salvar as músicas que você ouve</Text>
      </View>

      <Text style={s.body}>
        Conecte seu Spotify e guarde na sua biblioteca as músicas que descobrir
        nos shows. A gente só salva o que você confirmar.
      </Text>

      <Pressable
        onPress={onConnect}
        disabled={isConnecting}
        style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Conectar conta Spotify"
        accessibilityState={{ disabled: isConnecting }}
      >
        <Link2 size={16} color={colors.text.inverse} />
        <Text style={s.buttonText}>
          {isConnecting ? 'Abrindo…' : 'Conectar Spotify'}
        </Text>
      </Pressable>
    </GlowCard>
  );
}

const s = StyleSheet.create({
  card: {
    gap:     spacing.sm,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
  },
  title: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
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
    gap:             spacing.sm,
    minHeight:       48,
    borderRadius:    radius.xl,
    backgroundColor: colors.brand.primary,
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
  unlinkRow: {
    minHeight:      48,
    justifyContent: 'center',
  },
  unlinkText: {
    ...typography.bodySm,
    color:              colors.text.muted,
    textDecorationLine: 'underline',
  },
});
