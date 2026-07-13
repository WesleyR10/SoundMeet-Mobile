import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { CifraSearchResult, AiCifraAnalysisJob } from '../domain/cifra-search.types';

// GET /musicians/:musician_id/ai-cifra/search — lista simples (sem
// paginação), o AiCifraSearchController retorna array puro → interceptor do
// backend embrulha como { data: [...] } (sem `meta`).
export async function searchCifra(musicianId: string, query: string, limit = 15): Promise<CifraSearchResult[]> {
  const { data } = await httpClient.get<ApiEnvelope<CifraSearchResult[]>>(
    `/musicians/${musicianId}/ai-cifra/search`,
    { params: { query, limit } },
  );
  return data.data;
}

// POST /music-library/items — cria o item ANTES de disparar a análise
// (from-provider/analyses não cria nada sozinho quando chamado fora do fluxo
// de preload em lote — ver Docs backend). Retorna o `id` já conhecido no
// cliente, usado depois em addSong sem precisar "descobrir" via polling.
export async function createMusicLibraryItem(input: {
  title: string;
  artist: string;
  youtubeVideoId: string;
}): Promise<{ id: string }> {
  const { data } = await httpClient.post<ApiEnvelope<{ id: string }>>('/music-library/items', {
    title: input.title,
    artist: input.artist,
    source: 'youtube',
    source_id: input.youtubeVideoId,
  });
  return data.data;
}

export async function requestAnalysisFromProvider(
  musicianId: string,
  input: { musicLibraryId: string; youtubeVideoId: string; provider?: 'simpmusic' | 'musify' },
): Promise<AiCifraAnalysisJob> {
  const { data } = await httpClient.post<ApiEnvelope<AiCifraAnalysisJob>>(
    `/musicians/${musicianId}/ai-cifra/uploads/from-provider/analyses`,
    {
      music_library_id: input.musicLibraryId,
      youtube_video_id: input.youtubeVideoId,
      provider: input.provider ?? 'simpmusic',
    },
  );
  return data.data;
}

export async function getAnalysisJob(jobId: string): Promise<AiCifraAnalysisJob> {
  const { data } = await httpClient.get<ApiEnvelope<AiCifraAnalysisJob>>(`/ai-cifra/analyses/${jobId}`);
  return data.data;
}

// DELETE /music-library/items/:id — usado como compensação quando
// createMusicLibraryItem tem sucesso mas requestAnalysisFromProvider falha
// logo em seguida (duas chamadas HTTP separadas, sem transação): sem isso, o
// item ficaria órfão pra sempre na biblioteca do músico, com título/artista
// reais mas nenhuma cifra. Ver useStartCifraAnalysis.
export async function deleteMusicLibraryItem(musicLibraryId: string): Promise<void> {
  await httpClient.delete(`/music-library/items/${musicLibraryId}`);
}
