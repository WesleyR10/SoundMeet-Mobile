# Roadmap Mobile — SoundMeet

> **Próxima tarefa = primeiro item `[ ]` da lista abaixo.**
> Não pule a ordem sem confirmação. Cada bloco depende do anterior.
> Referências: `Docs/soundmeet-mobile-plan.md`, `Docs/design-system.md`, `../soundmeet-backend/Docs/roadmap.md`

---

## Bloco 0 — Fundação (configuração do projeto)

> Setup que precisa existir antes de qualquer feature. Não implementar screens enquanto houver `[ ]` aqui.

- [x] **0.1** — Expo SDK 56 + EAS inicializado (`app.json`, `eas.json`, `bundle identifier: com.soundmeet.app`)
- [x] **0.2** — Dependências principais instaladas (React Navigation, Reanimated 4, Moti, TanStack Query, Zustand, Axios, NativeWind, Lucide)
- [x] **0.3** — `babel.config.js` configurado (NativeWind + Reanimated plugin)
- [x] **0.4** — `tailwind.config.js` configurado (NativeWind preset + tokens de cor da marca)
- [x] **0.5** — Estrutura FSD criada (`src/features/`, `src/shared/`, `src/navigation/`, `src/app/`)
- [x] **0.6** — Design system tokens codificados (`src/shared/design-system/tokens.ts`)
- [x] **0.7** — ThemeContext + `useTheme` hook (dark/light mode toggle com persistência SecureStore + sync NativeWind `dark:` classes)
- [x] **0.8** — Path aliases TypeScript (`@/shared`, `@/navigation`, `@/app`, `@/features`) em `tsconfig.json` + `metro.config.js` (resolver.alias); `nativewind-env.d.ts` criado; `global.css` criado para NativeWind v4
- [x] **0.9** — Variáveis de ambiente: `src/shared/services/config/env.ts` (API_URL, Keycloak URLs tipados) + `.env.example`
- [x] **0.10** — Fontes: `@expo-google-fonts/space-grotesk`, `inter`, `jetbrains-mono` instalados; carregados via `useFonts` com nomes exatos dos tokens (`SpaceGrotesk-Bold`, `Inter-Regular`, etc.); `tailwind.config.js` reestruturado com cores aninhadas + `fontFamily` mapeado
- [x] **0.11** — HTTP client: `src/shared/services/http/types.ts` (ApiError, isApiError, extractApiMessage) + `src/shared/services/http/client.ts` (Axios, interceptors esqueleto com marcação `[BLOCO 1]`)
- [x] **0.12** — TanStack Query: `src/shared/services/query/query-client.ts` (QueryClient com `networkMode: offlineFirst`, retry inteligente 4xx, gcTime 10 min)
- [x] **0.13** — Zustand auth store: `src/shared/services/auth/auth.store.ts` (AuthUser tipado, isLoading=false para Block 0, getAccessToken() imperativo para interceptors)
- [x] **0.14** — Navegação base tipada: `src/navigation/types.ts` (RootStackParamList, AuthStackParamList, MusicianTabParamList + helpers de screen props); `AuthNavigator`, `MusicianTabNavigator` (5 tabs, Lucide icons), `RootNavigator` (NavigationContainer + marcação `[BLOCO 1]` para auth guard)
- [x] **0.15** — `App.tsx` provider tree completo (`GestureHandlerRootView → SafeAreaProvider → ThemeProvider → QueryClientProvider → RootNavigator`); SplashScreen + useFonts; `index.ts` com `enableScreens()` antes de registerRootComponent

---

## Bloco 1 — Autenticação (Keycloak PKCE)

> Bloqueia tudo. Sem auth não existe sessão, nem chamadas autenticadas à API.

- [ ] **1.1** — Auth service: `src/shared/services/auth/keycloak.service.ts` com `login()` via `expo-auth-session` (PKCE flow) e `logout()`
- [ ] **1.2** — Token storage: `src/shared/services/storage/token.storage.ts` (expo-secure-store — access token, refresh token, expiry)
- [ ] **1.3** — Interceptor Axios JWT: attach `Authorization: Bearer <token>` em toda requisição
- [ ] **1.4** — Interceptor Axios refresh: detectar 401 → renovar token → retentar requisição original; 401 em refresh → logout
- [ ] **1.5** — Auth guard no `RootNavigator`: redirecionar para `AuthStack` se não autenticado; para `MusicianTabs` se autenticado
- [ ] **1.6** — Tela: `OnboardingScreen` (splash de boas-vindas, logo animada, botão "Entrar com SoundMeet")
- [ ] **1.7** — Tela: `LoginScreen` (inicia o PKCE flow via `keycloak.service.ts`)
- [ ] **1.8** — Claims do token: extrair `musician_id`, `roles` do JWT e popular `auth.store.ts`

**Pré-requisito backend:** Keycloak configurado com redirect URI `soundmeet://auth/callback` ✅

---

## Bloco 2 — Perfil do Músico

- [ ] **2.1** — Domain types: `src/features/musician/domain/musician.types.ts` (MusicianProfile, CreateMusicianDto, UpdateMusicianDto)
- [ ] **2.2** — API adapter: `src/features/musician/infrastructure/musician.api.ts` (`getMusician`, `createMusician`, `updateMusician`)
- [ ] **2.3** — Hook: `src/features/musician/application/useMusician.ts` (TanStack Query — queries + mutations)
- [ ] **2.4** — Tela: `CreateProfileScreen` (formulário de criação de perfil — nome artístico, instrumento, gêneros, bio, foto)
- [ ] **2.5** — Tela: `EditProfileScreen` (editar perfil existente)
- [ ] **2.6** — Tela: `ViewProfileScreen` (visualizar próprio perfil com stats)
- [ ] **2.7** — Upload de foto de perfil (expo-image-picker + upload S3 via endpoint do backend)

**Endpoints backend:** `POST /api/v1/musicians`, `GET /api/v1/musicians/:id`, `PATCH /api/v1/musicians/:id` ✅

---

## Bloco 3 — QR Code do Músico

- [ ] **3.1** — Tela: `QRCodeScreen` — exibir QR Code gerado pelo backend (`GET /api/v1/musicians/:id` → campo `qr_code_url`)
- [ ] **3.2** — Compartilhar QR Code: instalar `expo-sharing` + botão "Compartilhar"
- [ ] **3.3** — Download do QR Code para galeria (expo-media-library)

**Pré-requisito backend:** campo `qr_code_url` no presenter do músico ✅

---

## Bloco 4 — Pedidos ao Vivo (core do produto)

> Tela principal de uso durante shows. Prioridade máxima de UX: legibilidade, gestos, performance.

- [ ] **4.1** — Domain types: `src/features/musician/domain/request.types.ts` (MusicRequest, RequestStatus)
- [ ] **4.2** — API adapter: `src/features/musician/infrastructure/request.api.ts` (`listRequests`, `acceptRequest`, `rejectRequest`)
- [ ] **4.3** — Instalar `socket.io-client` + configurar `src/shared/services/websocket/socket.client.ts`
- [ ] **4.4** — WebSocket hook: `src/features/musician/application/useRequestsSocket.ts` — receber novos pedidos em tempo real via Socket.io
- [ ] **4.5** — Hook: `src/features/musician/application/useRequests.ts` (lista + mutações accept/reject)
- [ ] **4.6** — Tela: `LiveDashboardScreen` — lista de pedidos pendentes (fonte mínima 18px, dark mode máximo contraste)
- [ ] **4.7** — Swipe gesture no card de pedido: direita = aceitar, esquerda = rejeitar (Reanimated 4 + Gesture Handler)
- [ ] **4.8** — `expo-keep-awake` ativo enquanto `LiveDashboardScreen` estiver montada
- [ ] **4.9** — Push notification: novo pedido recebido (handler em `expo-notifications`)

**Endpoints backend:** `GET /api/v1/requests`, `POST /api/v1/requests/:id/accept`, `POST /api/v1/requests/:id/reject` ✅

---

## Bloco 5 — Gorjetas (histórico + notificação)

- [ ] **5.1** — Domain types: `src/features/payment/domain/tip.types.ts` (Tip, Wallet, WithdrawEligibility)
- [ ] **5.2** — API adapter: `src/features/payment/infrastructure/wallet.api.ts` (`getWallet`, `listTips`)
- [ ] **5.3** — Hook: `src/features/payment/application/useWallet.ts`
- [ ] **5.4** — Tela: `WalletScreen` — saldo, histórico de gorjetas recebidas, indicador de elegibilidade para saque
- [ ] **5.5** — Componente: `WithdrawProgressBar` — "Você está a R$X de poder sacar" + prazo estimado (4D.7)
- [ ] **5.6** — Push notification: gorjeta recebida (valor + nome do fã)

**Endpoints backend:** `GET /api/v1/musicians/:id/wallet` ✅

---

## Bloco 6 — Analytics básico pós-evento

- [ ] **6.1** — API adapter: `src/features/musician/infrastructure/analytics.api.ts` (`getAnalytics`)
- [ ] **6.2** — Hook: `src/features/musician/application/useAnalytics.ts`
- [ ] **6.3** — Tela: `AnalyticsScreen` — cards com pedidos aceitos/rejeitados, gorjetas do evento, músicas mais pedidas

**Endpoints backend:** `GET /api/v1/musicians/:id/analytics` ✅

---

## Bloco 7 — Repertório + Play Mode

> Play Mode = teleprompter musical. Tela que o músico usa NO PALCO enquanto toca.

- [ ] **7.1** — Domain types: `src/features/musician/domain/repertoire.types.ts` (Repertoire, Song, ChordSheet, ChordToken)
- [ ] **7.2** — API adapters: `repertoire.api.ts` + `song.api.ts` + `chord-sheet.api.ts` (ai-cifra endpoints)
- [ ] **7.3** — Hook: `useRepertoire.ts`, `useSong.ts`, `useChordSheet.ts`
- [ ] **7.4** — Tela: `RepertoireListScreen` — lista de repertórios do músico
- [ ] **7.5** — Tela: `RepertoireDetailScreen` — músicas do repertório
- [ ] **7.6** — Tela: `CreateRepertoireScreen` / `EditRepertoireScreen`
- [ ] **7.7** — Tela: `SongDetailScreen` — cifra em modo leitura (chord tokens posicionados acima das letras)
- [ ] **7.8** — **Play Mode** (4D.2) — tela fullscreen de performance:
  - [ ] **7.8a** — Cifra + letra renderizadas token a token; chords em teal, letras em branco; fonte mínima 18px
  - [ ] **7.8b** — Linha atual destacada (glow teal), linhas passadas em muted, futuras em dim
  - [ ] **7.8c** — Auto-scroll configurável (velocidade) (4D.2c)
  - [ ] **7.8d** — Badge de pedidos pendentes no topo (tappable → LiveDashboard) (4D.2 nota)
  - [ ] **7.8e** — Botões mínimos: ← música anterior | pausar scroll | → próxima música
  - [ ] **7.8f** — `expo-keep-awake` ativo; StatusBar oculta
  - [ ] **7.8g** — Badge "customizada" em músicas com `custom_notes` (4D.2b)

**Pré-requisito backend:** repertório + ai-cifra completos ✅

---

## Bloco 8 — Afinador cromático

- [ ] **8.1** — Verificar permissão de microfone (expo-av) + solicitar em runtime
- [ ] **8.2** — Algoritmo de detecção de pitch: YIN ou autocorrelação via `expo-av` audio recording + análise no JS thread
- [ ] **8.3** — Tela: `TunerScreen` — fullscreen, sem distração; nota detectada em display grande; indicador de centavos (+/-); agulha animada (Reanimated 4)
- [ ] **8.4** — Guard de plano: verificar se músico tem acesso ao afinador (todos os planos têm básico)

**Pré-requisito backend:** `tuner_noise_filter` em `MusicianPlanFeatures` (7.6a — pendente backend)

---

## Bloco 9 — Chat com Estabelecimentos (WebSocket)

- [ ] **9.1** — WebSocket service (`src/shared/services/websocket/`) já tem estrutura — implementar `connect`, `disconnect`, `subscribe`
- [ ] **9.2** — API adapter: `src/features/scheduling/infrastructure/conversation.api.ts` (`listConversations`, `getMessages`, `sendMessage`)
- [ ] **9.3** — Hook: `useConversations.ts` + `useChat.ts` (TanStack Query + Socket.io para mensagens em tempo real)
- [ ] **9.4** — Tela: `ConversationListScreen` — lista de conversas com estabelecimentos
- [ ] **9.5** — Tela: `ChatScreen` — chat individual (bubbles, input, envio em tempo real)

**Endpoints backend:** `/api/v1/conversations` + WebSocket ✅

---

## Bloco 10 — Bottom Tab Navigation (músico) + Home

> Deve ser implementada assim que os Blocos 1-3 estiverem prontos, para dar estrutura visual ao app.

- [ ] **10.1** — `MusicianTabNavigator.tsx` com tabs: Home | Ao Vivo | Repertório | Gorjetas | Perfil
- [ ] **10.2** — Ícones Lucide por tab + badge de contagem (pedidos pendentes)
- [ ] **10.3** — Tela: `HomeScreen` do músico — boas-vindas, acesso rápido para Live, QR Code, Repertório; saldo resumido

---

## Bloco 11 — MVP Público (Fase 2)

> Iniciar somente após Bloco 9 estar completo.

- [ ] **11.1** — Fluxo de auth do público: tela de registro/login diferente do músico (role `audience`)
- [ ] **11.2** — Scanner QR: `QRScannerScreen` (expo-camera) → parse `soundmeet://musician/:id` → navegar para perfil
- [ ] **11.3** — Tela: `MusicianPublicProfileScreen` (readonly) — foto, nome, stats, CTA pedido e gorjeta
- [ ] **11.4** — Tela: `SongRequestScreen` — buscar música + enviar pedido + votação em pedidos existentes
- [ ] **11.5** — Tela: `TipScreen` — gorjeta PIX (seletor de valor R$5/10/20/custom, campo dedica, CTA → deep link PIX)
- [ ] **11.6** — Gamificação: pontos por pedido, gorjeta, voto — `src/features/gamification/`
- [ ] **11.7** — Tela: `LeaderboardScreen` — ranking de fãs do evento

---

## Libs ainda não instaladas (verificar antes de implementar o bloco correspondente)

| Bloco | Lib | Comando |
|-------|-----|---------|
| 0.10 | `expo-font` | `npx expo install expo-font` |
| 3.2 | `expo-sharing` | `npx expo install expo-sharing` |
| 3.3 | `expo-media-library` | `npx expo install expo-media-library` |
| 2.7 | `expo-image-picker` | `npx expo install expo-image-picker` |
| 4.3 | `socket.io-client` | `npm install socket.io-client` |
| 11.5 | `expo-linking` | `npx expo install expo-linking` (já vem com Expo, verificar) |

---

## Decisões abertas

| Decisão | Status |
|---------|--------|
| Fonts: Google Fonts via expo ou arquivos locais | ⏳ Definir no 0.10 |
| Socket.io vs WebSocket nativo | ⏳ Socket.io (mais simples com backend NestJS) |
| Push notification service | ⏳ Expo Notifications + FCM/APNs (configurar EAS) |
| Monitoramento de erros | ⏳ Sentry React Native |
| Algoritmo afinador: YIN vs autocorrelação | ⏳ Definir no Bloco 8 |
