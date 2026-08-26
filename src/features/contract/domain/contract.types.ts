/**
 * Contrato digital de show — tipos do snapshot congelado.
 *
 * Lidos de `ContractPresenter`
 * (`../soundmeet-backend/src/nest-modules/contract-module/contract.presenter.ts`).
 * Tudo snake_case na leitura, como o resto de `scheduling`.
 *
 * ⚠️ **`document_key` e `certificate_key` NÃO existem aqui, e isso é a feature.**
 * São chaves de storage privado; o presenter as omite de propósito e
 * `IContractStorage` deliberadamente não tem `getPublicUrl`. O download passa
 * por `GET /contracts/:id/document`, que autoriza e faz stream.
 */

export const CONTRACT_STATUSES = [
  'issued',
  'partially_signed',
  'signed',
  'annulled',
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

/**
 * `contractor` é sempre o estabelecimento; `contracted`, o artista.
 *
 * O app é a persona músico, então na prática o "meu lado" é `contracted` — mas
 * isso é DERIVADO do contrato (ver `resolveMySide`), nunca cravado. Quem decide
 * de verdade é `resolveSigningRole` no backend, a partir do JWT.
 */
export type ContractPartyRole = 'contractor' | 'contracted';

export type ContractPartyKind = 'individual' | 'company';

export interface ContractPartyAddress {
  street:       string | null;
  number:       string | null;
  complement:   string | null;
  neighborhood: string | null;
  city:         string | null;
  state:        string | null;
  zip_code:     string | null;
}

export interface ContractPartyRepresentative {
  name:     string;
  document: string | null;
}

export interface ContractParty {
  role:           ContractPartyRole;
  kind:           ContractPartyKind;
  legal_name:     string;
  display_name:   string | null;
  document:       string;
  email:          string;
  phone:          string | null;
  address:        ContractPartyAddress;
  representative: ContractPartyRepresentative | null;
}

/**
 * Cláusula JÁ renderizada. `body` é texto final, com parágrafos separados por
 * linha em branco — o backend já refluiu as quebras do arquivo-fonte
 * (`RenderedClause` VO). Renderizar nativamente é o desenho: o snapshot é a
 * fonte, o PDF é derivado dele.
 */
export interface RenderedClause {
  number:     number;
  key:        string;
  variant_id: string;
  category:   string;
  title:      string;
  body:       string;
}

/**
 * Anexo I — a Ficha Técnica do Palco congelada na emissão.
 *
 * Campos obrigatórios e nuláveis (não opcionais) de propósito: é a forma exata
 * de `StageTechSpecJSON` no backend, e é o que faz este tipo satisfazer
 * `StageTechSpecView` de `shared/components/StageTechSpecSection` por tipagem
 * estrutural, sem nenhuma conversão.
 *
 * `null` num campo significa **"não informado"**, nunca "não tem": a ausência
 * de PA é `hasPa: false`, e as duas coisas são informações diferentes.
 */
export interface StageTechSpecSnapshot {
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

export interface ContractSignature {
  role:            ContractPartyRole;
  signer_name:     string;
  signer_document: string | null;
  signer_email:    string;
  signer_user_id:  string;
  /** ISO 8601. */
  signed_at:       string;
  method:          string;
  ip:              string | null;
  ip_source:       string;
  forwarded_for:   string | null;
  user_agent:      string | null;
}

/**
 * Variáveis resolvidas e **já formatadas em pt-BR pelo backend**.
 *
 * ⚠️ **Não reformatar nada daqui.** `cache_formatado`, `data_show` e
 * `duracao_formatada` são o texto que foi para dentro do documento assinado;
 * refazer a formatação no cliente criaria uma segunda verdade sobre um
 * instrumento congelado. Os campos numéricos crus existem para cálculo, não
 * para exibição.
 */
export interface ContractVariables {
  contratante_nome:          string;
  contratante_documento:     string;
  contratante_endereco:      string;
  contratante_representante: string | null;
  contratado_nome:           string;
  contratado_documento:      string;
  contratado_endereco:       string;
  contratado_representante:  string | null;
  contratado_e_banda:        boolean;
  contratado_integrantes:    string[];

  data_show:          string;
  dia_semana:         string;
  hora_inicio:        string;
  hora_fim:           string;
  duracao_formatada:  string;
  duracao_minutos:    number;
  local_nome:         string;
  local_endereco:     string;
  comarca:            string;
  fuso_horario:       string;

  cache_valor:            number;
  cache_formatado:        string;
  cache_extenso:          string;
  pagamento_prazo_texto:  string;
  custodiante_nome:       string | null;

  cancelamento_janela_horas:      number;
  cancelamento_multa_percentual:  number;
  cancelamento_multa_formatada:   string;

  passagem_som_janela:  string | null;
  ficha_tecnica_resumo: string | null;
  /**
   * ⚠️ **Ausente, nunca `null`**, quando a casa não preencheu a ficha — é a
   * invariante que preserva o `content_hash` dos contratos emitidos antes de
   * este campo existir. Renderize por presença (`ficha_tecnica_anexo ? …`),
   * jamais comparando com `null`.
   *
   * 🔴 **Nunca substituir pela ficha atual do estabelecimento.** O documento é
   * congelado; a ficha do perfil muda. Mostrar a atual exibiria como parte do
   * contrato algo que não estava lá quando ele foi assinado.
   */
  ficha_tecnica_anexo?: StageTechSpecSnapshot;

  tolerancia_atraso_minutos: number;
  hora_extra_valor_formatado: string;
  exclusividade_raio_km:     number | null;
  exclusividade_dias:        number | null;
  imagem_prazo_meses:        number;

  plataforma_nome:      string;
  plataforma_documento: string;
  codigo_verificacao:   string;
  url_verificacao:      string;
  emitido_em:           string;
}

export interface Contract {
  id:               string;
  booking_id:       string;
  establishment_id: string;
  musician_id:      string | null;
  band_id:          string | null;
  revision:         number;
  template_version: string;
  status:           ContractStatus;
  contractor:       ContractParty;
  contracted:       ContractParty;
  clauses:          RenderedClause[];
  variables:        ContractVariables;
  signatures:       ContractSignature[];
  /** SHA-256 do conteúdo — o mesmo impresso no rodapé do PDF. */
  content_hash:     string;
  verification_code: string;
  has_document:     boolean;
  /** Anexo II — só existe depois das DUAS assinaturas. */
  has_certificate:  boolean;
  /** Lados que ainda não assinaram. Vem pronto; o cliente não recalcula. */
  pending_signatures: ContractPartyRole[];
  issued_at:        string;
  signed_at:        string | null;
  annulled_at:      string | null;
  annul_reason:     string | null;
  created_at:       string;
  updated_at:       string;
}

export interface ContractPaginationMeta {
  current_page: number;
  per_page:     number;
  last_page:    number;
  total:        number;
}

/**
 * Resposta do pedido de código de assinatura.
 *
 * 🔴 **Nunca traz o código** — ele vai para o e-mail congelado da parte. Aqui
 * chega só o destino mascarado, para a pessoa conferir em qual caixa procurar.
 */
export interface SignatureChallenge {
  role:                ContractPartyRole;
  /** `a****@exemplo.com` — confirma o destino sem expor o e-mail. */
  destination_masked:  string;
  expires_at:          string;
}

/**
 * Resultado de `POST /contracts/:id/document/send`.
 *
 * A rota manda o PDF **só para o e-mail congelado de quem pediu** — nunca para
 * a outra parte, nunca para um destino do corpo. É por isso que ela é a forma
 * de "baixar" o contrato no app: o documento carrega CPF, CNPJ, endereço e
 * cachê, e a caixa de entrada da própria pessoa é um destino mais seguro (e
 * mais útil, porque persiste fora do telefone) que o sistema de arquivos.
 */
export interface ContractDelivery {
  delivered:          ContractPartyRole[];
  failed:             { role: ContractPartyRole; reason: string }[];
  document_available: boolean;
}
