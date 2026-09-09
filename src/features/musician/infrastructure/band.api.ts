import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { Band, BandFreeBusy, CreateBandMemberInvitePayload, CreateBandPayload } from '../domain/band.types';
import type { MusicianLocation } from '../domain/musician.types';

interface BandCollectionResponse {
  data: Band[];
  meta: { current_page: number; per_page: number; last_page: number; total: number };
}

// GET /bands?filter[musician_id]= — @Public() no backend (roster de banda
// não é PII sensível), mas usado aqui autenticado. Mesmo padrão de filtro
// aninhado de musician-search.api.ts (axios serializa em bracket notation).
// "Minhas bandas" = bandas onde o musicianId aparece como membro.
export async function listMyBands(musicianId: string): Promise<Band[]> {
  const { data } = await httpClient.get<BandCollectionResponse>('/bands', {
    params: { filter: { musician_id: musicianId }, per_page: 50 },
  });
  return data.data;
}

// GET /bands/:id — recurso único, envelope padrão.
export async function getBand(bandId: string): Promise<Band> {
  const { data } = await httpClient.get<ApiEnvelope<Band>>(`/bands/${bandId}`);
  return data.data;
}

// GET /scheduling/calendar/free-busy?target_type=band — mesma rota de
// calendar.api.ts (musician), só troca target_type. Adapter próprio (não
// importado de features/scheduling) porque FSD proíbe import cross-feature.
export async function getBandFreeBusy(
  bandId: string,
  startAtISO: string,
  endAtISO: string,
): Promise<BandFreeBusy> {
  const { data } = await httpClient.get<ApiEnvelope<BandFreeBusy>>('/scheduling/calendar/free-busy', {
    params: {
      target_type: 'band',
      target_id:   bandId,
      start_at:    startAtISO,
      end_at:      endAtISO,
    },
  });
  return data.data;
}

// PATCH /bands/:id/open-to-gigs — dedicado, mesmo racional do sub-recurso
// equivalente do músico (musician.api.ts updateOpenToGigs). Só o líder deve
// usar isso na UI (ver BandLeaderSettingsSection).
export async function updateBandOpenToGigs(bandId: string, open_to_gigs: boolean): Promise<Band> {
  const { data } = await httpClient.patch<ApiEnvelope<Band>>(`/bands/${bandId}/open-to-gigs`, { open_to_gigs });
  return data.data;
}

// PATCH /bands/:id — genérico, só o campo address (mesmo racional parcial de
// WizardMusicianPayload). Endereço próprio da banda, não herdado do líder.
export async function updateBandAddress(bandId: string, address: MusicianLocation | null): Promise<Band> {
  const { data } = await httpClient.patch<ApiEnvelope<Band>>(`/bands/${bandId}`, { address });
  return data.data;
}

// POST /bands/:id/members — cria convite "pending" (nunca adiciona membro
// direto). Se musician_id já teve convite "declined" nessa banda, o backend
// reativa pra "pending" sozinho em vez de dar erro — mesma chamada serve
// pra "convidar" e "convidar de novo".
export async function inviteBandMember(bandId: string, payload: CreateBandMemberInvitePayload): Promise<void> {
  await httpClient.post(`/bands/${bandId}/members`, payload);
}

// POST /bands/:id/invites/accept — sem body, musician_id sempre vem do JWT
// do usuário autenticado (não dá pra aceitar convite de outro).
export async function acceptBandInvite(bandId: string): Promise<void> {
  await httpClient.post(`/bands/${bandId}/invites/accept`);
}

// POST /bands/:id/invites/decline — idem, transiciona pra "declined".
export async function declineBandInvite(bandId: string): Promise<void> {
  await httpClient.post(`/bands/${bandId}/invites/decline`);
}

// DELETE /bands/:id/members/:musicianId — remove a linha do membro
// independente do status: serve tanto pra "expulsar membro aceito" quanto
// pra "cancelar convite pendente" (não existe endpoint separado de cancelar).
export async function removeBandMember(bandId: string, musicianId: string): Promise<void> {
  await httpClient.delete(`/bands/${bandId}/members/${musicianId}`);
}

/**
 * POST /bands — cria a banda com o músico autenticado já como **líder**.
 *
 * ⚠️ **Só os campos do `CreateBandDto` podem viajar.** Desde o INP-1 o backend
 * roda `forbidNonWhitelisted`, então um campo a mais no corpo deixou de ser
 * descartado em silêncio e virou **422** — o payload aqui é montado por
 * desestruturação explícita, nunca com spread de estado de formulário.
 *
 * `creator_musician_id` **não** é enviado de propósito: o controller o
 * sobrescreve com o `sub` do JWT. Mandá-lo daria a impressão de que o cliente
 * escolhe quem lidera.
 */
export async function createBand(payload: CreateBandPayload): Promise<Band> {
  const { data } = await httpClient.post<ApiEnvelope<Band>>('/bands', {
    name: payload.name,
    description: payload.description ?? null,
    genres: payload.genres,
    // Omitido = o líder ainda não decidiu (tri-state do backend: nunca nasce
    // `true`). Quem liga o radar é `PATCH /bands/:id/open-to-gigs`, com
    // consentimento explícito.
    ...(payload.open_to_gigs == null ? {} : { open_to_gigs: payload.open_to_gigs }),
  });
  return data.data;
}

/**
 * DELETE /bands/:id — dissolve a banda. 204, sem corpo.
 *
 * 🔴 Ação destrutiva e irreversível: a UI exige confirmação por digitação do
 * nome antes de chegar aqui. O backend só checa liderança (`BandOwnershipGuard`)
 * — nada impede o líder de apagar por engano uma banda com histórico de shows.
 */
export async function deleteBand(bandId: string): Promise<void> {
  await httpClient.delete(`/bands/${bandId}`);
}

/**
 * PATCH /bands/:id/leadership — passa a liderança para outro membro **aceito**.
 *
 * É o único caminho para trocar quem decide pela banda: remover ou rebaixar o
 * líder é bloqueado no backend justamente para não deixar a banda sem ninguém
 * que possa aceitar um show. Membro `pending` é recusado com 422.
 */
export async function transferBandLeadership(
  bandId: string,
  newLeaderMusicianId: string,
): Promise<Band> {
  const { data } = await httpClient.patch<ApiEnvelope<Band>>(
    `/bands/${bandId}/leadership`,
    { new_leader_musician_id: newLeaderMusicianId },
  );
  return data.data;
}
