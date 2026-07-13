import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import Animated, {
  useAnimatedRef,
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  cancelAnimation,
  scrollTo,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { buildCumulativeWeights, progressToScrollY, scrollYToProgress, findActiveLineIndex } from './chord-sheet-timing';
import type { PlayModeFlatLine } from '../domain/play-mode.types';

const MIN_SPEED = 0.5;
const MAX_SPEED = 2;
const DEFAULT_SPEED = 1;

// Motor de auto-scroll do Play Mode — "virtual playhead": progress (0..1)
// avança em tempo real constante (um único withTiming, nunca um loop de
// frame — evita drift/bateria), mas a posição de SCROLL resultante é
// ponderada pelo peso de cada linha (chord-sheet-timing.ts), então uma seção
// instrumental longa rola mais devagar que um verso denso no mesmo ritmo
// geral. Ver plano Bloco 7 §1 pro raciocínio completo — não é sync de áudio
// real (o músico está tocando ao vivo, não ouvindo playback).
export function usePlayModeAutoScroll(flatLines: PlayModeFlatLine[]) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const progress = useSharedValue(0);
  const lineOffsets = useSharedValue<number[]>([]);
  const contentHeight = useSharedValue(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(DEFAULT_SPEED);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  // Só fica seguro fazer scrollTo baseado em progress depois que o
  // ScrollView reportar o tamanho total do conteúdo pelo menos uma vez — sem
  // isso, lineOffsets tem "buracos" (linhas cujo onLayout ainda não disparou)
  // e progressToScrollY cairia no fallback `?? 0`, causando um pulo visual
  // pro topo se o usuário desse play antes do layout assentar.
  const [hasMeasured, setHasMeasured] = useState(false);

  const speedRef = useRef(speedMultiplier);
  speedRef.current = speedMultiplier;

  const cumulativeWeights = useMemo(() => buildCumulativeWeights(flatLines), [flatLines]);
  const totalWeightMs = useMemo(() => flatLines.reduce((sum, l) => sum + l.weightMs, 0), [flatLines]);

  // A tela (PlayModeScreen) não desmonta ao trocar de música — troca só os
  // route params (setParams), então os shared values daqui sobreviveriam
  // apontando pro playhead da música anterior sem este reset. `flatLines` só
  // troca de identidade quando o chord-sheet muda (novo musicLibraryId).
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    lineOffsets.value = [];
    contentHeight.value = 0;
    setIsPlaying(false);
    setActiveLineIndex(0);
    setProgressPercent(0);
    setHasMeasured(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatLines]);

  // Segue a posição de scroll a cada mudança de progress — não é um loop de
  // frame próprio, só reage ao shared value já sendo animado por withTiming.
  // Também espelha o progress real (ponderado por peso) pra JS, pro topbar
  // não usar activeLineIndex/total como proxy (proporção errada quando as
  // linhas têm pesos muito diferentes, ex. uma seção instrumental longa).
  useAnimatedReaction(
    () => progress.value,
    (p, prevP) => {
      const y = progressToScrollY(p, lineOffsets.value, cumulativeWeights);
      scrollTo(scrollRef, 0, y, false);

      const idx = findActiveLineIndex(p, cumulativeWeights);
      runOnJS(setActiveLineIndex)(idx);

      const rounded = Math.round(p * 100);
      const prevRounded = prevP === null ? -1 : Math.round(prevP * 100);
      if (rounded !== prevRounded) {
        runOnJS(setProgressPercent)(rounded);
      }
    },
  );

  const reportLineLayout = useCallback((index: number, y: number) => {
    const next = [...lineOffsets.value];
    next[index] = y;
    lineOffsets.value = next;
  }, [lineOffsets]);

  const reportContentHeight = useCallback((height: number) => {
    contentHeight.value = height;
    const next = [...lineOffsets.value];
    next[flatLines.length] = height;
    lineOffsets.value = next;
    setHasMeasured(true);
  }, [contentHeight, lineOffsets, flatLines.length]);

  function startPlayback() {
    if (flatLines.length === 0 || totalWeightMs <= 0) return;
    const remainingFraction = 1 - progress.value;
    const remainingMs = (remainingFraction * totalWeightMs) / speedRef.current;
    setIsPlaying(true);
    progress.value = withTiming(
      1,
      { duration: Math.max(1, remainingMs), easing: Easing.linear },
      (finished) => {
        if (finished) runOnJS(setIsPlaying)(false);
      },
    );
  }

  // Pausar aqui é congelar exatamente onde está — diferente do padrão
  // "resolver pra pose neutra antes de cancelAnimation" do QRFrame (que
  // evita pop porque ali cancelar no meio de um ciclo de pulso deixaria a
  // UI num estado visualmente estranho); aqui o estado "parado no meio" é
  // exatamente o resultado desejado de uma pausa, então cancelAnimation
  // direto é o comportamento correto, não um atalho.
  function pausePlayback() {
    cancelAnimation(progress);
    setIsPlaying(false);
  }

  // Toque manual na tela — pausa imediatamente (o dedo do usuário assume a
  // posição), sem retomar sozinho; ver PlayModeScreen pro botão explícito de
  // retomar, que recalcula o progress a partir da posição atual do scroll.
  function onScrollBeginDrag() {
    cancelAnimation(progress);
    setIsPlaying(false);
  }

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y;
    progress.value = scrollYToProgress(y, lineOffsets.value, cumulativeWeights);
  }

  // Mudar a velocidade no meio do scroll precisa re-agendar o withTiming em
  // voo — só trocar o state não afeta uma animação já despachada (duration
  // já foi calculada e fixada quando play() rodou). cancelAnimation aqui
  // congela `progress` no valor atual (mesmo raciocínio de pausePlayback:
  // esse é o ponto de partida certo, não um "pop"), e startPlayback já lê
  // `speedRef.current` (atualizado antes) pra recalcular a duração restante.
  function setSpeed(next: number) {
    const clamped = Math.max(MIN_SPEED, Math.min(MAX_SPEED, next));
    setSpeedMultiplier(clamped);
    speedRef.current = clamped;
    if (isPlaying) {
      cancelAnimation(progress);
      startPlayback();
    }
  }

  function seekToLine(index: number) {
    const clamped = Math.max(0, Math.min(cumulativeWeights.length - 2, index));
    cancelAnimation(progress);
    progress.value = cumulativeWeights[clamped] ?? 0;
    setIsPlaying(false);
  }

  return {
    scrollRef,
    isPlaying,
    activeLineIndex,
    progressPercent,
    hasMeasured,
    speedMultiplier,
    setSpeed,
    play: startPlayback,
    pause: pausePlayback,
    onScrollBeginDrag,
    onScrollEnd,
    reportLineLayout,
    reportContentHeight,
    seekToLine,
  };
}
