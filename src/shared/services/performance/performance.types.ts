export type PerformanceStatus = 'live' | 'ended';

export type PerformedSong = {
  id:                string;
  music_library_id:  string | null;
  request_id:        string | null;
  title:             string;
  artist:            string;
  /** Faixa no Spotify — `null` quando fora do catálogo ou não resolvida. */
  spotify_track_id:  string | null;
  /** Link pronto para abrir no app do Spotify. `null` junto com o id. */
  spotify_url:       string | null;
  position:          number;
  started_at:        string;
  ended_at:          string | null;
  /** `null` = a música nunca foi fechada. Não é zero. */
  duration_seconds:  number | null;
  is_playing:        boolean;
};

export type Performance = {
  id:               string;
  event_id:         string;
  establishment_id: string;
  musician_id:      string;
  band_id:          string | null;
  status:           PerformanceStatus;
  started_at:       string;
  ended_at:         string | null;
  songs:            PerformedSong[];
  songs_count:      number;
  duration_seconds: number | null;
  current_song:     PerformedSong | null;
};

/**
 * A resposta que o FÃ recebe: uma música, nunca o set inteiro.
 *
 * `is_live: false` é estado legítimo — intervalo, show que não começou, músico
 * que não abriu o set. Nunca tratar como erro.
 */
export type LivePerformance = {
  is_live:        boolean;
  performance_id: string | null;
  musician_id:    string;
  event_id:       string;
  current_song:   PerformedSong | null;
  songs_count:    number;
  // Dedicatória do pedido que originou a música tocando agora.
  // 🔴 O backend só preenche quando o destaque foi PAGO — dedicatória
  // prometida e não paga nunca chega aqui. O app confia nesse portão e não
  // reimplementa a regra.
  current_song_dedication: string | null;
};

export type PerformanceReportSong = PerformedSong & {
  /** Estimativa por horário, não causalidade declarada. */
  tips_during_song: number;
};

export type PerformanceReport = {
  performance_id:     string;
  event_id:           string;
  establishment_id:   string;
  /** Nome da casa, para o card compartilhável. `null` = casa removida; a UI omite a linha. */
  establishment_name: string | null;
  musician_id:        string;
  band_id:            string | null;
  started_at:         string;
  ended_at:           string;
  duration_seconds:   number | null;
  songs_count:        number;
  unique_songs_count: number;
  songs:              PerformanceReportSong[];
  requests_received:  number;
  requests_accepted:  number;
  requests_rejected:  number;
  requests_played:    number;
  tips_count:         number;
  tips_total:         number;
  attendees_count:    number;
  tips_attribution_note: string;
};

export type ResumeVenue = {
  establishment_id: string;
  name:             string;
  shows_count:      number;
  last_show_at:     string;
};

/**
 * Currículo verificado.
 *
 * Note o que NÃO existe aqui: nenhum campo de cachê. É deliberado no backend —
 * o currículo é lido pelo público, e expor média de cachê destruiria a posição
 * de negociação do músico.
 */
export type MusicianResume = {
  musician_id:              string;
  shows_completed:          number;
  shows_with_checkin:       number;
  distinct_venues:          number;
  venues:                   ResumeVenue[];
  audience_reached:         number;
  rating_average:           number;
  rating_total:             number;
  distinct_songs_performed: number;
  first_show_at:            string | null;
  last_show_at:             string | null;
  months_active:            number;
};

export type SetlistEvidenceReason =
  | 'requested_and_played'
  | 'requested_and_accepted'
  | 'requested_not_played'
  | 'played_here_before'
  | 'in_repertoire_never_played_here';

export type SetlistEvidence = {
  reason:       SetlistEvidenceReason;
  occurrences:  number;
  last_seen_at: string | null;
};

export type SetlistSuggestion = {
  music_library_id: string | null;
  title:            string;
  artist:           string;
  score:            number;
  evidence:         SetlistEvidence[];
};

export type SetlistSuggestions = {
  musician_id:      string;
  establishment_id: string;
  suggestions:      SetlistSuggestion[];
  /** Zero = ainda não há histórico neste local. A UI precisa dizer isso. */
  evidence_count:   number;
};

export type StartSongPayload = {
  music_library_id?: string;
  request_id?:       string;
  title?:            string;
  artist?:           string;
};

export type OpenableEvent = {
  event_id:            string;
  establishment_id:    string;
  name:                string;
  start_at:            string;
  end_at:              string;
  status:              string;
  band_id:             string | null;
  /** Set já aberto — o app reabre em vez de oferecer "iniciar". */
  live_performance_id: string | null;
};
