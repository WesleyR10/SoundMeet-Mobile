import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ChordDiagram } from '@/shared/components/ChordDiagram';
import { PianoChordDiagram } from '@/shared/components/PianoChordDiagram';
import type { ChordInstrument } from '@/shared/components/InstrumentToggle';
import { lookupChordDiagram, lookupPianoChordShape } from '@/shared/utils/chord-diagram-lookup';
import { NotePicker } from './NotePicker';

type Props = {
  visible:       boolean;
  initialSymbol?: string | null; // prefill (corrigir um acorde existente)
  instrument:    ChordInstrument;
  preferFlats?:  boolean;
  onConfirm:     (symbol: string) => void;
  onClose:       () => void;
};

// Conjunto v1 do editor. O piano resolve todas por teoria musical; o violão
// usa o dedilhado do chords-db quando a combinação existir.
const QUALITY_OPTIONS: { value: string; label: string }[] = [
  { value: '',     label: 'Maior' },
  { value: 'm',    label: 'Menor' },
  { value: '7',    label: '7' },
  { value: 'maj7', label: 'Maj7' },
  { value: 'm7',   label: 'm7' },
  { value: 'dim',  label: 'Dim' },
  { value: 'aug',  label: 'Aum' },
  { value: 'sus2', label: 'Sus2' },
  { value: 'sus4', label: 'Sus4' },
  { value: '6',    label: '6' },
  { value: 'm6',   label: 'm6' },
  { value: '9',    label: '9' },
  { value: 'm7b5', label: 'm7♭5' },
];

// Seletor raiz + qualidade + baixo opcional, com pré-visualização ao vivo no
// diagrama já existente (ChordDiagram/ PianoChordDiagram) — v1 da correção
// de acorde (ver plano §5). O construtor "toque nota por nota" fica de fora
// de propósito: exigiria reconhecimento reverso (notas → nome), que não
// existe em lugar nenhum do projeto hoje.
const useStyles = makeStyles((colors) => ({
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
    alignItems:          'center',
  },
  title: {
    ...typography.title,
    color:      colors.text.primary,
    alignSelf: 'flex-start',
  },
  symbolPreview: {
    ...typography.chordLive,
    fontSize: 26,
    color:    colors.brand.primary,
  },
  emptyPreview: {
    ...typography.body,
    color:           colors.text.secondary,
    paddingVertical: spacing.lg,
  },
  previewFallback: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewHint: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    alignSelf: 'stretch',
    gap:        spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.6,
    textTransform: 'uppercase',
    color:          colors.text.secondary,
  },
  qualityRow: {
    flexDirection: 'row',
    gap:            spacing.sm,
    paddingVertical: spacing.xs,
  },
  qualityChip: {
    height:            48,
    borderRadius:      radius.full,
    borderWidth:        1,
    borderColor:       colors.border.default,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: spacing.md,
  },
  qualityChipActive: {
    borderColor:      colors.brand.primary,
    backgroundColor: colors.brand.muted,
  },
  qualityLabel: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
  qualityLabelActive: {
    color: colors.brand.primary,
  },
  bassHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  clearLabel: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
  confirmBtn: {
    alignSelf: 'stretch',
    marginTop:  spacing.sm,
  },
}));

export function ChordPickerSheet({ visible, initialSymbol, instrument, preferFlats = false, onConfirm, onClose }: Props) {
  const s = useStyles();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [root, setRoot] = useState('C');
  const [quality, setQuality] = useState('');
  const [bass, setBass] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    // Reseta pro símbolo inicial (ou pro padrão) toda vez que o sheet abre —
    // evita carregar seleção de uma edição anterior.
    const initial = initialSymbol?.trim();
    if (!initial) {
      setRoot('C');
      setQuality('');
      setBass(null);
      return;
    }
    const [chordPart, bassPart] = initial.split('/');
    const rootMatch = chordPart.match(/^([A-Ga-g])(#|b)?/);
    setRoot(rootMatch ? `${rootMatch[1].toUpperCase()}${rootMatch[2] ?? ''}` : 'C');
    const rest = rootMatch ? chordPart.slice(rootMatch[0].length) : '';
    setQuality(QUALITY_OPTIONS.some((q) => q.value === rest) ? rest : '');
    setBass(bassPart ?? null);
  }, [visible, initialSymbol]);

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

  const symbol = `${root}${quality}${bass ? `/${bass}` : ''}`;

  const guitarShape = useMemo(
    () => (instrument === 'guitar' ? lookupChordDiagram(symbol) : null),
    [symbol, instrument],
  );
  const pianoShape = useMemo(
    () => lookupPianoChordShape(symbol),
    [symbol],
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
        <Text style={s.title}>Escolher acorde</Text>

        <Text style={s.symbolPreview}>{symbol}</Text>

        {instrument === 'guitar' && guitarShape?.positions[0] ? (
          <ChordDiagram position={guitarShape.positions[0]} />
        ) : pianoShape ? (
          <View style={s.previewFallback}>
            {instrument === 'guitar' && (
              <Text style={s.previewHint}>Dedilhado de violão indisponível; confira as notas do acorde.</Text>
            )}
          <PianoChordDiagram {...pianoShape} />
          </View>
        ) : (
          <Text style={s.emptyPreview}>Diagrama não disponível pra essa combinação.</Text>
        )}

        <View style={s.section}>
          <Text style={s.sectionLabel}>Nota</Text>
          <NotePicker value={root} onChange={(n) => n && setRoot(n)} preferFlats={preferFlats} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Qualidade</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.qualityRow}>
            {QUALITY_OPTIONS.map((opt) => {
              const active = quality === opt.value;
              return (
                <Pressable
                  key={opt.value || 'major'}
                  onPress={() => setQuality(opt.value)}
                  style={[s.qualityChip, active && s.qualityChipActive]}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[s.qualityLabel, active && s.qualityLabelActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={s.section}>
          <View style={s.bassHeader}>
            <Text style={s.sectionLabel}>Baixo (opcional)</Text>
            {bass !== null && (
              <Pressable onPress={() => setBass(null)} accessibilityRole="button" accessibilityLabel="Remover baixo" hitSlop={8}>
                <Text style={s.clearLabel}>Remover</Text>
              </Pressable>
            )}
          </View>
          <NotePicker value={bass} onChange={setBass} preferFlats={preferFlats} clearable />
        </View>

        <PrimaryButton label="Usar este acorde" onPress={() => onConfirm(symbol)} style={s.confirmBtn} />
      </BottomSheetView>
    </BottomSheetModal>
  );
}
