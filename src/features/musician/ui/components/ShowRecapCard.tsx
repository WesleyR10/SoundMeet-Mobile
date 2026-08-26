import { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { PerformanceReport } from '@/shared/services/performance/performance.types';

/** Quantas músicas cabem no card sem virar lista — o resto vira "+ N". */
const SONGS_ON_CARD = 4;

export type ShowRecapCardHandle = {
  capture: () => Promise<string>;
};

type Props = {
  report: PerformanceReport;
  /** Nome artístico. `null` enquanto o perfil carrega — a linha some, não vira placeholder. */
  musicianName: string | null;
  /**
   * 🔴 Opt-in explícito. Ver a nota de renda em `ShowRecapSection`: o total de
   * gorjetas é receita do músico, e este card existe para ir ao Instagram.
   */
  showTips: boolean;
};

/**
 * Card compartilhável do pós-show (B1) — o relatório vira imagem postável.
 *
 * ## Por que o card e o relatório não mostram as mesmas coisas
 *
 * O relatório é privado e serve para o músico entender o show; o card é
 * público e serve para provar que ele aconteceu. Três diferenças nascem daí:
 *
 * - **Gorjeta é opt-in** (`showTips`), nunca padrão. Renda do músico não vaza
 *   por descuido de um toque em "Compartilhar" — mesma razão pela qual o
 *   currículo verificado (F4) não expõe cachê.
 * - **A atribuição de gorjeta por música não entra**, em nenhuma hipótese. No
 *   relatório ela viaja rotulada como estimativa (`tips_attribution_note`);
 *   num card sem espaço para a ressalva, "esta música rendeu R$ 40" viraria
 *   afirmação — exatamente o que o backend recusa a dizer.
 * - **Pedidos recusados não aparecem.** É dado de operação, não de vitrine.
 *
 * ## Sem imagem remota, de propósito
 *
 * Diferente de `QRShareCard`, este card não carrega logo nem avatar: `<Image>`
 * resolve de forma assíncrona e o ViewShot não espera esse load, então uma
 * captura logo após abrir a tela sairia com o buraco no lugar da foto. Tudo
 * aqui é texto e cor — a captura é síncrona e sempre completa.
 */
export const ShowRecapCard = forwardRef<ShowRecapCardHandle, Props>(
  function ShowRecapCard({ report, musicianName, showTips }, ref) {
    const viewShotRef = useRef<ViewShotRef>(null);

    useImperativeHandle(ref, () => ({
      capture: async () => {
        if (!viewShotRef.current?.capture) {
          throw new Error('Card do show não está pronto para captura.');
        }
        return viewShotRef.current.capture();
      },
    }));

    const songs = report.songs.slice(0, SONGS_ON_CARD);
    const remaining = report.songs.length - songs.length;

    return (
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
        <View style={s.card}>
          <View style={s.header}>
            <View style={s.dot} />
            <Text style={s.eyebrow}>SHOW AO VIVO</Text>
          </View>

          {!!report.establishment_name && (
            <Text style={s.venue} numberOfLines={2}>
              {report.establishment_name}
            </Text>
          )}
          <Text style={s.date}>{formatCardDate(report.started_at)}</Text>

          <View style={s.stats}>
            <Stat value={String(report.songs_count)} label={report.songs_count === 1 ? 'música' : 'músicas'} />
            <Stat value={String(report.requests_played)} label="pedidos atendidos" />
            <Stat value={String(report.attendees_count)} label="na plateia" />
            {showTips && <Stat value={formatBRL(report.tips_total)} label="em gorjetas" />}
          </View>

          {songs.length > 0 && (
            <View style={s.setlist}>
              <Text style={s.setlistTitle}>NO SETLIST</Text>
              {songs.map((song) => (
                <Text key={song.id} style={s.song} numberOfLines={1}>
                  {song.title} <Text style={s.songArtist}>· {song.artist}</Text>
                </Text>
              ))}
              {remaining > 0 && (
                <Text style={s.songMore}>
                  + {remaining} {remaining === 1 ? 'música' : 'músicas'}
                </Text>
              )}
            </View>
          )}

          <View style={s.footer}>
            {!!musicianName && (
              <Text style={s.musician} numberOfLines={1}>
                {musicianName}
              </Text>
            )}
            <Text style={s.brand}>SoundMeet</Text>
          </View>
        </View>
      </ViewShot>
    );
  },
);

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function formatCardDate(startedAt: string): string {
  return new Date(startedAt).toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  });
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const s = StyleSheet.create({
  card: {
    gap:             spacing.md,
    padding:         spacing.xl,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.border.brand,
    // Fundo opaco e explícito: o ViewShot captura o que está pintado, e um
    // card transparente sairia com o fundo da tela por baixo.
    backgroundColor: colors.bg.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  dot: {
    width:           8,
    height:          8,
    borderRadius:    radius.full,
    backgroundColor: colors.status.live,
  },
  eyebrow: {
    ...typography.caption,
    letterSpacing: 1.2,
    color:         colors.text.brand,
  },
  venue: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  date: {
    ...typography.bodySm,
    color:     colors.text.secondary,
    marginTop: -spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.md,
    marginTop:      spacing.xs,
  },
  stat: {
    // 4 stats em 2 colunas quando a gorjeta entra; 3 em 2 linhas quando não.
    width: '47%',
    gap:    2,
  },
  statValue: {
    ...typography.title,
    color: colors.brand.primary,
  },
  statLabel: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  setlist: {
    gap:             spacing.xs,
    paddingTop:      spacing.md,
    borderTopWidth:  1,
    borderTopColor:  colors.border.default,
  },
  setlistTitle: {
    ...typography.caption,
    letterSpacing: 1.2,
    color:         colors.text.muted,
    marginBottom:  spacing.xs,
  },
  song: {
    ...typography.body,
    color: colors.text.primary,
  },
  songArtist: {
    color: colors.text.secondary,
  },
  songMore: {
    ...typography.bodySm,
    color:     colors.text.muted,
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:             spacing.md,
    paddingTop:      spacing.md,
    borderTopWidth:  1,
    borderTopColor:  colors.border.default,
  },
  musician: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
    flexShrink: 1,
  },
  brand: {
    ...typography.caption,
    letterSpacing: 1.4,
    color:         colors.text.brand,
  },
});
