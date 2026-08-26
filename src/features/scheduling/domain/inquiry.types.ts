// Domínio puro, sem imports de RN/Expo.
//
// Tipos próprios (não importados de features/audience/domain/establishment.types)
// porque FSD proíbe import cross-feature — mesmo precedente já documentado em
// features/audience/domain/musician-public.types.ts e features/musician/
// infrastructure/band.api.ts. Espelham `InquiryPresenter` e
// `EstablishmentPresenter` do backend.

/** `CollectionPresenter` do backend. Duplicado pelo mesmo motivo de FSD acima. */
export interface InquiryPaginationMeta {
  current_page: number;
  per_page:     number;
  last_page:    number;
  total:        number;
}

/** `InquiryStatusEnum` — core/shared/domain/value-objects/inquiry-status.vo.ts */
export type InquiryStatus = 'open' | 'accepted' | 'rejected' | 'converted' | 'expired';

/**
 * Proposta de contratação enviada por um estabelecimento.
 *
 * ⚠️ **Carrega só `establishment_id`.** Sem nome, sem avatar, sem perfil e sem
 * ficha técnica — diferente de `GET /conversations`, que enriquece a resposta
 * com um resumo do estabelecimento. Quem quiser exibir a casa precisa de uma
 * segunda busca em `GET /establishments/:id` (que é público).
 */
export interface Inquiry {
  id:               string;
  establishment_id: string;
  musician_id:      string | null;
  /** Preenchido quando a proposta é para a BANDA, não para o músico direto. */
  band_id:          string | null;
  event_id:         string | null;
  subject:          string | null;
  initial_message:  string | null;
  status:           InquiryStatus;
  /** ISO. Default do backend: criação + 7 dias. */
  expires_at:       string | null;
  accepted_at:      string | null;
  rejected_at:      string | null;
  rejection_reason: string | null;
  converted_at:     string | null;
  booking_id:       string | null;
  created_at:       string;
  updated_at:       string;
}

/** Ficha técnica do palco (A3). Espelha `StageTechSpecJSON` do backend. */
export interface StageTechSpec {
  hasPa:            boolean | null;
  mixerChannels:    number | null;
  monitors:         number | null;
  hasMicrophones:   number | null;
  backline:         string[];
  dimensions:       { widthM: number | null; depthM: number | null; heightM: number | null } | null;
  power:            { outlets: number | null; voltage: string | null } | null;
  hasParking:       boolean | null;
  hasSoundEngineer: boolean | null;
  soundcheckWindow: string | null;
  notes:            string | null;
}

/**
 * Só o que esta feature lê de `GET /establishments/:id`.
 *
 * Recorte deliberado: o presenter devolve muito mais (QR code, analytics,
 * cardápio…), e declarar o objeto inteiro aqui criaria um segundo lugar para
 * manter sincronizado sem nenhum ganho.
 */
export interface InquiryEstablishment {
  id:          string;
  name:        string;
  avatar:      string | null;
  description: string | null;
  profile: {
    location:        Record<string, unknown> | null;
    stage_tech_spec: StageTechSpec | null;
  } | null;
}
