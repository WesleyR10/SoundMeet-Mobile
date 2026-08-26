import { useEffect, useRef } from 'react';
import { useLiveSetStore } from './liveSet.store';
import { usePerformance, usePerformanceControl } from './usePerformance';

type Params = {
  musicLibraryId: string | null;
  /** Só o DONO do repertório transmite — ver a nota sobre convidado. */
  enabled: boolean;
};

export type BroadcastState = {
  /** Há set aberto: o Play Mode está transmitindo. */
  isBroadcasting: boolean;
  /** Esta música já é a que está no ar. */
  isCurrent: boolean;
};

/**
 * Transmite ao público a música aberta no Play Mode — **e só quando há set
 * aberto**.
 *
 * 🔴 **Sem set aberto isto não faz absolutamente nada.** É o ponto inteiro do
 * desenho: o Play Mode é usado para estudar em casa, e registrar automaticamente
 * cada música aberta transformaria a rotina de estudo em histórico público,
 * publicaria a agenda de ensaio de alguém e envenenaria currículo, relatório e
 * setlist com a mesma música repetida 14 vezes numa tarde de quarta. O
 * interruptor é `useLiveSetStore`, ligado só pelo botão "Iniciar show".
 *
 * ## Por que não re-registra a mesma música
 *
 * Sair e voltar para a mesma cifra é comum no palco (conferir um trecho, olhar
 * o diagrama). Sem a comparação com `current_song.music_library_id`, cada volta
 * criaria uma execução nova — o agregado permite repetição de propósito, porque
 * bis existe, e não tem como distinguir bis de re-entrada na tela.
 *
 * ## Falha em silêncio, por decisão
 *
 * Se a chamada não completa (rede do bar), o músico não vê erro nenhum: ele está
 * tocando. Interromper a tela de palco com um banner por causa de um registro
 * secundário seria o pior resultado possível. A próxima música tenta de novo.
 */
export function useBroadcastCurrentSong({
  musicLibraryId,
  enabled,
}: Params): BroadcastState {
  const activeSet = useLiveSetStore((s) => s.activeSet);
  const { data: performance } = usePerformance(activeSet?.performanceId ?? null);
  const { playSong } = usePerformanceControl();

  const currentLibraryId = performance?.current_song?.music_library_id ?? null;
  const isBroadcasting = !!activeSet && enabled;
  const isCurrent = isBroadcasting && currentLibraryId === musicLibraryId;

  // Guarda a última música ENVIADA, não a confirmada: entre o disparo e a
  // resposta, `current_song` ainda aponta para a anterior, e sem isto o efeito
  // dispararia de novo a cada render nessa janela.
  const lastSentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeSet || !enabled || !musicLibraryId) return;
    if (currentLibraryId === musicLibraryId) return;
    if (lastSentRef.current === musicLibraryId) return;

    lastSentRef.current = musicLibraryId;

    playSong.mutate(
      {
        performanceId: activeSet.performanceId,
        payload: { music_library_id: musicLibraryId },
      },
      {
        // Libera o retry na próxima montagem/troca: uma falha não pode deixar a
        // música marcada como já enviada para sempre.
        onError: () => {
          lastSentRef.current = null;
        },
      },
    );
    // `playSong` é recriado a cada render pelo useMutation — incluí-lo nas deps
    // faria o efeito rodar em loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSet?.performanceId, enabled, musicLibraryId, currentLibraryId]);

  return { isBroadcasting, isCurrent };
}
