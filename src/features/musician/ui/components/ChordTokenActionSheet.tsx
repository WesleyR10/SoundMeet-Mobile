import { useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Music2, PlusCircle, Trash2, MessageSquare } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { RenderableToken } from '@/shared/utils/chord-sheet';

type Props = {
  visible:          boolean;
  token:            RenderableToken | null;
  onClose:          () => void;
  onCorrectChord:   () => void;
  onInsertChord:    () => void;
  onRemoveChord:    () => void;
  onAnnotate:       () => void;
};

type ActionRow = {
  key:     string;
  icon:    typeof Music2;
  label:   string;
  onPress: () => void;
  danger?: boolean;
};

// Menu contextual aberto ao tocar um token em modo Editar (ver extensão
// onPressToken de ChordTokenLine.tsx). Ações mudam conforme o token já tem
// acorde ou não — nunca oferece "editar letra": o token de lyrics em si é
// fixo (pipeline de IA), só acordes/anotações são editáveis aqui.
export function ChordTokenActionSheet({
  visible, token, onClose, onCorrectChord, onInsertChord, onRemoveChord, onAnnotate,
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

  if (!token) return null;

  // Sem startMs não há onde ancorar a edição (nem insert_chord nem annotate
  // funcionam sem um ponto no tempo) — token permanece só de leitura.
  const canEdit = typeof token.startMs === 'number';

  const rows: ActionRow[] = token.chordSymbol
    ? [
        { key: 'correct', icon: Music2, label: `Corrigir acorde (${token.chordSymbol})`, onPress: onCorrectChord },
        { key: 'annotate', icon: MessageSquare, label: 'Anotar aqui', onPress: onAnnotate },
        { key: 'remove', icon: Trash2, label: 'Remover acorde', onPress: onRemoveChord, danger: true },
      ]
    : [
        { key: 'insert', icon: PlusCircle, label: 'Inserir acorde aqui', onPress: onInsertChord },
        { key: 'annotate', icon: MessageSquare, label: 'Anotar aqui', onPress: onAnnotate },
      ];

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
        <Text style={s.title} numberOfLines={1}>"{token.text}"</Text>

        {!canEdit && (
          <Text style={s.hint}>Essa palavra não tem tempo marcado — não dá pra ancorar uma correção nela.</Text>
        )}

        {rows.map((row) => (
          <Pressable
            key={row.key}
            onPress={row.onPress}
            disabled={!canEdit}
            style={({ pressed }) => [s.row, pressed && s.rowPressed, !canEdit && s.rowDisabled]}
            accessibilityRole="button"
            accessibilityLabel={row.label}
            accessibilityState={{ disabled: !canEdit }}
          >
            <row.icon size={20} color={row.danger ? colors.status.error : colors.brand.primary} />
            <Text style={[s.rowLabel, row.danger && s.rowLabelDanger]}>{row.label}</Text>
          </Pressable>
        ))}
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
    gap:                 spacing.xs,
  },
  title: {
    ...typography.title,
    color:        colors.text.primary,
    marginBottom:  spacing.sm,
  },
  hint: {
    ...typography.bodySm,
    color:         colors.text.secondary,
    marginBottom:  spacing.md,
  },
  row: {
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 spacing.md,
    paddingVertical:    spacing.md,
    paddingHorizontal:  spacing.sm,
    borderRadius:        radius.md,
    minHeight:            48,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rowDisabled: {
    opacity: 0.35,
  },
  rowLabel: {
    ...typography.body,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
  },
  rowLabelDanger: {
    color: colors.status.error,
  },
});
