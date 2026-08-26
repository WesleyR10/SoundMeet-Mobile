import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { CircleStop, Disc3, Lightbulb, Radio } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { extractApiMessage } from '@/shared/services/http/types';
import { useLiveSetStore } from '../../application/liveSet.store';
import {
  useOpenableEvents,
  usePerformance,
  usePerformanceControl,
} from '../../application/usePerformance';

type Props = {
  /** Chamado ao encerrar, com o id do set — a tela navega para o relatório. */
  onEnded?: (performanceId: string) => void;
  /** Abre o setlist sugerido daquela casa (F5). */
  onPressSuggestions?: (establishmentId: string) => void;
};

/**
 * O interruptor do show.
 *
 * 🔴 **Enquanto não há set aberto, o Play Mode é privado.** Este controle é o
 * único lugar que o liga. Registro automático a cada música aberta no Play Mode
 * transformaria a rotina de estudo em histórico público e envenenaria currículo,
 * relatório e setlist com a mesma música repetida 14 vezes numa tarde de quarta.
 *
 * Três estados:
 * - **sem show na janela** → nada é renderizado (nem convite, nem erro);
 * - **show disponível** → botão de iniciar por evento;
 * - **set aberto** → o que está tocando, contador de músicas e encerrar.
 */
export function LiveSetControl({ onEnded, onPressSuggestions }: Props) {
  const activeSet = useLiveSetStore((s) => s.activeSet);
  const clearActiveSet = useLiveSetStore((s) => s.clearActiveSet);
  const [error, setError] = useState<string | null>(null);

  // Só consulta shows disponíveis quando NÃO há set aberto — com o show no ar,
  // a pergunta "em qual show abrir?" não existe.
  const { data: openable } = useOpenableEvents(!activeSet);
  const { data: performance } = usePerformance(activeSet?.performanceId ?? null);
  const { start, end } = usePerformanceControl();

  async function handleStart(eventId: string, bandId: string | null) {
    setError(null);
    try {
      await start.mutateAsync({
        event_id: eventId,
        ...(bandId ? { band_id: bandId } : {}),
      });
    } catch (err) {
      setError(extractApiMessage(err));
    }
  }

  async function handleEnd() {
    if (!activeSet) return;
    setError(null);
    const performanceId = activeSet.performanceId;
    try {
      await end.mutateAsync(performanceId);
      onEnded?.(performanceId);
    } catch (err) {
      // Set que sumiu do servidor (apagado, ou já encerrado em outro aparelho)
      // não pode deixar o app preso num show que não existe mais: limpa o
      // estado local e segue.
      const message = extractApiMessage(err);
      if (message.toLowerCase().includes('não encontrad')) {
        clearActiveSet();
        return;
      }
      setError(message);
    }
  }

  if (activeSet) {
    const current = performance?.current_song ?? null;
    const count = performance?.songs_count ?? 0;

    return (
      <View style={[s.card, s.cardLive]}>
        <View style={s.badgeRow}>
          <View style={s.dot} />
          <Text style={s.badgeText}>SHOW NO AR</Text>
          <Text style={s.counter}>
            {count} {count === 1 ? 'música' : 'músicas'}
          </Text>
        </View>

        {current ? (
          <>
            <Text style={s.songTitle} numberOfLines={1}>
              {current.title}
            </Text>
            <Text style={s.songArtist} numberOfLines={1}>
              {current.artist}
            </Text>
          </>
        ) : (
          <Text style={s.idle}>
            Abra uma música no Repertório para o público ver o que você está
            tocando.
          </Text>
        )}

        {!!onPressSuggestions && (
          <Pressable
            onPress={() => onPressSuggestions(activeSet.establishmentId)}
            style={s.suggestBtn}
            accessibilityRole="button"
            accessibilityLabel="Ver setlist sugerido para esta casa"
          >
            <Lightbulb size={15} color={colors.brand.primary} />
            <Text style={s.suggestText}>Setlist sugerido para esta casa</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleEnd}
          disabled={end.isPending}
          style={s.endBtn}
          accessibilityRole="button"
          accessibilityLabel="Encerrar show"
        >
          {end.isPending ? (
            <ActivityIndicator color={colors.text.secondary} />
          ) : (
            <>
              <CircleStop size={17} color={colors.text.secondary} />
              <Text style={s.endText}>Encerrar show</Text>
            </>
          )}
        </Pressable>

        {!!error && <ErrorBanner message={error} />}
      </View>
    );
  }

  const events = openable?.events ?? [];
  if (events.length === 0) return null;

  return (
    <View style={s.card}>
      <View style={s.badgeRow}>
        <Radio size={14} color={colors.brand.primary} />
        <Text style={s.readyText}>
          {events.length === 1 ? 'Show de hoje' : 'Shows de hoje'}
        </Text>
      </View>

      {events.map((event) => (
        <Pressable
          key={event.event_id}
          onPress={() => handleStart(event.event_id, event.band_id)}
          disabled={start.isPending}
          style={s.startBtn}
          accessibilityRole="button"
          accessibilityLabel={`Iniciar show em ${event.name}`}
        >
          {start.isPending ? (
            <ActivityIndicator color={colors.bg.primary} />
          ) : (
            <>
              <Disc3 size={17} color={colors.bg.primary} />
              <Text style={s.startText} numberOfLines={1}>
                {event.live_performance_id ? 'Voltar ao show' : 'Iniciar'} ·{' '}
                {event.name}
              </Text>
            </>
          )}
        </Pressable>
      ))}

      {!!error && <ErrorBanner message={error} />}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    gap:               spacing.sm,
    marginHorizontal:  spacing.xl,
    marginBottom:      spacing.lg,
    padding:           spacing.lg,
    borderRadius:      radius.xl,
    borderWidth:       1,
    borderColor:       colors.border.default,
    backgroundColor:   colors.bg.elevated,
  },
  cardLive: {
    borderColor: colors.border.brand,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  dot: {
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: colors.status.live,
  },
  badgeText: {
    ...typography.caption,
    fontFamily:    'Inter-SemiBold',
    letterSpacing: 1,
    color:         colors.status.live,
  },
  readyText: {
    ...typography.caption,
    fontFamily:    'Inter-SemiBold',
    letterSpacing: 1,
    color:         colors.brand.primary,
  },
  counter: {
    ...typography.caption,
    color:      colors.text.muted,
    marginLeft: 'auto',
  },
  songTitle: {
    ...typography.liveBody,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  songArtist: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  idle: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
  startBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:              spacing.sm,
    minHeight:        48,
    paddingHorizontal: spacing.lg,
    borderRadius:     radius.full,
    backgroundColor:  colors.brand.primary,
  },
  startText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.bg.primary,
    flexShrink: 1,
  },
  suggestBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.sm,
    minHeight:       48,
    borderRadius:    radius.full,
    borderWidth:     1,
    borderColor:     colors.border.brand,
  },
  suggestText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
  endBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.sm,
    minHeight:       48,
    borderRadius:    radius.full,
    borderWidth:     1,
    borderColor:     colors.border.strong,
  },
  endText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
});
