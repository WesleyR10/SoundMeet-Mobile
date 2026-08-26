import { useCallback, useMemo, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Animated, {
  runOnJS,
  scrollTo,
  useAnimatedRef,
  useAnimatedReaction,
  useSharedValue,
} from 'react-native-reanimated';
import type { PlayModeFlatLine } from '../domain/play-mode.types';
import {
  buildCumulativeWeights,
  findActiveLineIndex,
  progressToScrollY,
} from './chord-sheet-timing';

/**
 * Depois de o músico arrastar a cifra com o dedo, quanto tempo a rolagem
 * automática fica desligada. Sem esta trégua, o áudio puxaria a tela de volta
 * no instante seguinte e olhar dois compassos à frente seria impossível.
 */
const MANUAL_SCROLL_GRACE_MS = 4_000;

/**
 * Rolagem da cifra **guiada pelo áudio** — a diferença entre o Modo Ensaio e o
 * Play Mode.
 *
 * No palco não há áudio nenhum, então `usePlayModeAutoScroll` estima o
 * andamento com um playhead virtual e um slider de velocidade: o músico ajusta
 * até bater com o que ele está tocando. Aqui a gravação está tocando de
 * verdade, e a posição real dela é a fonte da rolagem — nada a calibrar, e a
 * cifra não desanda ao longo da música.
 *
 * 🔴 **Não altera `usePlayModeAutoScroll`.** Aquele hook é o motor da tela de
 * palco; enfiar um segundo modo de operação dentro dele colocaria o caminho ao
 * vivo em risco por uma feature de ensaio. Os dois compartilham só os helpers
 * puros de `chord-sheet-timing`.
 */
export function usePracticeScrollSync(
  flatLines: PlayModeFlatLine[],
  positionSeconds: number,
  durationSeconds: number,
) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const lineOffsets = useSharedValue<number[]>([]);
  const progress = useSharedValue(0);

  const [activeLineIndex, setActiveLineIndex] = useState(0);
  // Espelho na UI thread da última linha já reportada ao JS. Sem ele, a reação
  // dispararia um setState por frame — 60 re-renders por segundo da cifra
  // inteira para um número que muda a cada poucos segundos.
  const lastReportedLine = useSharedValue(-1);
  const [hasMeasured, setHasMeasured] = useState(false);
  const manualUntilRef = useRef(0);

  const cumulativeWeights = useMemo(
    () => buildCumulativeWeights(flatLines),
    [flatLines],
  );

  // A cifra não carrega marcação de tempo confiável em toda música, então o
  // mapeamento é proporcional: fração do áudio → fração do peso acumulado das
  // linhas. É a mesma escada de pesos que o Play Mode já usa, só que o
  // denominador agora é a duração real em vez de uma estimativa.
  const targetProgress =
    durationSeconds > 0
      ? Math.max(0, Math.min(1, positionSeconds / durationSeconds))
      : 0;

  if (hasMeasured && Date.now() >= manualUntilRef.current) {
    progress.value = targetProgress;
  }

  // Uma reação só: rola a tela e espelha a linha ativa para JS. Duas reações
  // sobre o mesmo shared value fariam o dobro de saltos para a thread de JS a
  // cada frame, para o mesmo resultado.
  useAnimatedReaction(
    () => progress.value,
    (p) => {
      const y = progressToScrollY(p, lineOffsets.value, cumulativeWeights);
      scrollTo(scrollRef, 0, y, false);

      const index = findActiveLineIndex(p, cumulativeWeights);
      if (index !== lastReportedLine.value) {
        lastReportedLine.value = index;
        runOnJS(setActiveLineIndex)(index);
      }
    },
    [cumulativeWeights],
  );

  const reportLineLayout = useCallback(
    (index: number, y: number) => {
      const next = [...lineOffsets.value];
      next[index] = y;
      lineOffsets.value = next;
    },
    [lineOffsets],
  );

  const reportContentHeight = useCallback(
    (height: number) => {
      const next = [...lineOffsets.value];
      next[flatLines.length] = height;
      lineOffsets.value = next;
      setHasMeasured(true);
    },
    [lineOffsets, flatLines.length],
  );

  const onScrollBeginDrag = useCallback(() => {
    manualUntilRef.current = Date.now() + MANUAL_SCROLL_GRACE_MS;
  }, []);

  const onScrollEnd = useCallback(
    (_e: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Renova a trégua a partir do fim do gesto, não do começo: um arraste
      // longo consumiria a janela inteira antes de o dedo sair da tela.
      manualUntilRef.current = Date.now() + MANUAL_SCROLL_GRACE_MS;
    },
    [],
  );

  return {
    scrollRef,
    activeLineIndex,
    hasMeasured,
    reportLineLayout,
    reportContentHeight,
    onScrollBeginDrag,
    onScrollEnd,
  };
}

export type ChordSheetScrollBinding = ReturnType<typeof usePracticeScrollSync>;
