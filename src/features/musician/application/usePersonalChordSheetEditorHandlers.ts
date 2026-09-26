import { useRef, useState } from 'react';
import type { RenderableToken } from '@/shared/utils/chord-sheet';
import { useApplyChordEdits, getPersonalChordSheetMutationErrorMessage } from './usePersonalChordSheetMutations';

type PickerMode = 'replace' | 'insert';
type NextSheet = { kind: 'picker'; mode: PickerMode } | { kind: 'annotation' };

const NO_TIME_MESSAGE = 'Esse trecho não tem tempo marcado na música, então não dá para editar aqui.';

/*
 * Três defeitos corrigidos em 25/set/2026, os três com o mesmo sintoma —
 * "toco em corrigir/inserir e nada acontece":
 *
 * 1. 🔴 Corrigir/remover mandavam o tempo da PALAVRA. O backend casa pelo tempo
 *    DO ACORDE (tolerância de 250 ms) e respondia 200 com a edição em conflito
 *    `anchor_not_found`: nada mudava e nenhum erro aparecia. Agora vai
 *    `chordStartMs` (ver `RenderableToken`).
 * 2. 🔴 O menu fechava e o seletor abria no MESMO instante — dois
 *    `BottomSheetModal` trocando de lugar na pilha do provider, e o que abria
 *    podia ser engolido pelo que fechava. Agora o próximo sheet só abre no
 *    `onDismiss` do menu (`handleActionDismissed`). O pedido fica num REF, não
 *    em estado: o dismiss chega ao fim de uma animação, e uma closure de
 *    render anterior leria `null` — o seletor, de novo, não abriria.
 * 3. Sem tempo marcado, as funções saíam com `return` mudo. Agora explicam.
 */
export function usePersonalChordSheetEditorHandlers(musicianId: string | null, sheetId: string) {
  const applyEdits = useApplyChordEdits(musicianId, sheetId);
  const [selectedToken, setSelectedToken] = useState<RenderableToken | null>(null);
  const [actionVisible, setActionVisible] = useState(false);
  const nextSheet = useRef<NextSheet | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  const [annotationVisible, setAnnotationVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectToken(token: RenderableToken) {
    setSelectedToken(token);
    setActionVisible(true);
    setError(null);
  }

  // Pede o próximo sheet e fecha o menu; quem ABRE é o onDismiss do menu.
  function openPicker(mode: PickerMode) {
    nextSheet.current = { kind: 'picker', mode };
    setActionVisible(false);
  }

  function openAnnotation() {
    nextSheet.current = { kind: 'annotation' };
    setActionVisible(false);
  }

  function handleActionDismissed() {
    const next = nextSheet.current;
    nextSheet.current = null;
    setActionVisible(false);
    if (next?.kind === 'picker') setPickerMode(next.mode);
    if (next?.kind === 'annotation') setAnnotationVisible(true);
  }

  // Corrigir/remover: tempo DO ACORDE. Inserir/anotar: tempo da palavra.
  const chordTime = (token: RenderableToken | null) => token?.chordStartMs ?? token?.startMs ?? null;
  const wordTime = (token: RenderableToken | null) => token?.startMs ?? null;

  async function save(edits: Parameters<typeof applyEdits.mutateAsync>[0]['edits'], onDone: () => void) {
    setError(null);
    try {
      await applyEdits.mutateAsync({ edits });
      onDone();
    } catch (cause) {
      setError(getPersonalChordSheetMutationErrorMessage(cause));
    }
  }

  async function confirmChord(symbol: string) {
    const token = selectedToken;
    if (!pickerMode || !token) return;
    const atMs = pickerMode === 'replace' ? chordTime(token) : wordTime(token);
    if (atMs == null) return setError(NO_TIME_MESSAGE);

    await save(
      pickerMode === 'replace'
        ? [{ type: 'replace_chord', at_ms: atMs, from: token.chordSymbol, to: symbol }]
        : [{ type: 'insert_chord', at_ms: atMs, symbol }],
      () => {
        setPickerMode(null);
        setSelectedToken(null);
      },
    );
  }

  async function removeChord() {
    const token = selectedToken;
    setActionVisible(false);
    if (!token?.chordSymbol) return;
    const atMs = chordTime(token);
    if (atMs == null) return setError(NO_TIME_MESSAGE);

    await save([{ type: 'delete_chord', at_ms: atMs, from: token.chordSymbol }], () => setSelectedToken(null));
  }

  async function confirmAnnotation(text: string) {
    const atMs = wordTime(selectedToken) ?? chordTime(selectedToken);
    if (atMs == null) return setError(NO_TIME_MESSAGE);

    await save([{ type: 'annotate', at_ms: atMs, text }], () => {
      setAnnotationVisible(false);
      setSelectedToken(null);
    });
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
    handleActionDismissed,
    closePicker: () => {
      setPickerMode(null);
      setError(null);
    },
    closeAnnotation: () => {
      setAnnotationVisible(false);
      setError(null);
    },
  };
}
