import { useEffect, useRef, useState } from 'react';
import {
  initPitchy, startPitchy, stopPitchy, subscribePitchy, type PitchyEvent,
} from '@/shared/services/tuner/pitchy.service';
import { frequencyToNote, isWithinTunerRange } from '../domain/tuner.math';
import type { NoteName, TunerNoteReading } from '../domain/tuner.types';

const HISTORY_SIZE = 5;
const HYSTERESIS_READINGS = 3;

// Os dois modos são configs reais do Pitchy, não cosmética: modo básico
// (todos os planos) usa os thresholds padrão da lib; modo com filtro de
// ruído (ESSENCIAL/PRO, ver TunerNoiseFilterRow) exige energia e confiança
// maiores antes de aceitar uma leitura — rejeita frames que em ambiente
// ruidoso (bar/palco) gerariam nota errada no modo básico. Valores calibrados
// durante a verificação manual no device (Docs — sem cobertura automatizada
// pra módulo nativo neste projeto).
const BASIC_MODE = { minVolume: -55, minConfidence: 0.9 };
const NOISE_FILTER_MODE = { minVolume: -40, minConfidence: 0.95 };

// Hook de orquestração do afinador (Bloco 8.2). Não usa TanStack Query — é
// estado local de dispositivo em tempo real (mic + DSP), não estado de
// servidor — mas vive em application/ porque essa é a camada que orquestra o
// caso de uso (ciclo de vida do Pitchy + mapeamento pro domain), mesmo
// espírito de usePlayModeAutoScroll.ts.
export function useTunerPitch(enabled: boolean, noiseFilterOn: boolean) {
  const [reading, setReading] = useState<TunerNoteReading | null>(null);
  const [hasSignal, setHasSignal] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const hzHistory = useRef<number[]>([]);
  const pendingNote = useRef<{ note: NoteName; octave: number } | null>(null);
  const pendingCount = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const mode = noiseFilterOn ? NOISE_FILTER_MODE : BASIC_MODE;
    initPitchy({ algorithm: 'MPM', bufferSize: 4096, ...mode });

    const subscription = subscribePitchy((event: PitchyEvent) => {
      if (event.pitch <= 0 || !isWithinTunerRange(event.pitch)) {
        hzHistory.current = [];
        pendingNote.current = null;
        pendingCount.current = 0;
        setHasSignal(false);
        return;
      }
      setHasSignal(true);

      // Mediana das últimas leituras de Hz — suaviza jitter do detector
      // antes de converter pra nota (evita cents "tremendo").
      hzHistory.current = [...hzHistory.current, event.pitch].slice(-HISTORY_SIZE);
      const sorted = [...hzHistory.current].sort((a, b) => a - b);
      const medianHz = sorted[Math.floor(sorted.length / 2)];
      const candidate = frequencyToNote(medianHz);

      setReading((current) => {
        const isSameAsPending =
          pendingNote.current?.note === candidate.note &&
          pendingNote.current?.octave === candidate.octave;

        if (isSameAsPending) {
          pendingCount.current += 1;
        } else {
          pendingNote.current = { note: candidate.note, octave: candidate.octave };
          pendingCount.current = 1;
        }

        const isCurrentNote = current?.note === candidate.note && current?.octave === candidate.octave;
        const confirmed = pendingCount.current >= HYSTERESIS_READINGS;

        // Só troca a nota exibida com N leituras consecutivas da mesma nota
        // (evita flip de oitava/tremor); se já é a nota atual, atualiza
        // cents/Hz livremente a cada leitura (agulha continua se movendo).
        return isCurrentNote || confirmed ? candidate : current;
      });
    });

    // Fire-and-forget deliberado (mesmo espírito de registerForPushNotifications) —
    // start()/stop() podem rejeitar (ex.: stop() chamado sem sessão ativa); sem o
    // catch, isso vira unhandled promise rejection a cada toggle de noiseFilterOn.
    startPitchy().catch(() => {});
    setIsListening(true);

    return () => {
      subscription.remove();
      stopPitchy().catch(() => {});
      setIsListening(false);
      hzHistory.current = [];
      pendingNote.current = null;
      pendingCount.current = 0;
    };
  }, [enabled, noiseFilterOn]);

  return {
    note: reading?.note ?? null,
    octave: reading?.octave ?? null,
    // `null` = nenhuma nota confirmada ainda (inclusive durante a janela de
    // histerese logo após hasSignal virar true) — nunca usar 0 como fallback
    // aqui: cents=0 se leria como "afinado" (verde) e Hz=0 apareceria na tela,
    // ambos enganosos enquanto a leitura ainda não foi confirmada.
    cents: reading?.cents ?? null,
    frequencyHz: reading?.frequencyHz ?? null,
    hasSignal,
    isListening,
  };
}
