import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { CalendarSync, CheckCircle2 } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { GlowCard } from '@/shared/components/GlowCard';
import {
  useConnectGoogleCalendar,
  useDisconnectGoogleCalendar,
  useGoogleCalendarStatus,
} from '../../application/useGoogleCalendar';
import { connectOutcomeMessage } from '../../domain/google-calendar.rules';

type Props = { musicianId: string | null };

/**
 * A porta de entrada do Google Agenda (backend 7.18, jul/2026 — UI 24/set/2026).
 *
 * O backend inteiro existia desde julho: OAuth, tokens cifrados, sync por fila,
 * 93 testes. O que não existia era ISTO — `connect`/`status`/`DELETE` não tinham
 * um chamador em nenhum cliente, então o músico não tinha como conectar nada.
 *
 * ## Por que o estado desconectado NÃO é um alerta
 *
 * O `MercadoPagoLinkCard` grita em âmbar quando não há vínculo, e está certo:
 * sem conta conectada o músico **não recebe gorjeta**, a falha é do produto.
 * Aqui não há nada quebrado — a agenda do app funciona sozinha, e o Google é
 * conveniência. Pintar isto de amarelo ensinaria o músico a ignorar o amarelo
 * que importa.
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
  account: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  note: {
    ...typography.caption,
    color: colors.text.muted,
  },
  message: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
  button: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:              spacing.sm,
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
  linkButton: {
    minHeight:      48,
    justifyContent: 'center',
  },
  linkButtonText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.muted,
  },
}));

export function GoogleCalendarCard({ musicianId }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const [message, setMessage] = useState<string | null>(null);

  const statusQuery = useGoogleCalendarStatus(musicianId);
  const connect     = useConnectGoogleCalendar(musicianId);
  const disconnect  = useDisconnectGoogleCalendar(musicianId);

  const status = statusQuery.data;

  const handleConnect = async () => {
    if (!musicianId) return;
    setMessage(null);
    try {
      const outcome = await connect.mutateAsync();
      setMessage(connectOutcomeMessage(outcome));
    } catch {
      // Falhou antes mesmo de abrir o navegador (rede, 4xx no /connect).
      setMessage('Não deu para abrir a autorização do Google. Tente de novo.');
    }
  };

  /*
   * Desconectar pede confirmação porque o efeito é silencioso: nada some da
   * tela, e o músico só descobriria meses depois que os shows pararam de
   * aparecer no calendário dele.
   */
  const handleDisconnect = () => {
    if (!musicianId) return;
    Alert.alert(
      'Desconectar Google Agenda',
      'Seus próximos shows deixam de aparecer no Google. Os eventos já criados continuam lá.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            setMessage(null);
            try {
              await disconnect.mutateAsync();
            } catch {
              setMessage('Não deu para desconectar agora. Tente de novo.');
            }
          },
        },
      ],
    );
  };

  const isLoading       = statusQuery.isPending;
  const isConnecting    = connect.isPending;
  const isDisconnecting = disconnect.isPending;

  /*
   * ⚠️ Sessão sem `musician_id` não renderiza nada. Com a query `enabled:
   * false`, o TanStack Query v5 mantém `status: 'pending'` para sempre — o
   * card ficaria com o spinner girando eternamente no rodapé da agenda.
   */
  if (!musicianId) return null;

  /*
   * Enquanto o status não chega, o card não afirma nada. Renderizar "Conectar"
   * por padrão faria quem JÁ conectou ver um convite para conectar de novo a
   * cada abertura da tela — e reconectar dispara `prompt=consent` no Google à
   * toa.
   */
  if (isLoading || !status) {
    return (
      <GlowCard style={s.card} animated={false}>
        <View style={s.headerRow}>
          <CalendarSync size={18} color={colors.text.muted} />
          <Text style={s.title}>Google Agenda</Text>
          <ActivityIndicator size="small" color={colors.text.muted} />
        </View>
      </GlowCard>
    );
  }

  if (status.connected) {
    return (
      <GlowCard accentColor={colors.status.success} style={s.card} animated={false}>
        <View style={s.headerRow}>
          <CheckCircle2 size={18} color={colors.status.success} />
          <Text style={s.titleOk}>Google Agenda conectada</Text>
        </View>

        {status.google_account_email ? (
          <Text style={s.account}>{status.google_account_email}</Text>
        ) : null}

        <Text style={s.body}>
          Todo show confirmado aqui vira um evento na sua agenda. Se o show for
          cancelado, o evento some.
        </Text>
        <Text style={s.note}>
          Show de banda entra só na agenda de quem é líder.
        </Text>

        {message ? <Text style={s.message}>{message}</Text> : null}

        <Pressable
          onPress={handleDisconnect}
          disabled={isDisconnecting}
          style={s.linkButton}
          accessibilityRole="button"
          accessibilityLabel="Desconectar Google Agenda"
          accessibilityState={{ disabled: isDisconnecting }}
        >
          <Text style={s.linkButtonText}>
            {isDisconnecting ? 'Desconectando…' : 'Desconectar'}
          </Text>
        </Pressable>
      </GlowCard>
    );
  }

  return (
    <GlowCard style={s.card} animated={false}>
      <View style={s.headerRow}>
        <CalendarSync size={18} color={colors.brand.primary} />
        <Text style={s.title}>Google Agenda</Text>
      </View>

      <Text style={s.body}>
        Conecte e seus shows confirmados entram sozinhos no seu calendário —
        junto com os compromissos que você já tem fora do SoundMeet.
      </Text>
      <Text style={s.note}>
        A gente só escreve os seus shows. Não lemos o resto da sua agenda.
      </Text>

      {message ? <Text style={s.message}>{message}</Text> : null}

      <Pressable
        onPress={handleConnect}
        disabled={isConnecting}
        style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Conectar Google Agenda"
        accessibilityState={{ disabled: isConnecting }}
      >
        <CalendarSync size={16} color={colors.text.inverse} />
        <Text style={s.buttonText}>
          {isConnecting ? 'Abrindo…' : 'Conectar'}
        </Text>
      </Pressable>
    </GlowCard>
  );
}
