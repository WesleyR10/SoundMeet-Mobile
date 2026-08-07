import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { InstrumentToggle, type ChordInstrument } from '@/shared/components/InstrumentToggle';
import { TransposeStepper } from '@/shared/components/TransposeStepper';
import { CapoPicker } from '@/shared/components/CapoPicker';
import type { ChordSheetViewSettings } from '../../domain/personal-chord-sheet.types';
import type { ViewSettingsPatch } from '../../infrastructure/personal-chord-sheet.api';
import { ComplexityToggle } from './ComplexityToggle';
import { AccidentalToggle } from './AccidentalToggle';
import { LeftHandedSwitch } from './LeftHandedSwitch';
import { ScrollSpeedStepper } from './ScrollSpeedStepper';

type Props = {
  visible: boolean;
  value: ChordSheetViewSettings;
  loading?: boolean;
  onSave: (patch: ViewSettingsPatch) => void;
  onClose: () => void;
};

export function PersonalChordSheetSettingsSheet({ visible, value, loading, onSave, onClose }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible, value]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  const instrument: ChordInstrument = draft.instrument === 'keyboard' ? 'piano' : 'guitar';
  const set = <K extends keyof ChordSheetViewSettings>(key: K, next: ChordSheetViewSettings[K]) =>
    setDraft((current) => ({ ...current, [key]: next }));

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      snapPoints={['88%']}
    >
      <BottomSheetScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Ajustes da cifra</Text>
        <Text style={s.hint}>Esses valores ficam salvos como padrão deste fork.</Text>

        <Setting label="Instrumento">
          <InstrumentToggle
            value={instrument}
            onChange={(next) => {
              set('instrument', next === 'piano' ? 'keyboard' : 'guitar');
              if (next === 'piano') set('capo_fret', 0);
            }}
          />
        </Setting>
        <Setting label="Transposição">
          <TransposeStepper value={draft.transpose_semitones} onChange={(next) => set('transpose_semitones', next)} />
        </Setting>
        {instrument === 'guitar' && (
          <Setting label="Capotraste">
            <CapoPicker value={draft.capo_fret || null} onChange={(next) => set('capo_fret', next ?? 0)} />
          </Setting>
        )}
        <Setting label="Complexidade">
          <ComplexityToggle value={draft.chord_complexity} onChange={(next) => set('chord_complexity', next)} />
        </Setting>
        <Setting label="Grafia dos acordes">
          <AccidentalToggle value={draft.preferred_accidental} onChange={(next) => set('preferred_accidental', next)} />
        </Setting>
        <Setting label="Velocidade de rolagem">
          <ScrollSpeedStepper value={draft.scroll_speed} onChange={(next) => set('scroll_speed', next)} />
        </Setting>
        <LeftHandedSwitch value={draft.left_handed} onChange={(next) => set('left_handed', next)} />

        <PrimaryButton label="Salvar como padrão" loading={loading} onPress={() => onSave(draft)} style={s.save} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

function Setting({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  sheetBg: { backgroundColor: colors.bg.elevated, borderRadius: radius.xl },
  handle: { backgroundColor: colors.border.strong },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },
  title: { ...typography.title, color: colors.text.primary },
  hint: { ...typography.bodySm, color: colors.text.secondary, marginTop: -spacing.sm },
  section: { gap: spacing.sm },
  label: {
    ...typography.caption, fontFamily: 'Inter-Bold', color: colors.text.secondary,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  save: { marginTop: spacing.sm },
});
