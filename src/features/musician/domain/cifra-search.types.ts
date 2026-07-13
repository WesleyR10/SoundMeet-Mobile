// Espelha SearchAiCifraCatalogResultPresenter/AiCifraAnalysisJobPresenter do
// backend (ai-cifra-module). Domínio puro, sem imports de RN/Expo.

export interface CifraSearchResult {
  title:            string;
  artist:           string;
  youtube_video_id: string;
}

export type AiCifraAnalysisJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface AiCifraAnalysisJob {
  id:                string;
  ai_cifra_upload_id: string;
  musician_id:        string;
  status:              AiCifraAnalysisJobStatus;
  progress_percent:    number;
  progress_stage:      string | null;
  error_code:          string | null;
  error_message:       string | null;
}
