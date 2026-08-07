import { useMutation, useQuery } from '@tanstack/react-query';
import { extractApiMessage } from '@/shared/services/http/types';
import {
  createMusicLibraryItem,
  requestAnalysisFromProvider,
  getAnalysisJob,
  deleteMusicLibraryItem,
} from '../infrastructure/cifra-search.api';
import type { CifraSearchResult } from '../domain/cifra-search.types';

export function getCifraAnalysisErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}

// Orquestra os passos 2+3 do fluxo de busca (ver plano Bloco 7): cria o item
// na MusicLibrary primeiro (POST /music-library/items, id já conhecido no
// cliente) e só então dispara a análise passando esse id — evita qualquer
// necessidade de "descobrir" music_library_id depois via polling do job.
//
// São 2 chamadas HTTP separadas, sem transação — se a segunda (disparar
// análise) falhar, o item já foi criado no servidor e ficaria órfão (título/
// artista reais, cifra nunca gerada) pra sempre na biblioteca do músico.
// Compensação best-effort: apaga o item recém-criado antes de propagar o
// erro original, pra que tentar de novo (outra música ou a mesma) comece
// limpo em vez de acumular lixo silencioso a cada falha de rede.
export function useStartCifraAnalysis(musicianId: string | null) {
  return useMutation({
    mutationFn: async (result: CifraSearchResult) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      const item = await createMusicLibraryItem({
        title: result.title,
        artist: result.artist,
        youtubeVideoId: result.youtube_video_id,
      });
      try {
        const job = await requestAnalysisFromProvider(musicianId, {
          musicLibraryId: item.id,
          youtubeVideoId: result.youtube_video_id,
        });
        return { musicLibraryId: item.id, job };
      } catch (err) {
        await deleteMusicLibraryItem(item.id).catch(() => undefined);
        throw err;
      }
    },
  });
}

// Variante usada pelo import de cifra da comunidade quando o músico já tem a
// linha da música na própria biblioteca, mas ela ainda não foi analisada. Não
// cria uma segunda linha: dispara o mesmo job sobre o id existente.
export function useStartCifraAnalysisForExistingItem(musicianId: string | null) {
  return useMutation({
    mutationFn: async ({ musicLibraryId, result }: { musicLibraryId: string; result: CifraSearchResult }) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return requestAnalysisFromProvider(musicianId, {
        musicLibraryId,
        youtubeVideoId: result.youtube_video_id,
      });
    },
  });
}

const TERMINAL_STATUSES = new Set(['completed', 'failed']);

// Poll-until-terminal — não existe push/socket pra conclusão de análise
// ai-cifra (confirmado durante a investigação do backend), então é isso ou
// nada. Para de repetir assim que status vira completed/failed.
export function useCifraAnalysisJob(jobId: string | null) {
  return useQuery({
    queryKey: ['ai-cifra-analysis-job', jobId],
    queryFn:  () => getAnalysisJob(jobId!),
    enabled:  !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL_STATUSES.has(status) ? false : 2_000;
    },
  });
}
