/**
 * Regras do áudio de apresentação — o preview de até 40s que o estabelecimento
 * ouve antes de contratar.
 *
 * ⚠️ **Isto é UX, não defesa.** O servidor revalida tudo (magic bytes, tamanho,
 * duração) e é ele quem decide. O que estas funções evitam é o músico esperar
 * a subida de vários MB por celular para receber um 422 previsível — e receber
 * a recusa com o número que ele precisa para consertar, em vez de "formato
 * inválido".
 *
 * Os limites são espelho de `upload-musician-presentation-audio.use-case.ts`.
 * Divergir aqui não abre brecha (o servidor decide), mas produz o pior tipo de
 * erro: um arquivo aceito na tela e recusado no envio, ou recusado na tela
 * sendo perfeitamente válido.
 */

export const PRESENTATION_AUDIO_LIMITS = {
  MIN_SECONDS: 5,
  MAX_SECONDS: 40,
  MAX_BYTES: 10 * 1024 * 1024,
} as const;

/**
 * Extensões aceitas, na forma como o seletor de arquivos as devolve.
 *
 * 🔴 **A checagem é por EXTENSÃO, e é por isso que ela não é defesa.** O
 * `mimeType` do `expo-document-picker` vem do sistema (no Android costuma ser
 * `application/octet-stream` para o mesmo MP3 que o iOS chama de `audio/mpeg`),
 * então filtrar por ele recusaria arquivo bom. Quem lê os BYTES é o servidor.
 *
 * Ogg e FLAC ficam de fora aqui pelo mesmo motivo do backend: Safari não toca
 * Ogg Vorbis, e um preview que parte dos estabelecimentos não ouve é pior que
 * nenhum.
 */
export const PRESENTATION_AUDIO_EXTENSIONS = ['mp3', 'm4a', 'aac', 'wav'] as const;

/** Tipos passados ao seletor. `audio/*` porque o rótulo do SO varia. */
export const PRESENTATION_AUDIO_PICKER_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
];

export type PresentationAudioCandidate = {
  name:     string;
  size?:    number | null;
  /** Segundos medidos localmente. `null` = não foi possível medir. */
  duration?: number | null;
};

export type PresentationAudioRejection = {
  reason:  'extension' | 'size' | 'too_short' | 'too_long';
  message: string;
};

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase();
}

export function formatDurationLabel(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatSeconds(totalSeconds: number): string {
  const safe = Math.round(totalSeconds);
  if (safe < 60) return `${safe} segundos`;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return seconds === 0 ? `${minutes}min` : `${minutes}min${String(seconds).padStart(2, '0')}`;
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/**
 * Devolve `null` quando o arquivo pode ser enviado, ou o motivo da recusa com
 * a mensagem pronta para a tela.
 *
 * ⚠️ **Duração ausente NÃO reprova.** Nem todo arquivo permite medir a duração
 * no aparelho antes de subir; recusar aí transformaria uma limitação do
 * dispositivo em impedimento de produto. O servidor mede de novo e decide.
 */
export function rejectPresentationAudio(
  file: PresentationAudioCandidate,
): PresentationAudioRejection | null {
  const extension = extensionOf(file.name);

  if (!(PRESENTATION_AUDIO_EXTENSIONS as readonly string[]).includes(extension)) {
    return {
      reason:  'extension',
      message: 'Formato não suportado. Escolha um arquivo MP3, M4A, AAC ou WAV.',
    };
  }

  if (typeof file.size === 'number' && file.size > PRESENTATION_AUDIO_LIMITS.MAX_BYTES) {
    return {
      reason:  'size',
      message: `O arquivo tem ${formatMegabytes(file.size)} e o limite é ${formatMegabytes(
        PRESENTATION_AUDIO_LIMITS.MAX_BYTES,
      )}.`,
    };
  }

  if (typeof file.duration === 'number' && Number.isFinite(file.duration)) {
    // Arredonda antes de comparar, como o servidor: um trecho cortado em "40
    // segundos" costuma vir com 40,04 no cabeçalho.
    const duration = Math.round(file.duration);

    if (duration < PRESENTATION_AUDIO_LIMITS.MIN_SECONDS) {
      return {
        reason:  'too_short',
        message: `O áudio tem ${formatSeconds(duration)} e o mínimo é ${
          PRESENTATION_AUDIO_LIMITS.MIN_SECONDS
        } segundos.`,
      };
    }

    if (duration > PRESENTATION_AUDIO_LIMITS.MAX_SECONDS) {
      return {
        reason:  'too_long',
        message: `O áudio tem ${formatSeconds(duration)} e o limite é ${
          PRESENTATION_AUDIO_LIMITS.MAX_SECONDS
        } segundos. Corte um trecho menor e envie de novo.`,
      };
    }
  }

  return null;
}
