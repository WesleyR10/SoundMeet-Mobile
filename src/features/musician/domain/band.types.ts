// Espelha BandOutput/BandPresenter (musicians-module/bands.controller.ts).
// v2 (jul/2026) — convite de banda com estado: entrar numa banda não é mais
// unilateral, é POST /bands/:id/members (cria "pending") + aceite/recusa
// pelo próprio convidado (POST .../invites/accept|decline, musician_id
// sempre do JWT). Ver band.api.ts.
import type { MusicianLocation } from './musician.types';

export type BandMemberStatus = 'pending' | 'accepted' | 'declined';

export interface BandMember {
  member_id:   string;
  musician_id: string;
  role:        string;
  instrument:  string;
  joined_at:   string; // ISO
  status:      BandMemberStatus;
  responded_at: string | null; // ISO — null até o convidado aceitar/recusar
}

// Body de POST /bands/:id/members — role é o papel de governança da banda
// ('leader'/'member', mesmos valores já usados em BandMemberRow.ROLE_LABEL),
// não o instrumento.
export interface CreateBandMemberInvitePayload {
  musician_id: string;
  role:        string;
  instrument:  string;
}

export type PriceModel = 'per_event' | 'per_hour';

export interface BandPriceRange {
  model:    PriceModel;
  min:      number;
  max:      number;
  currency: string;
  notes:    string | null;
}

export interface Band {
  id:          string;
  name:        string;
  description: string | null;
  avatar:      string | null;
  genres:      string[];
  members:     BandMember[];
  priceRange:  BandPriceRange | null;
  is_active:   boolean;
  created_at:  string;
  updated_at:  string;
  // Opt-in de radar (jul/2026) — independente do open_to_gigs de cada membro,
  // controlado só pelo líder (BandMember.role === 'leader'). Mesmo tri-state
  // do músico: null = ainda não decidiu, nunca nasce true. GET /bands só
  // retorna banda com open_to_gigs === true, EXCETO quando o filtro é
  // musician_id (endpoint "minhas bandas" — ver listMyBands).
  open_to_gigs: boolean | null;
  // Endereço próprio da banda (não herdado do líder) — mesmo shape de
  // MusicianLocation, reaproveitado (não duplicado).
  address:      MusicianLocation | null;
}

// Espelha BusyInterval/FreeBusy de features/scheduling/domain/availability.types —
// duplicado (não importado) de propósito: FSD proíbe features/musician importar
// de features/scheduling (mesmo racional já documentado em wallet.api.ts).
export interface BandBusyInterval {
  start_at:    string; // ISO
  end_at:      string; // ISO
  kind:        'booking' | 'unavailability';
  booking_id?: string;
  reason?:     string | null;
  status?:     string;
}

export interface BandFreeBusy {
  target_type: 'band';
  target_id:   string;
  start_at:    string;
  end_at:      string;
  busy:        BandBusyInterval[];
}
