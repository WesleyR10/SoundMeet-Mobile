import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RegisterRole } from '@/features/auth/domain/auth.types';

// ── Auth ──────────────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Onboarding:              undefined;
  RoleSelection:           undefined;
  Register:                { role: RegisterRole };
  Login:                   undefined;
  CompleteMusicianSignup:  undefined;
};

// ── Músico — Perfil (nested stack dentro da tab Profile) ─────────────────────

export type ProfileStackParamList = {
  ViewProfile: undefined;
  EditProfile: undefined;
  QRCode:      undefined;
  Analytics:   undefined;
  Tuner:       undefined;
  // Gestão de banda somente-leitura (v1, jul/2026) — ver MyBandsScreen.
  MyBands:     undefined;
  BandDetail:  { bandId: string };
};

// ── Músico — Repertório (nested stack dentro da tab Repertoire, Bloco 7) ─────

export type RepertoireStackParamList = {
  RepertoireList:     undefined;
  RepertoireDetail:   { repertoireId: string };
  CreateRepertoire:   undefined;
  EditRepertoire:      { repertoireId: string };
  RepertoireInvites:  undefined;
  CifraSearch:        { repertoireId: string };
  PlayMode:           { repertoireId: string; musicLibraryId: string };
  // Modo Ensaio (S3) — tela separada do Play Mode de propósito: aquela é a de
  // palco (fonte grande, zero distração, transmite "tocando agora"); esta tem
  // mesa de stems e controle de velocidade, que no palco só atrapalhariam.
  PracticeMode:       { repertoireId: string; musicLibraryId: string };
  ChordSheetsHub:            undefined;
  PersonalChordSheetList:    undefined;
  AddPersonalChordSheet:     undefined;
  PersonalChordSheetEditor:  { personalChordSheetId: string };
  CommunityChordSheetList:   undefined;
  CommunityChordSheetDetail: { personalChordSheetId: string };
  ImportCommunityChordSheet: { sourcePersonalChordSheetId: string };
};

// ── Músico — Tabs ─────────────────────────────────────────────────────────────

export type MusicianTabParamList = {
  Home:          undefined;
  LiveDashboard: undefined;
  Repertoire:    NavigatorScreenParams<RepertoireStackParamList>;
  Wallet:        undefined;
  Profile:       NavigatorScreenParams<ProfileStackParamList>;
};

// ── Fã — Stacks compartilhadas (Bloco 11) ────────────────────────────────────
// Mesmo ParamList usado por DUAS instâncias de native-stack (Home e Explore) —
// não duas stacks mirroring uma a outra: é o MESMO tipo, registrado duas
// vezes, então telas de drill-down (EstablishmentDetail/MusicianPublicProfile/
// SongRequest/TipMusician) tipam idêntico em ambas sem duplicar declaração.
// `FanHome`/`FanExplore`/`QRScanner` opcionais porque só uma instância usa
// cada rota-raiz.
export type FanSharedStackParamList = {
  FanHome?:    undefined;
  FanExplore?: undefined;
  EstablishmentDetail:   { establishmentId: string };
  // Descoberto durante a implementação (não estava em nenhum bloco do
  // roadmap): tocar num evento precisa mostrar QUEM toca nele antes do fã
  // poder escolher pra quem pedir música/dar gorjeta — SongRequest exige
  // musicianId + eventId juntos, e um evento pode ter mais de um performer.
  EventPerformers:       { establishmentId: string; eventId: string };
  MusicianPublicProfile: { musicianId: string; eventId?: string; establishmentId?: string };
  SongRequest:           { musicianId: string; eventId: string; establishmentId?: string };
  TipMusician:           { musicianId: string; eventId?: string; establishmentId?: string };
  QRScanner?: undefined;
};

export type FanProfileStackParamList = {
  FanProfile:   undefined;
  Gamification: undefined;
  Leaderboard:  undefined;
};

// ── Fã — Tabs (Bloco 10.4 shell + Bloco 11 telas reais) ──────────────────────

export type FanTabParamList = {
  Home:    NavigatorScreenParams<FanSharedStackParamList>;
  Explore: NavigatorScreenParams<FanSharedStackParamList>;
  Profile: NavigatorScreenParams<FanProfileStackParamList>;
};

// ── Root ──────────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  AuthStack:           NavigatorScreenParams<AuthStackParamList>;
  MusicianSetupWizard: undefined;
  MusicianTabs:        NavigatorScreenParams<MusicianTabParamList>;
  FanTabs:             NavigatorScreenParams<FanTabParamList>;
  // Alcançável via deep link (soundmeet://repertoire/shared/:token),
  // registrada só quando autenticado (qualquer role) — ver RootNavigator e
  // shared/services/deep-linking/. Não é filha de MusicianTabs/FanTabs de
  // propósito: precisa ser alcançável a partir de QUALQUER um dos dois.
  SharedRepertoire:    { token: string };
  SharedSongViewer:    { token: string; musicLibraryId: string };
  // Chat com estabelecimentos (Bloco 9) — mesmo racional de
  // SharedRepertoire/SharedSongViewer: alcançável a partir da Home do
  // músico (tile "Agenda", sem stack própria) e do tap numa notificação
  // push, nenhum dos dois casos é filho natural de MusicianTabs.
  ConversationList:    undefined;
  // Agenda do músico (disponibilidade + shows do mês) — mesma lógica do chat:
  // alcançável a partir da Home (tile "Agenda") sem stack própria.
  Agenda:              undefined;
  AvailabilityEditor:  undefined;
  // Propostas de show recebidas (A3/F1.2) — quem aceita ou recusa é o MÚSICO
  // (`@Roles("musician")` em PATCH /scheduling/inquiries/:id/accept), então a
  // decisão só pode acontecer aqui. Root e não tab: o tab bar do músico está
  // fixo em 5 rotas com ícones declarados à mão em MusicianTabBar.
  InquiryList:         undefined;
  // Contratos de show (B4 / Bloco 10) — mesmo racional de InquiryList: o tab
  // bar do músico está fixo em 5 rotas com ícones à mão. Alcançável pelo tile
  // da Home e pela linha do Perfil.
  //
  // 🔴 No app do músico, **o contrato é a tela do show**: não existe lista de
  // bookings aqui (`GET /scheduling/bookings` não é chamado em nenhum lugar de
  // `src/`), e o snapshot já carrega data, horário, local, cachê e a Ficha
  // Técnica. Construir uma lista de bookings só para isto seria duplicar o que
  // o contrato já tem.
  ContractList:        undefined;
  ContractDetail:      { contractId: string };
  // Apresentação ao vivo (F0/F4/F6) — mesmo racional de ContractList: o tab bar
  // do músico está fixo em 5 rotas. O relatório é alcançado ao encerrar o show
  // (push automático da LiveDashboard) e pelo histórico; o currículo, pelo
  // Perfil.
  PerformanceReport:   { performanceId: string };
  PerformanceHistory:  undefined;
  MyResume:            undefined;
  // F5 — alcançável a partir do card de show da tela Ao Vivo: é ali que o
  // músico está na casa, e o `establishment_id` já é conhecido sem ele escolher.
  SetlistSuggestions:  { establishmentId: string; establishmentName?: string };
  // Paywall de planos do músico — alcançável a partir do HomeAvatarMenu
  // (linha "Plano X") e, futuramente, dos gates de plano (afinador, QR).
  Plans:               undefined;
  Chat: {
    conversationId:      string;
    establishmentName?:  string;
    establishmentAvatar?: string | null;
  };
};

// ── Helpers de tipagem para screens ───────────────────────────────────────────
// Uso: type Props = AuthScreenProps<'Login'>

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MusicianTabScreenProps<T extends keyof MusicianTabParamList> =
  BottomTabScreenProps<MusicianTabParamList, T>;

export type FanTabScreenProps<T extends keyof FanTabParamList> =
  BottomTabScreenProps<FanTabParamList, T>;

export type ProfileScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;

export type RepertoireScreenProps<T extends keyof RepertoireStackParamList> =
  NativeStackScreenProps<RepertoireStackParamList, T>;

export type FanStackScreenProps<T extends keyof FanSharedStackParamList> =
  NativeStackScreenProps<FanSharedStackParamList, T>;

export type FanProfileScreenProps<T extends keyof FanProfileStackParamList> =
  NativeStackScreenProps<FanProfileStackParamList, T>;
