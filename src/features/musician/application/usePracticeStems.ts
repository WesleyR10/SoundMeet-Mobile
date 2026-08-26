import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';
import type { PracticeStem } from '../domain/practice.types';

/**
 * Quanto um stem pode se afastar do líder antes de valer a pena re-sincronizar.
 *
 * 🔴 **O risco central desta feature.** Quatro players nativos independentes não
 * começam no mesmo instante nem andam no mesmo passo: cada `play()` agenda no
 * seu próprio pipeline. Abaixo de ~40ms a diferença some no ataque das notas;
 * acima disso a bateria "borra" contra o baixo e o ensaio fica inútil.
 *
 * Corrigir agressivamente é pior que o problema — um `seekTo` audível a cada
 * meio segundo vira estalo. Por isso o limiar é generoso e a checagem, rala.
 */
const DRIFT_TOLERANCE_SECONDS = 0.04;

/** Frequência da checagem de deriva e da atualização de posição na UI. */
const TICK_MS = 250;

export type StemTrack = {
  id:        string;
  name:      string;
  url:       string;
  volume:    number;
  muted:     boolean;
};

export type PracticeStemsController = {
  tracks:      StemTrack[];
  isReady:     boolean;
  isPlaying:   boolean;
  position:    number;
  duration:    number;
  rate:        number;
  soloedId:    string | null;
  play:        () => void;
  pause:       () => void;
  toggle:      () => void;
  seekTo:      (seconds: number) => void;
  setRate:     (rate: number) => void;
  setVolume:   (id: string, volume: number) => void;
  toggleMute:  (id: string) => void;
  toggleSolo:  (id: string) => void;
};

/**
 * Toca N stems em paralelo como se fossem um multipista.
 *
 * ## Por que N players e não um mixdown
 *
 * O `expo-audio` não expõe mixagem: não dá para somar buffers em JS e tocar o
 * resultado. Tirar "o meu instrumento" tem que ser silenciar uma faixa entre
 * quatro — e isso exige as quatro tocando juntas.
 *
 * ## O líder é o primeiro carregado, sempre
 *
 * Eleger o líder por "quem estiver mais adiantado" faria a referência mudar a
 * cada tick e todo mundo perseguir todo mundo. Com um líder fixo, a correção
 * é sempre na mesma direção e converge.
 */
export function usePracticeStems(stems: PracticeStem[]): PracticeStemsController {
  const playableStems = useMemo(
    () => stems.filter((s): s is PracticeStem & { public_url: string } => !!s.public_url),
    [stems],
  );

  const playersRef = useRef<Map<string, AudioPlayer>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);
  const [soloedId, setSoloedId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<StemTrack[]>([]);

  // Uma vez por montagem: sem isto, no iOS o áudio some quando o interruptor
  // lateral está no silencioso — o músico acharia que a separação falhou.
  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const players = new Map<string, AudioPlayer>();

    for (const stem of playableStems) {
      const player = createAudioPlayer({ uri: stem.public_url });
      // Correção de pitch ligada desde o começo: meia-velocidade que abaixa o
      // tom junto não serve para tirar de ouvido, que é o uso da feature.
      player.shouldCorrectPitch = true;
      players.set(stem.id, player);
    }

    playersRef.current = players;
    setTracks(
      playableStems.map((stem) => ({
        id:     stem.id,
        name:   stem.stem_name,
        url:    stem.public_url,
        volume: 1,
        muted:  false,
      })),
    );
    setIsReady(playableStems.length > 0);
    setIsPlaying(false);
    setPosition(0);
    setSoloedId(null);

    return () => {
      for (const player of players.values()) {
        try {
          player.pause();
          player.remove();
        } catch {
          // Player já liberado pelo runtime — nada a fazer.
        }
      }
      playersRef.current = new Map();
    };
  }, [playableStems]);

  const leader = useCallback((): AudioPlayer | null => {
    const first = playableStems[0];
    return first ? (playersRef.current.get(first.id) ?? null) : null;
  }, [playableStems]);

  // Um único tick para posição, duração e correção de deriva — três
  // `setInterval` fariam o mesmo trabalho três vezes.
  useEffect(() => {
    if (!isReady) return;

    const id = setInterval(() => {
      const lead = leader();
      if (!lead) return;

      setPosition(lead.currentTime ?? 0);
      if (lead.duration && lead.duration !== duration) {
        setDuration(lead.duration);
      }

      if (!isPlaying) return;

      for (const player of playersRef.current.values()) {
        if (player === lead) continue;
        const delta = Math.abs((player.currentTime ?? 0) - (lead.currentTime ?? 0));
        if (delta > DRIFT_TOLERANCE_SECONDS) {
          // Tolerância zero no seek: o padrão do sistema pode "arredondar" para
          // o keyframe mais próximo, que é justamente a imprecisão que estamos
          // corrigindo.
          void player.seekTo(lead.currentTime ?? 0, 0, 0).catch(() => undefined);
        }
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [isReady, isPlaying, duration, leader]);

  const play = useCallback(() => {
    // Todos no mesmo tick do JS: qualquer await entre um play e o próximo vira
    // defasagem audível logo na entrada.
    for (const player of playersRef.current.values()) {
      player.play();
    }
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    for (const player of playersRef.current.values()) {
      player.pause();
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const seekTo = useCallback((seconds: number) => {
    const target = Math.max(0, seconds);
    for (const player of playersRef.current.values()) {
      void player.seekTo(target, 0, 0).catch(() => undefined);
    }
    setPosition(target);
  }, []);

  const setRate = useCallback((next: number) => {
    for (const player of playersRef.current.values()) {
      player.playbackRate = next;
      player.shouldCorrectPitch = true;
    }
    setRateState(next);
  }, []);

  // Volume real = o que o fader diz, zerado por mute OU por solo alheio. O
  // estado do fader nunca é sobrescrito por mute/solo: religar devolve o nível
  // que o músico tinha escolhido.
  const applyGains = useCallback(
    (nextTracks: StemTrack[], nextSoloed: string | null) => {
      for (const track of nextTracks) {
        const player = playersRef.current.get(track.id);
        if (!player) continue;
        const silencedBySolo = !!nextSoloed && nextSoloed !== track.id;
        player.volume = track.muted || silencedBySolo ? 0 : track.volume;
      }
    },
    [],
  );

  const setVolume = useCallback(
    (id: string, volume: number) => {
      setTracks((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, volume } : t));
        applyGains(next, soloedId);
        return next;
      });
    },
    [applyGains, soloedId],
  );

  const toggleMute = useCallback(
    (id: string) => {
      setTracks((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, muted: !t.muted } : t));
        applyGains(next, soloedId);
        return next;
      });
    },
    [applyGains, soloedId],
  );

  const toggleSolo = useCallback(
    (id: string) => {
      setSoloedId((prev) => {
        const next = prev === id ? null : id;
        setTracks((current) => {
          applyGains(current, next);
          return current;
        });
        return next;
      });
    },
    [applyGains],
  );

  return {
    tracks,
    isReady,
    isPlaying,
    position,
    duration,
    rate,
    soloedId,
    play,
    pause,
    toggle,
    seekTo,
    setRate,
    setVolume,
    toggleMute,
    toggleSolo,
  };
}
