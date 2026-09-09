import { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

export type TipReceiptCardHandle = {
  capture: () => Promise<string>;
};

type Props = {
  amount:      number;
  songTitle:   string | null;
  dedication:  string | null;
  musicianName: string | null;
  fanName:     string | null;
  /**
   * 🔴 Opt-in explícito, padrão desligado.
   *
   * Mesma postura do `ShowRecapCard`: o recibo é do fã, mas quanto alguém
   * gastou é dado financeiro, e este card existe para ir ao Instagram.
   * Publicar o valor por padrão transformaria "compartilhar" em "divulgar
   * quanto paguei".
   */
  showAmount: boolean;
};

/**
 * O recibo compartilhável da gorjeta — o momento vira imagem postável.
 *
 * ## Sem imagem remota, de propósito
 *
 * Mesma lição registrada no `ShowRecapCard`: `<Image>` resolve de forma
 * assíncrona e o ViewShot **não espera** esse load, então uma captura logo
 * depois de abrir a tela sairia com um buraco no lugar da foto. Tudo aqui é
 * texto e cor — a captura é síncrona e sempre completa.
 *
 * ## O que o card mostra, e o que não mostra
 *
 * A dedicatória é o centro: é ela que dá sentido público ao gesto. O valor é
 * opt-in. O nome do fã respeita o anonimato escolhido na gorjeta.
 */
export const TipReceiptCard = forwardRef<TipReceiptCardHandle, Props>(
  function TipReceiptCard(
    { amount, songTitle, dedication, musicianName, fanName, showAmount },
    ref,
  ) {
    const viewShotRef = useRef<ViewShotRef>(null);

    useImperativeHandle(ref, () => ({
      capture: async () => {
        if (!viewShotRef.current?.capture) {
          throw new Error('O recibo ainda não está pronto para captura.');
        }
        return viewShotRef.current.capture();
      },
    }));

    return (
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
        <View style={s.card}>
          <View style={s.header}>
            <View style={s.dot} />
            <Text style={s.eyebrow}>PEDIDO NO PALCO</Text>
          </View>

          {!!songTitle && (
            <Text style={s.song} numberOfLines={2}>
              {songTitle}
            </Text>
          )}

          {!!musicianName && (
            <Text style={s.musician} numberOfLines={1}>
              por {musicianName}
            </Text>
          )}

          {!!dedication && (
            <View style={s.dedicationBox}>
              <Text style={s.dedicationMark}>“</Text>
              <Text style={s.dedication} numberOfLines={4}>
                {dedication}
              </Text>
            </View>
          )}

          {showAmount && (
            <Text style={s.amount}>
              R$ {amount.toFixed(2).replace('.', ',')}
            </Text>
          )}

          <View style={s.footer}>
            <Text style={s.fan} numberOfLines={1}>
              {fanName?.trim() || 'Um fã'}
            </Text>
            <Text style={s.brand}>SoundMeet</Text>
          </View>
        </View>
      </ViewShot>
    );
  },
);

const s = StyleSheet.create({
  card: {
    width:           320,
    padding:          spacing.xl,
    borderRadius:     radius.xl,
    backgroundColor:  colors.bg.surface,
    borderWidth:      1,
    borderColor:     `${colors.accent.coral}44`,
    gap:              spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  dot: {
    width:           7,
    height:          7,
    borderRadius:    radius.full,
    backgroundColor: colors.accent.coral,
  },
  eyebrow: {
    ...typography.caption,
    color:         colors.accent.coral,
    letterSpacing: 1.2,
  },
  song: {
    ...typography.displayMd,
    fontSize:   26,
    lineHeight: 31,
    color:      colors.text.primary,
    marginTop:  spacing.sm,
  },
  musician: {
    ...typography.body,
    color: colors.text.secondary,
  },
  dedicationBox: {
    marginTop:        spacing.lg,
    paddingLeft:      spacing.md,
    borderLeftWidth:  3,
    borderLeftColor:  colors.accent.coral,
  },
  dedicationMark: {
    ...typography.displayLg,
    color:       `${colors.accent.coral}66`,
    lineHeight:  30,
    marginBottom: -spacing.sm,
  },
  dedication: {
    ...typography.bodyLg,
    color:      colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  amount: {
    ...typography.displayMd,
    color:     colors.accent.coral,
    marginTop: spacing.lg,
  },
  footer: {
    marginTop:       spacing.xl,
    paddingTop:      spacing.md,
    borderTopWidth:  1,
    borderTopColor:  colors.border.default,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  fan: {
    ...typography.bodySm,
    flex:  1,
    color: colors.text.secondary,
  },
  brand: {
    ...typography.caption,
    color:         colors.text.brand,
    letterSpacing: 1,
  },
});
