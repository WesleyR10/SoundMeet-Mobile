// Integração do músico com o Google Agenda (backend: item 7.18, jul/2026).
// Domínio puro — sem RN/Expo/Axios.

/**
 * O que o `GET /musicians/:id/google-calendar/status` devolve.
 *
 * 🔴 **Token nenhum aparece aqui, e isso é por construção.** Os tokens OAuth
 * ficam cifrados em repouso no backend (AES-256-GCM) e não saem em presenter
 * nem em `toJSON()` — o app nunca precisa deles, porque quem fala com o Google
 * é o servidor.
 */
export type GoogleCalendarStatus = {
  connected: boolean;
  /** E-mail da conta conectada. `null` quando desconectado. */
  google_account_email: string | null;
};

/**
 * Deep link de volta do consentimento. Precisa bater com o
 * `GOOGLE_CALENDAR_APP_RETURN_URL` do backend (que cai neste mesmo valor
 * quando a env não está definida) — é ele que faz a Chrome Custom Tab fechar
 * sozinha.
 */
export const GOOGLE_CALENDAR_RETURN_URL = 'soundmeet://agenda/google';
