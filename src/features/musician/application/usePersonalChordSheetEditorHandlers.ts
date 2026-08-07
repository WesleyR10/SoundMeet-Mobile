import { useState } from 'react';
import type { RenderableToken } from '@/shared/utils/chord-sheet';
import { useApplyChordEdits, getPersonalChordSheetMutationErrorMessage } from './usePersonalChordSheetMutations';

type PickerMode = 'replace' | 'insert';

export function usePersonalChordSheetEditorHandlers(musicianId: string | null, sheetId: string) {
  const applyEdits = useApplyChordEdits(musicianId, sheetId);
  const [selectedToken, setSelectedToken] = useState<RenderableToken | null>(null);
  const [actionVisible, setActionVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  const [annotationVisible, setAnnotationVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectToken(token: RenderableToken) {
    setSelectedToken(token);
    setActionVisible(true);
    setError(null);
  }

  function openPicker(mode: PickerMode) {
    setActionVisible(false);
    setPickerMode(mode);
  }

  function openAnnotation() {
    setActionVisible(false);
    setAnnotationVisible(true);
  }

  async function confirmChord(symbol: string) {
    if (selectedToken?.startMs == null || !pickerMode) return;
    setError(null);
    try {
      await applyEdits.mutateAsync({
        edits: pickerMode === 'replace'
          ? [{ type: 'replace_chord', at_ms: selectedToken.startMs, from: selectedToken.chordSymbol, to: symbol }]
          : [{ type: 'insert_chord', at_ms: selectedToken.startMs, symbol }],
      });
      setPickerMode(null);
      setSelectedToken(null);
    } catch (cause) {
      setError(getPersonalChordSheetMutationErrorMessage(cause));
    }
  }

  async function removeChord() {
    if (selectedToken?.startMs == null || !selectedToken.chordSymbol) return;
    setActionVisible(false);
    setError(null);
    try {
      await applyEdits.mutateAsync({
        edits: [{
          type: 'delete_chord',
          at_ms: selectedToken.startMs,
          from: selectedToken.chordSymbol,
        }],
      });
      setSelectedToken(null);
    } catch (cause) {
      setError(getPersonalChordSheetMutationErrorMessage(cause));
    }
  }

  async function confirmAnnotation(text: string) {
    if (selectedToken?.startMs == null) return;
    setError(null);
    try {
      await applyEdits.mutateAsync({
        edits: [{ type: 'annotate', at_ms: selectedToken.startMs, text }],
      });
      setAnnotationVisible(false);
      setSelectedToken(null);
    } catch (cause) {
      setError(getPersonalChordSheetMutationErrorMessage(cause));
    }
  }

  return {
    selectedToken,
    actionVisible,
    pickerMode,
    annotationVisible,
    error,
    isSaving: applyEdits.isPending,
    selectToken,
    openPicker,
    openAnnotation,
    removeChord,
    confirmChord,
    confirmAnnotation,
    closeAction: () => setActionVisible(false),
    closePicker: () => setPickerMode(null),
    closeAnnotation: () => setAnnotationVisible(false),
  };
}
