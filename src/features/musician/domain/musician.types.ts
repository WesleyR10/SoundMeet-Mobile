// Payload aceito por PATCH /musicians/:id (UpdateMusicianInput no backend) —
// só o subconjunto de campos que o wizard escreve. Todos opcionais porque o
// backend aceita update parcial (UpdateMusicianInput inteiro é @IsOptional())
// — o accordion de edição (Bloco 2) salva por seção, então cada chamada só
// preenche o(s) campo(s) daquele tópico.
export interface WizardMusicianPayload {
  stage_name?: string;
  bio?:        string;
  instruments?: string[];
  genres?:      string[];
  // Opt-in de radar (jul/2026) — tri-state, nunca setado automaticamente pelo
  // wizard; só a decisão explícita do músico (OpenToGigsDecisionSheet ou
  // seção "Disponibilidade" do perfil) escreve aqui.
  open_to_gigs?: boolean | null;
}

export type PriceRangeModel = 'per_hour' | 'per_event';

// Espelha PriceRangeInput/MusicianProfileOutput["price_ranges"] do backend —
// uma faixa por modelo de cobrança (por hora e/ou por evento).
export interface PriceRange {
  model:    PriceRangeModel;
  min:      number;
  max:      number;
  currency: 'BRL';
  notes:    string | null;
}

// Backend aceita Record<string, unknown> livre — restringimos às chaves que o
// app efetivamente lê/escreve (Bloco 2).
export interface SocialLinks {
  instagram?: string;
  youtube?:   string;
  spotify?:   string;
}

export interface MusicianLocation {
  city:      string | null;
  state:     string | null;
  latitude:  number | null;
  longitude: number | null;
  // Endereço detalhado (opcional, autofill via CEP/ViaCEP) — backend
  // Location VO estendido em jul/2026; perfis antigos vêm com null.
  street:       string | null;
  number:       string | null;
  complement:   string | null;
  neighborhood: string | null;
  zip_code:     string | null;
}

// Espelha QRCustomization (backend, shared/domain/value-objects/qr-code.vo.ts)
// — feature PRO (POST /musicians/:id/qr-code/customize + /qr-code/logo).
export interface QRCustomization {
  foreground_color?: string;
  background_color?: string;
  logo_url?:          string;
  label?:             string;
}

// Espelha QRCustomizationPatch (backend) — payload de POST .../qr-code/customize.
// Semântica de JSON merge patch: campo ausente = mantém; valor = define; `null`
// = remove a chave (reverte ao padrão). `logo_url` só aceita null aqui (setar
// um logo novo exige o endpoint dedicado POST .../qr-code/logo).
export interface QRCustomizationPatch {
  foreground_color?: string | null;
  background_color?: string | null;
  logo_url?:          null;
  label?:             string | null;
}

// Espelha MusicianProfileOutput (sub-aggregate `profile`) do backend —
// campos estendidos que o wizard não coleta (Bloco 1.13 só grava o topo:
// stage_name/bio/instruments/genres/avatar).
export interface MusicianProfileDetails {
  id:           string;
  musician_id:  string;
  price_ranges: PriceRange[];
  location:     MusicianLocation;
  social_links: SocialLinks | null;
  experience:   number;
  instruments:  string[];
  genres:       string[];
}

// MusicianPresenter completo (GET /musicians/:id) — usado pelo wizard/gate
// (campos do topo) e pelas telas de Bloco 2 (campos estendidos + profile).
export interface MusicianProfile {
  id:               string;
  email:            string;
  name:             string;
  stage_name:       string | null;
  bio:              string | null;
  avatar:           string | null;
  phone:            string | null;
  qr_code:          string | null;
  qr_customization: QRCustomization | null;
  // Só vem populado pelo GET /musicians/:id (GetMusicianUseCase injeta
  // PlanCheckService) — ausente em respostas de PATCH/POST. Sempre confiar
  // no valor mais recente via useMusician() (refetch), nunca no corpo de uma
  // mutation.
  plan_tier?:       string;
  rating:           number;
  total_ratings:    number;
  is_active:        boolean;
  is_verified:      boolean;
  genres:           string[];
  instruments:      string[];
  experience_years: number;
  display_name:     string;
  is_experienced:   boolean;
  is_highly_rated:  boolean;
  profile:          MusicianProfileDetails | null;
  // Opt-in de radar (jul/2026) — tri-state: null = ainda não decidiu, nunca
  // nasce true. Só músico com open_to_gigs === true aparece em GET /musicians
  // (busca de estabelecimento), no hiring-dashboard e na recomendação de
  // audiência. Setável em POST/PATCH /musicians e no PATCH .../open-to-gigs
  // dedicado (useUpdateOpenToGigs).
  open_to_gigs:     boolean | null;
}

// Payload aceito por PATCH /musicians/:id/profile (UpdateMusicianProfileInput
// no backend) — chaves em camelCase, ao contrário do PATCH /musicians/:id.
export interface UpdateMusicianProfilePayload {
  priceRanges?: { model: PriceRangeModel; min: number; max: number; currency?: 'BRL'; notes?: string | null }[] | null;
  location?:    {
    city?: string | null; state?: string | null;
    latitude?: number | null; longitude?: number | null;
    street?: string | null; number?: string | null; complement?: string | null;
    neighborhood?: string | null; zip_code?: string | null;
  };
  experience?:  number;
  instruments?: string[];
  genres?:      string[];
  socialLinks?: SocialLinks | null;
}

export interface UpdatePixKeyPayload {
  pix_key:      string;
  pix_key_type: string;
}

// Subconjunto do MusicianWalletPresenter usado pelo step de PIX do wizard e
// pela Home (Bloco 10.3, saldo). `balance`/`total_earned`/`total_withdrawn`
// já vêm do backend (MusicianWalletOutput) — só não estavam tipados aqui
// porque nenhuma tela lia esses campos até agora.
export interface MusicianWallet {
  id:               string;
  musician_id:      string;
  pix_key:          string | null;
  balance:          number;
  total_earned:     number;
  total_withdrawn:  number;
}
