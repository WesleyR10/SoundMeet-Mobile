/** Nomes que o `htdemucs_4stems` devolve. */
export type StemName = 'vocals' | 'drums' | 'bass' | 'other';

export type PracticeStem = {
  id:           string;
  stem_name:    string;
  public_url:   string | null;
  content_type: string;
  file_size:    number | null;
};

/**
 * `expired` NÃO é erro: a separação deu certo e o prazo de retenção venceu.
 * Stem é a gravação separada, não um dado derivado como a cifra — o backend
 * apaga por política, não por falha. A UI oferece "separar de novo".
 */
export type PracticeJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'expired'
  | 'failed';

export type PracticeSeparationJob = {
  id:                 string;
  ai_audio_upload_id: string;
  musician_id:        string;
  model_id:           string;
  status:             PracticeJobStatus;
  progress_percent:   number;
  progress_stage:     string | null;
  error_code:         string | null;
  error_message:      string | null;
  started_at:         string | null;
  finished_at:        string | null;
  /** Quando os stems saem do storage. `null` enquanto não concluiu. */
  stems_expire_at:    string | null;
  outputs:            PracticeStem[];
  created_at:         string;
  updated_at:         string;
};

export type RequestPracticeSeparationPayload = {
  music_library_id: string;
  model_id?:        string;
  output_format?:   'wav' | 'flac' | 'mp3';
};

/** Terminal para o polling: não adianta continuar perguntando. */
export function isPracticeJobSettled(status: PracticeJobStatus): boolean {
  return status === 'completed' || status === 'expired' || status === 'failed';
}

/** Rótulo do instrumento, na língua do músico. */
export const STEM_LABELS: Record<string, string> = {
  vocals: 'Voz',
  drums:  'Bateria',
  bass:   'Baixo',
  other:  'Harmonia',
};

export function stemLabel(stemName: string): string {
  return STEM_LABELS[stemName] ?? stemName;
}
