import { useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { InstrumentToggle, type ChordInstrument } from './InstrumentToggle';
import { TransposeStepper } from './TransposeStepper';
import { CapoPicker } from './CapoPicker';

type Props = {
  visible:             boolean;
  onClose:              () => void;
  instrument:          ChordInstrument;
  onChangeInstrument:  (value: ChordInstrument) => void;
  transposeSemitones:  number;
  onChangeTranspose:   (value: number) => void;
  capoFret:            number | null;
  onChangeCapo:        (value: number | null) => void;
};

// Sheet único de ajustes da folha de cifra — instrumento, tom e capotraste
// (capotraste escondido quando instrumento = teclado, não existe capo de
// teclado). Aberto pelo botão de ajustes na PlayModeTopBar/header do
// visualizador compartilhado; escolha de instrumento aqui vale pra TODOS os
// acordes da música (diferente do ChordDiagramSheet, que não tem mais
// seletor próprio — só exibe no instrumento já escolhido aqui).
export function ChordSheetControlsSheet({
  visible, onClose,
  instrument, onChangeInstrument,
  transposeSemitones, onChangeTranspose,
  capoFret, onChangeCapo,
}: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);

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
        <Text style={s.title}>Ajustes da cifra</Text>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Instrumento</Text>
          <InstrumentToggle value={instrument} onChange={onChangeInstrument} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Tom</Text>
          <TransposeStepper value={transposeSemitones} onChange={onChangeTranspose} />
        </View>

        {instrument === 'guitar' && (
          <View style={s.section}>
            <View style={s.capoHeader}>
              <Text style={s.sectionLabel}>Capotraste</Text>
              {capoFret !== null && (
                <Pressable onPress={() => onChangeCapo(null)} accessibilityRole="button" accessibilityLabel="Remover capotraste" hitSlop={8}>
                  <Text style={s.clearLabel}>Remover</Text>
                </Pressable>
              )}
            </View>
            <CapoPicker value={capoFret} onChange={onChangeCapo} />
          </View>
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
    paddingHorizontal: spacing.xl,
    paddingBottom:      spacing.xxl,
    gap:                 spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.6,
    textTransform: 'uppercase',
    color:          colors.text.secondary,
  },
  capoHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  clearLabel: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
});
