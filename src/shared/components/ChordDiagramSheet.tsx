import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ChordDiagram } from './ChordDiagram';
import { PianoChordDiagram } from './PianoChordDiagram';
import type { ChordInstrument } from './InstrumentToggle';
import { lookupChordDiagram, lookupPianoChordShape } from '@/shared/utils/chord-diagram-lookup';
import { transposeChordSymbol } from '@/shared/utils/chord-transpose';

type Props = {
  visible:      boolean;
  chordSymbol:  string | null; // símbolo já EXIBIDO (forma, se capotraste ativo)
  instrument:   ChordInstrument;
  // null quando não há capotraste OU instrument !== 'guitar' (capotraste
  // não existe pra teclado — quem chama já garante isso).
  capoFret:     number | null;
  preferFlats?: boolean;
  onClose:      () => void;
};

// Bottom sheet do diagrama de acorde — reusado tanto pelo Play Mode
// (features/musician) quanto pelo visualizador público de repertório
// compartilhado (features/shared-repertoire), por isso vive em shared/ e
// não dentro de uma feature (mesmo motivo de ChordTokenLine ter sido
// promovido — FSD proíbe import cruzado entre features). Mesmo molde de
// InviteMemberSheet.tsx: BottomSheetModal + backdrop + sheetRef via
// present()/dismiss() disparado por um prop `visible`.
//
// Instrumento NÃO é escolhido aqui (era um seletor interno antes) — agora
// vem de fora via prop, escolhido uma vez no ChordSheetControlsSheet e
// valendo pra todos os acordes da música (pedido do usuário: não repetir a
// escolha a cada toque).
export function ChordDiagramSheet({ visible, chordSymbol, instrument, capoFret, preferFlats, onClose }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [positionIndex, setPositionIndex] = useState(0);

  const guitarShape = useMemo(
    () => (chordSymbol && instrument === 'guitar' ? lookupChordDiagram(chordSymbol) : null),
    [chordSymbol, instrument],
  );
  const pianoShape = useMemo(
    () => (chordSymbol && instrument === 'piano' ? lookupPianoChordShape(chordSymbol) : null),
    [chordSymbol, instrument],
  );
  const positions = guitarShape?.positions ?? [];
  const hasMultiplePositions = instrument === 'guitar' && positions.length > 1;
  const currentPosition = positions[positionIndex] ?? positions[0];
  const hasDiagram = instrument === 'guitar' ? !!currentPosition : !!pianoShape;

  // chordSymbol já é a FORMA (capotraste desloca o que é mostrado pra baixo
  // -- ver chord-transpose.ts); o acorde REAL que soa é a forma deslocada de
  // volta pra cima pelo tanto do capotraste.
  const isCapoShape = instrument === 'guitar' && !!capoFret && !!chordSymbol;
  const realChordSymbol = isCapoShape
    ? transposeChordSymbol(chordSymbol!, capoFret!, preferFlats)
    : null;

  useEffect(() => {
    setPositionIndex(0);
  }, [chordSymbol]);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  const goPrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPositionIndex((i) => (i - 1 + positions.length) % positions.length);
  };
  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPositionIndex((i) => (i + 1) % positions.length);
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      enableDynamicSizing
    >
      <BottomSheetView style={s.content}>
        <Text style={s.symbol}>{chordSymbol ?? ''}{isCapoShape ? '*' : ''}</Text>
        {isCapoShape && <Text style={s.capoBadge}>Capotraste na {capoFret}ª casa</Text>}

        {hasDiagram ? (
          <>
            {instrument === 'guitar' && currentPosition ? (
              <ChordDiagram position={currentPosition} />
            ) : (
              pianoShape && <PianoChordDiagram {...pianoShape} />
            )}
            {hasMultiplePositions && (
              <View style={s.pager}>
                <Pressable onPress={goPrev} accessibilityRole="button" accessibilityLabel="Posição anterior" hitSlop={12} style={s.pagerBtn}>
                  <ChevronLeft size={20} color={colors.brand.primary} />
                </Pressable>
                <Text style={s.pagerLabel}>{positionIndex + 1} / {positions.length}</Text>
                <Pressable onPress={goNext} accessibilityRole="button" accessibilityLabel="Próxima posição" hitSlop={12} style={s.pagerBtn}>
                  <ChevronRight size={20} color={colors.brand.primary} />
                </Pressable>
              </View>
            )}
            {isCapoShape && realChordSymbol && (
              <Text style={s.capoCaption}>{realChordSymbol} com forma de {chordSymbol}</Text>
            )}
          </>
        ) : (
          <Text style={s.emptyText}>Diagrama não disponível pra esse acorde.</Text>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  sheetBg: {
    backgroundColor: colors.bg.elevated,
    borderRadius:     radius.xl,
  },
  handle: {
    backgroundColor: colors.border.strong,
  },
  content: {
    alignItems:         'center',
    paddingHorizontal:  spacing.xl,
    paddingBottom:       spacing.xxl,
    gap:                  spacing.sm,
  },
  symbol: {
    ...typography.chordLive,
    fontSize: 26,
    color:    colors.brand.primary,
  },
  capoBadge: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.4,
    color:          colors.accent.amber,
  },
  capoCaption: {
    ...typography.bodySm,
    color:      colors.text.secondary,
    textAlign: 'center',
    marginTop:  spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color:      colors.text.secondary,
    paddingVertical: spacing.xxl,
  },
  pager: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
    marginTop:      spacing.xs,
  },
  pagerBtn: {
    width:          40,
    height:         40,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.muted,
  },
  pagerLabel: {
    ...typography.bodySm,
    color: colors.text.secondary,
    minWidth: 40,
    textAlign: 'center',
  },
});
