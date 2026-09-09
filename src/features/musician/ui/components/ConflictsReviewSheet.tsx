import { useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, BottomSheetFlatList, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { AlertTriangle } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import type { OverlayOutcome, OverlayConflictReason } from '../../domain/personal-chord-sheet.types';

type Props = {
  visible:          boolean;
  outcomes:         OverlayOutcome[];
  discardingEditId?: string | null;
  onDiscard?:       (editId: string) => void;
  onClose:          () => void;
};

// Copy humana pra cada motivo de conflito — ver applyChordEdits/outcomes no
// backend (chord-sheet-overlay-applier.ts). `matched_start_ms` não é
// exibido: é um detalhe de debug, não ajuda o músico a decidir o que fazer.
const REASON_LABEL: Record<OverlayConflictReason, string> = {
  anchor_not_found:  'Não encontramos onde essa correção deveria entrar.',
  symbol_mismatch:   'O acorde original mudou desde que você corrigiu.',
  ambiguous_match:   'Mais de um lugar possível pra essa correção.',
  unparseable_symbol: 'Esse símbolo de acorde não é reconhecido.',
  out_of_range:       'Essa correção ficou fora do tempo da música.',
};

// outcomes vem do GET .../chord-sheet (view) — nunca do POST .../edits, ver
// plano §6. Cada linha oferece "Descartar" (DELETE .../edits/:edit_id),
// única ação disponível: não há "reaplicar automaticamente" porque o
// conflito por definição significa que o backend não sabe onde a correção
// deveria ir.
const useStyles = makeStyles((colors) => ({
  sheetBg: {
    backgroundColor: colors.bg.elevated,
    borderRadius:     radius.xl,
  },
  handle: {
    backgroundColor: colors.border.strong,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom:      spacing.md,
    gap:                 spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  hint: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxl,
    gap:                spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
    borderRadius:  radius.lg,
    borderWidth:    1,
    borderColor:   `${colors.accent.coral}40`,
    backgroundColor: `${colors.accent.coral}0F`,
    padding:        spacing.md,
  },
  rowText: {
    flex: 1,
    gap:   2,
  },
  rowType: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  rowReason: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  discardBtn: {
    minWidth:          72,
    height:            36,
    alignItems:        'center',
    justifyContent:    'center',
    borderRadius:      radius.md,
    paddingHorizontal: spacing.sm,
    backgroundColor:  `${colors.status.error}1F`,
  },
  discardLabel: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.status.error,
  },
}));

export function ConflictsReviewSheet({ visible, outcomes, discardingEditId, onDiscard, onClose }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const conflicts = outcomes.filter((o) => o.status === 'conflict');

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
      maxDynamicContentSize={520}
    >
      <BottomSheetView style={s.header}>
        <Text style={s.title}>Conflitos ({conflicts.length})</Text>
        <Text style={s.hint}>Essas correções não puderam ser aplicadas na cifra atual.</Text>
      </BottomSheetView>

      <BottomSheetFlatList
        data={conflicts}
        keyExtractor={(item) => item.edit_id}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <View style={s.row}>
            <AlertTriangle size={18} color={colors.accent.coral} />
            <View style={s.rowText}>
              <Text style={s.rowType}>{EDIT_TYPE_LABEL[item.type] ?? item.type}</Text>
              <Text style={s.rowReason}>{item.reason ? REASON_LABEL[item.reason] : 'Motivo desconhecido.'}</Text>
            </View>
            {onDiscard && (
              <Pressable
                onPress={() => onDiscard(item.edit_id)}
                disabled={discardingEditId === item.edit_id}
                style={s.discardBtn}
                accessibilityRole="button"
                accessibilityLabel="Descartar correção"
              >
                {discardingEditId === item.edit_id ? (
                  <ActivityIndicator size="small" color={colors.status.error} />
                ) : (
                  <Text style={s.discardLabel}>Descartar</Text>
                )}
              </Pressable>
            )}
          </View>
        )}
      />
    </BottomSheetModal>
  );
}

const EDIT_TYPE_LABEL: Record<string, string> = {
  replace_chord:   'Corrigir acorde',
  insert_chord:    'Inserir acorde',
  delete_chord:    'Remover acorde',
  shift_chord:     'Mover acorde',
  relabel_section: 'Renomear seção',
  annotate:        'Anotação',
};
