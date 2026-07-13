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

- [x] **1.1** — Auth service: `src/shared/services/auth/keycloak.service.ts` com `login()` via `expo-auth-session` (PKCE flow) e `logout()`
- [x] **1.2** — Token storage: `src/shared/services/storage/token.storage.ts` (expo-secure-store — access token, refresh token, expiry)
- [x] **1.3** — Interceptor Axios JWT: attach `Authorization: Bearer <token>` em toda requisição
- [x] **1.4** — Interceptor Axios refresh: detectar 401 → renovar token → retentar requisição original; 401 em refresh → logout
- [x] **1.5** — Auth guard no `RootNavigator`: redirecionar para `AuthStack` se não autenticado; para `MusicianTabs` se autenticado
- [x] **1.6** — Tela: `OnboardingScreen` (splash de boas-vindas, logo animada, botão "Entrar com SoundMeet")
- [x] **1.7** — Tela: `LoginScreen` (inicia o PKCE flow via `keycloak.service.ts`)
- [x] **1.8** — Claims do token: extrair `musician_id`, `roles` do JWT e popular `auth.store.ts`

**Pré-requisito backend:** Keycloak configurado com redirect URI `soundmeet://auth/callback` ✅

---

## Bloco 1.5 — Signup & Role Selection

> **Pré-requisito crítico:** `realm-soundmeet.json` tem `registrationAllowed: false` e `identityProviders: []`.
> Nenhum usuário consegue se cadastrar atualmente. Este bloco desbloqueia isso.

- [x] **1.9** — Backend: `POST /api/v1/auth/register` implementado — ver `soundmeet-backend/Docs/roadmap.md` (Bloco 4E) e `soundmeet-backend/Docs/auth/keycloak.md`. Recebe `{ name, email, password, role }`, cria usuário no Keycloak (Admin API), atribui role, cria aggregate `Musician`/`Audience` (ID == `sub` do Keycloak) e retorna tokens via Direct Access Grants (client `soundmeet-mobile`).
- [x] **1.10** — Tela: `RoleSelectionScreen` — tela dedicada após COMEÇAR; dois cards grandes: "Sou Músico 🎸" e "Sou Fã 🎵"; sem estabelecimento (web only); role armazenada localmente até o aggregate ser criado
- [x] **1.11** — Tela: `RegisterScreen` — formulário base idêntico para músico e fã: nome, e-mail, senha; nenhum campo de role aqui (vem do `RoleSelectionScreen`); após submit chama diretamente `POST /api/v1/auth/register` com `{ name, email, password, role }` — **sem PKCE, sem redirect de browser** (Option B, já implementada no backend em 1.9). A resposta já contém `access_token`, `refresh_token` e `profile_id`; popular `auth.store` diretamente com esses dados
- [~] **1.12** — ~~Pós-registro: criar aggregate mínimo no backend via `POST /musicians`/`POST /audiences`~~ — **obsoleto**: o `POST /auth/register` (1.9) já cria o aggregate atomicamente no backend e retorna `profile_id` na mesma resposta. Chamar `POST /musicians`/`POST /audiences` depois causaria erro 409 (perfil já existe) ou, pior, um segundo perfil com ID diferente do `sub` do Keycloak, quebrando o ownership guard. Nenhuma ação adicional necessária além de armazenar `profile_id` (recebido em 1.11) como `musician_id`/`audience_id` no `auth.store`
- [x] **1.13** — Wizard do músico — **5 steps** pós-login (pré-home, não pula sem completar step 1 e 2; steps 3 e 4 têm "Pular"): `src/features/musician/ui/screens/MusicianSetupWizardScreen.tsx` (single screen, estado interno via `useMusicianWizardState`, handlers assíncronos extraídos em `useMusicianWizardHandlers.ts` — limite de 200 linhas/screen; não 5 entradas de stack — background teal→violeta + `WizardProgress` precisam de continuidade visual entre steps)
  - Step 1: nome artístico (`stage_name`) + bio curta — `StepOneIdentity.tsx`
  - Step 2: instrumentos[] + gêneros[] (multi-select visual) — `StepTwoTags.tsx` + `MultiSelectChip.tsx` (shared). PATCH único (`stage_name`+`bio`+`instruments`+`genres`) disparado na transição Step2→3; `qr_code` vem da própria resposta do PATCH (já gerado na criação da conta), guardado no estado até o reveal do Step 5
  - Step 3 *(jul/2026, item 1.19)*: foto de perfil, opcional (Pular) — `StepThreePhoto.tsx` (`expo-image-picker` + `POST /musicians/:id/avatar`)
  - Step 4 *(jul/2026, item 1.19)*: chave PIX, opcional (Pular, com aviso "sem receber gorjetas") — `StepFourPix.tsx` (tipos cpf/celular/e-mail/aleatória, pré-preenchido com dados do cadastro; `PATCH /musicians/:id/wallet/pix-key`)
  - Step 5: "Seu QR Code está pronto 🎉" — preview do QR + CTA "Ir para minha home" — `StepFiveQrReveal.tsx` (renomeado de `StepThreeQrReveal.tsx`) + `QRFrame.tsx` (shared, gradient bezel + scan-line, reutilizável no Bloco 3.1)
- [x] **1.14** — Auth guard de wizard incompleto: músico que fez login mas não tem `stage_name` → redirecionar para Wizard step 1 antes de exibir as tabs. `useMusicianWizardGate.ts` (TanStack Query sobre `GET /musicians/:id`) consumido em `RootNavigator.tsx`, que agora decide entre `AuthStack` / `MusicianSetupWizard` / `MusicianTabs`. Pré-requisito corrigido: `buildAuthUser` em `keycloak.service.ts` zerava `musicianId`/`audienceId` em todo login/restoreSession (só o registro populava) — agora deriva do `sub` via role, já que `Musician.id === sub` do Keycloak (1.9)
- [x] **1.15** — Atualizar `types.ts` de navegação: `RoleSelection`, `Register` em `AuthStackParamList` (1.10/1.11); `MusicianSetupWizard: undefined` adicionado a `RootStackParamList` (não `AuthStackParamList` — decisão revisada: precisa ficar acessível também para sessão já autenticada sem stage_name, não só durante o fluxo de auth)
- [ ] **1.16** — Google OAuth (V2 pré-App Store):
  - Backend: preencher `GOOGLE_KEYCLOAK_CLIENT_ID` + `GOOGLE_KEYCLOAK_CLIENT_SECRET` no `.env` + rodar `npm run keycloak:sync:local`
  - Mobile: botão "Continuar com Google" na `LoginScreen` e `RegisterScreen` → abre Chrome Custom Tab (overlay, não sai do app) via `expo-web-browser`
  - Nota: Google login usa PKCE no Chrome Custom Tab (obrigatório pelo Google ToS — não tem alternativa in-app segura); email/senha continua via formulário nativo (Direct Access Grants)
  - Apple Sign In: descartado — requer Apple Developer Program pago
- [x] **1.17** — Polish visual `RoleSelectionScreen`/`RegisterScreen` (jul/2026): `RoleCard` — borda e fundo passam a derivar sempre do `accentColor` do próprio card (antes usavam `colors.border.default` cinza/verde genérico em repouso, inconsistente no card "Sou Fã"); borda selecionada com alpha reduzido (menos "pintada"); `radius.xl` no card. `FormField` — novo `TravelingBorderGlow` (`shared/components/`, SVG `strokeDasharray`/`strokeDashoffset` + Reanimated) roda um segmento de luz ao redor do input enquanto focado, sobreposto à borda estática existente. `.env`/`.env.example` — `EXPO_PUBLIC_API_BASE_URL` documentado por plataforma (Android Emulator precisa de `10.0.2.2`, não `localhost`)
- [x] **1.18** — Fundo dinâmico ao selecionar papel em `RoleSelectionScreen` (jul/2026): novo `RoleVideoBackground.tsx` cross-fada do `AuthGlowBackground` estático pra um loop de vídeo temático (mudo, `isLooping`) assim que o card é selecionado, com scrim escuro por cima pra manter contraste do texto/cards. Abordagem: stock footage real do Pexels (licença livre, sem marca d'água) processado via **Remotion** (`remotion/` — projeto Node isolado, não entra no bundle do app) que corta/recorta/crossfada múltiplos clipes num único loop `.mp4` por role:
  - Músico (`assets/videos/musician-loop.mp4`, ~2MB, 15.5s, ~1.0Mbps): alterna 6 clipes (guitarra c/ luz azul, violão acústico, guitarrista no palco, teclado, baixo, bateria)
  - Fã (`assets/videos/fan-loop.mp4`, ~2.6MB, 10.8s, ~1.9Mbps): alterna 3 clipes (celulares erguidos, confete, grupo cantando/dançando)
  - Todos os clipes fonte baixados de Pexels (`pexels.com/download/video/{id}`, direct CDN, sem precisar de API key), pré-processados com ffmpeg (downscale) antes do Remotion pra evitar timeout de decode em fonte 4K/8K, renderizados a 720x1280/30fps/h264 — arquivo pequeno o suficiente pra bundle local (~4.6MB total), sem precisar de CDN por ora
  - Playback: **`expo-video`** (`useVideoPlayer` + `VideoView`) — a tentativa inicial usou `expo-av` `Video` (já instalado, mas deprecated) e quebrou em runtime com `Cannot find native module 'ExponentAV'`: o Expo Go do SDK 56 não embarca mais o módulo nativo do expo-av, só o do expo-video. Instalado via `npx expo install expo-video` (plugin registrado em `app.json`); `expo-av` continuou no projeto só para áudio/microfone (afinador cromático, Bloco 1 item 8) — **atualização (06/07/2026): removido de vez.** Nunca chegou a ser usado (afinador ainda não implementado) e seu módulo nativo (`VideoViewModule`) quebrava o boot do app com New Architecture (`NoClassDefFoundError: LazyKType`) num build EAS `development` real — o mesmo padrão de módulo nativo problemático do parágrafo acima, agora também no lado de áudio. Ver Bloco 8 abaixo para o substituto (`expo-audio`).
  - Pipeline documentado em `remotion/` — `npm install && npm run render` regenera os dois `.mp4` a partir de `remotion/public/source-prepped/` (não versionado, `.gitignore`) se precisar trocar algum clipe. `remotion.config.ts` tem `Config.setMuted(true)` (o `muted` do `<OffthreadVideo>` só afeta mixagem daquele asset, não o container final — sem essa flag os `.mp4` saíam com uma trilha AAC muda indesejada); `render:fan` usa `--crf=36` (vs. `crf=30` padrão) pra equilibrar bitrate — mesmo CRF dava ~3.6Mbps no fã vs. ~1.0Mbps no músico (CRF não é bitrate-constante, conteúdo de multidão/confete é mais caro de codificar)
  - **Instabilidade no emulador Android (jul/2026), diagnosticada e corrigida:** 3 rodadas de fix anteriores (`surfaceType="textureView"`, `useExoShutter`, gate por `status === 'readyToPlay'` — evitam bugs conhecidos do ExoPlayer: [expo/expo#39962](https://github.com/expo/expo/issues/39962), [#31561](https://github.com/expo/expo/issues/31561)) não foram suficientes sozinhas — vídeo ainda piscava e levava 20s+ pra aparecer, chegou a ser revertido pra um fallback só-animação. Causa raiz do flicker: opacity animada numa view Android com superfície de vídeo sobreposta a outra view semi-transparente (o scrim) sem `renderToHardwareTextureAndroid`/`needsOffscreenAlphaCompositing` — bug de compositing documentado do RN, adicionados nesses dois props na `Animated.View` externa de `RoleVideoBackground.tsx`. Causa provável do carregamento lento: em dev/Expo Go, `require()` de asset local é servido pela Metro via rede (não embarcado no binário) — path aqui é Emulador→Windows→WSL2, não decode em si. Mitigado com prefetch não-bloqueante no boot (`App.tsx`, via `expo-asset` `Asset.loadAsync`, dá "head start" durante onboarding/login antes do usuário chegar em `RoleSelectionScreen`) — se ainda lento/instável em teste real, próximo passo é isolar via build EAS `development` (`eas.json` já tem o profile, falta `npx expo install expo-dev-client`) pra descartar de vez a hipótese de dev-server
- [x] **1.19** — Cadastro de músico passa a coletar CPF + celular (jul/2026): campos obrigatórios só para `role=musician` em `RegisterFormFields.tsx` (máscaras via `shared/utils/cpf.ts`/`phone.ts`), validados localmente e no backend (`register.use-case.ts` checa duplicidade antes de criar o usuário no Keycloak — 409 "CPF/Celular já cadastrado"). Objetivo: anti multi-conta (CPF é 1 por pessoa), sem fricção para `audience` (público casual escaneando QR). `auth.store.ts` guarda `cpf`/`phone` da sessão de registro como fonte do pré-preenchimento do Step 4 (PIX) do wizard — não persistidos em nenhuma outra tela. Verificação de posse do celular por SMS/OTP fica para depois (ver Decisões abertas).
- [x] **1.20** — Wizard do músico expandido de 3 para 5 steps (jul/2026): ver detalhamento em **1.13**.
- [x] **1.21** — Padronizar formulários com Zod (+ `react-hook-form` onde couber) (jul/2026): validação manual (`useState` por campo + função `validateX`) substituída por schemas Zod em `auth.validation.ts` (`registerSchema`, `loginSchema`, `completeCadastroSchema`) e `musician.validation.ts` (`validateStep1`/`validatePixKey` reescritos por dentro com Zod, assinatura pública preservada). Dois tratamentos diferentes por arquitetura da tela:
  - **Telas standalone (1 form, 1 submit)** → Zod + `react-hook-form` completo via `Controller`: `RegisterFormFields.tsx`/`RegisterScreen.tsx`, `LoginFormFields.tsx`/`LoginScreen.tsx`, `CompleteMusicianSignupScreen.tsx`. Ganho real: menos re-render por tecla (cada `Controller` isola o próprio campo, ex. `PasswordStrengthHint` só re-renderiza dentro do próprio `Controller` de senha, não a screen inteira), schema único como fonte de tipo+validação, menos boilerplate de `value`/`onChangeText`/`error`.
  - **Steps do wizard do músico** (`StepOneIdentity.tsx`, `StepFourPix.tsx`) → **só Zod**, sem `react-hook-form`. Motivo: o wizard usa um `useReducer` central (`useMusicianWizardState.ts`) cujo estado precisa sobreviver entre os 5 steps (single screen, não stack — ver comentário em `MusicianSetupWizardScreen.tsx`), e o botão "Avançar" vive fora do form, num componente irmão (`WizardStepFooter`). Encaixar RHF exigiria `forwardRef`/`useImperativeHandle` só pra esse botão externo disparar validação — complexidade real pra um form de 1-2 campos, e risco desnecessário de mexer numa arquitetura que já funciona. Zod substitui só o motor de validação interno de `validateStep1`/`validatePixKey`, mantendo a assinatura pública idêntica — zero mudança em `useMusicianWizardHandlers.ts` ou no screen do wizard.
  - `zod`, `react-hook-form`, `@hookform/resolvers` instalados. `npx tsc --noEmit` limpo após a migração.

**Decisão arquitetural fechada:**
- Auth por e-mail + senha (MVP). CPF + celular obrigatórios no signup **apenas para músico** (1.19 — anti multi-conta); telefone de audience/fã continua opcional no perfil, não no signup.
- Login e registro: 100% in-app via formulários React Native (Direct Access Grants); Google usa Chrome Custom Tab (overlay, não troca de app).
- `COMEÇAR` no Onboarding → `RoleSelectionScreen` (genérico, sem mencionar músico no botão do onboarding).
- Google / Apple OAuth: Google planejado para V2 pré-App Store; Apple descartado.
- Fã (audience): não passa pelo wizard — vai direto para home após criar account.

**Pré-requisito backend:** `POST /api/v1/auth/register` implementado (item 1.9 acima) ✅ — `registrationAllowed` permanece `false`, cadastro é feito exclusivamente por esse endpoint.

---

## Bloco 2 — Perfil do Músico

- [x] **2.1** — Domain types: `src/features/musician/domain/musician.types.ts` — `MusicianProfile` estendido para o `MusicianPresenter` completo (rating, total_ratings, is_verified, experience_years, display_name, `profile` aninhado), `PriceRange`/`PriceRangeModel`/`SocialLinks`/`MusicianProfileDetails`, `UpdateMusicianProfilePayload`
- [x] **2.2** — API adapter: `src/features/musician/infrastructure/musician.api.ts` — `getMusician`/`updateMusician` já existiam (Bloco 1.13); adicionado `updateMusicianProfile` (`PATCH /musicians/:id/profile`, chaves camelCase — `UpdateMusicianProfileInput` no backend)
- [x] **2.3** — Hook: `src/features/musician/application/useMusician.ts` (leitura, `musicianProfileKey` exportado) + `useUpdateMusicianProfile.ts` (mutation)
- [x] **2.4/2.5** — **Fundidas numa única tela** `EditProfileScreen` (decisão confirmada com o usuário): o wizard (1.13) já cria o perfil básico (stage_name/bio/instrumentos/gêneros/foto), então uma `CreateProfileScreen` separada seria puramente duplicada. `EditProfileScreen` cobre tanto completar quanto editar, incluindo os campos estendidos que o wizard não coleta: experiência (stepper), faixa de preço (contrato completo do backend — modelo por hora/evento + min + max + notas, não simplificado para um campo único) e links sociais (Instagram/YouTube/Spotify). Form via `react-hook-form` + Zod (`editProfileSchema`), handlers extraídos em `useEditProfileForm.ts` (padrão de `useMusicianWizardHandlers.ts`), subcomponentes em `ui/components/Edit*Section.tsx`
- [x] **2.6** — Tela: `ViewProfileScreen` — avatar com ring gradiente, nome, badge verificado, rating, bio, stats (experiência/nota/faixa de preço via `ProfileStatCard`), chips somente-leitura de instrumentos/gêneros, links sociais tocáveis, CTA "Editar perfil". Virou a screen real da tab "Perfil" (`ProfileStackNavigator`, substituindo o placeholder do Bloco 10.1)
- [x] **2.7** — Upload de foto de perfil (jul/2026): antecipado pelo Step 3 do wizard (item 1.13/1.20) — `expo-image-picker` + `POST /musicians/:id/avatar` já implementados; lógica de picker extraída para `shared/components/AvatarPicker.tsx` (reaproveitada por `StepThreePhoto` e `EditProfileScreen`)

**Endpoints backend:** `POST /api/v1/musicians`, `GET /api/v1/musicians/:id`, `PATCH /api/v1/musicians/:id`, `PATCH /api/v1/musicians/:id/profile` ✅

---

## Bloco 3 — QR Code do Músico

- [ ] **3.1** — Tela: `QRCodeScreen` — exibir QR Code gerado pelo backend (`GET /api/v1/musicians/:id` → campo `qr_code`, formato `soundmeet://musician/<uuid>` — código implementado, ver nota abaixo)
- [ ] **3.2** — Compartilhar QR Code: instalado `expo-sharing` + botão "Compartilhar" — código implementado, ver nota abaixo
- [ ] **3.3** — Download do QR Code para galeria (`expo-media-library`) — código implementado, ver nota abaixo

**Pré-requisito backend:** campo `qr_code` no presenter do músico ✅ (nome real do campo — o roadmap dizia `qr_code_url`, mas o presenter expõe `qr_code`)

> ⚠️ **Pendente antes de marcar `[x]`:** implementação completa (`QRCodeScreen`, `QRShareCard` com captura via `react-native-view-shot`, share/save via `expo-sharing`/`expo-media-library`, feedback tátil via `expo-haptics`), `tsc --noEmit` e `expo config` passam limpos — mas **falta verificação manual em device**. Ao testar, apareceu `Cannot find native module 'ExpoMediaLibraryNext'` — o dev client instalado no aparelho foi buildado *antes* dessas 4 libs nativas serem adicionadas (módulo nativo só entra no binário em build novo, não via JS/Metro). É preciso gerar um dev client novo (`eas build --profile development --platform android` e/ou `ios`, reinstalar no aparelho) antes de testar de novo. Só marcar `3.1`-`3.3` como `[x]` depois de confirmar share + save funcionando de fato no device.
>
> **Reverificado em 07/07/2026:** código revisado de novo (`QRCodeScreen.tsx`, `QRCodeContent.tsx`, `QRActionRow.tsx`, `qrShare.ts`, `useQRCardShare.ts`) — lógica de share/save, loading/success/error state e navegação (`ProfileStackNavigator` → `QRCode`) seguem corretos; `app.json` já tem os plugins `expo-sharing`/`expo-media-library` com as permission strings certas; `npx tsc --noEmit` e `npx expo config` seguem limpos. Segue faltando só a confirmação manual em device com dev client novo — não foi possível validar isso a partir deste ambiente (sem emulador/device conectado). Continua `[ ]` até essa confirmação.

- [x] **3.4** — Logout: `ProfileLogoutButton.tsx` (novo, `ui/components/`) adicionado ao final do `ViewProfileScreen.tsx` — `Alert.alert` de confirmação (destructive) → chama `logout()` de `keycloak.service.ts` (já existia desde o Bloco 1, mas nunca estava ligado a nenhuma tela). `logout()` já limpa tokens (SecureStore) + `auth.store` + revoga o refresh token direto no endpoint padrão do Keycloak (`/protocol/openid-connect/revoke`, best-effort); `RootNavigator` reage a `isAuthenticated=false` e troca pra `AuthStack` sozinho, sem precisar de navigation reset manual. **Backend:** nenhuma rota nova necessária — `soundmeet-mobile` é `publicClient` no realm (`directAccessGrantsEnabled`, PKCE), então a revogação de token não exige client secret; o app nunca passou pelo backend NestJS pra login/token (Direct Access Grant direto no Keycloak), então é consistente o logout também não passar

---

## Bloco 4 — Pedidos ao Vivo (core do produto)

> Tela principal de uso durante shows. Prioridade máxima de UX: legibilidade, gestos, performance.

- [x] **4.1** — Domain types: `src/features/musician/domain/request.types.ts` (MusicRequest, RequestStatus) — espelha `RequestPresenter` campo a campo; `points_value.earnedAt` tipado camelCase (inconsistência real do backend, mantida como está)
- [x] **4.2** — API adapter: `src/features/musician/infrastructure/request.api.ts` (`listRequests`, `acceptRequest`, `rejectRequest`) — endpoints reais (ver nota abaixo, os do roadmap original estavam errados/desatualizados)
- [x] **4.3** — Instalado `socket.io-client@^4.8.1` (major batendo com `socket.io@^4.8.3` do backend) + `src/shared/services/websocket/socket.client.ts` — singleton, `auth` como callback (token sempre fresco a cada reconexão), namespace `/notifications` na origem pura (`ENV.WS_BASE_URL`, derivado de `API_BASE_URL` sem o sufixo `/api/v1`)
- [x] **4.4** — WebSocket hook: `src/features/musician/application/useRequestsSocket.ts` — escuta `request.new` e invalida a query de pendentes. **Backend estendido** (jul/2026): `NotificationsGateway`/`RequestEventsHandler` só empurravam `request.status_changed` pro fã (accept/reject) — não existia evento pro músico saber de pedido novo. Adicionado `notifyNewRequest`/evento `request.new` na mesma room `user:${sub}`, a partir do `RequestCreatedEvent` que já disparava (só não era consumido pelo gateway). Ver `soundmeet-backend/Docs/roadmap.md` Bloco 5.1
- [x] **4.5** — Hook: `src/features/musician/application/useRequests.ts` (lista + mutações accept/reject) — invalidação dentro do próprio hook de mutation (desvio documentado do padrão "mutation fina", justificado pela ausência de camada orquestradora de tela nesse bloco)
- [x] **4.6** — Tela: `LiveDashboardScreen` — primeira `FlatList` do app; lista de pedidos pendentes, `typography.liveBody` (18px, novo token) pro conteúdo legível, dark mode fixo (mesmo padrão de `QRCodeScreen`/`ViewProfileScreen` — nenhuma tela do músico consome `ThemeContext` hoje)
- [x] **4.7** — Swipe gesture: `RequestCard.tsx` (novo, `ui/components/`) — `Gesture.Pan()` seguindo o mesmo idioma já usado em `SlideCarousel.tsx` (threshold + velocity + `runOnJS` + snap-back); direita = aceitar (revela fundo teal), esquerda = rejeitar (revela fundo coral); haptics no cruzamento do threshold; botões de toque explícitos ≥48×48px sempre visíveis (não é swipe-only)
- [x] **4.8** — `useKeepAwake()` (`expo-keep-awake`) ativo em `LiveDashboardScreen`
- [x] **4.9** — Push notification (jul/2026): `push-registration.service.ts` (guard `expo-device`/`Device.isDevice`, permissão, `Notifications.getExpoPushTokenAsync`) + `usePushRegistration.ts` (roda uma vez por sessão, escopo `MusicianTabNavigator`) + handler de foreground em `App.tsx` (`setNotificationHandler`). **Backend**: endpoint novo `PATCH /musicians/:id/push-token` (Bloco 4E.13) + `PushNotificationService` (`expo-server-sdk`) chamado por `RequestEventsHandler.handleRequestCreated`. Código pronto e testado (`tsc`/`expo config`/testes de backend).
  - **Android — configurado (jul/2026):** projeto Firebase `soundmeet-95eae` criado; `google-services.json` baixado (Project Settings → General → app Android `com.soundmeet.app`), colocado na raiz de `soundmeet-mobile/` e referenciado em `app.json` (`android.googleServicesFile`) — protegido no `.gitignore`. Chave de service account (Project Settings → Service accounts → Generate New Private Key) enviada ao EAS via `eas credentials` → Android → Google Service Account → "Set up a Google Service Account Key for Push Notifications (FCM V1)" → confirmado como já configurado (menu passou a mostrar "Manage" em vez de "Set up"). **Falta**: gerar um dev build novo (`eas build --profile development --platform android`) — o último build existente é anterior a todo esse trabalho (`google-services.json`, `expo-device`, todo o código deste bloco não estavam nele) — e testar o fluxo real no aparelho (permissão → token → `PATCH /musicians/:id/push-token` → push chegando).
  - **iOS — pendente:** precisa de conta paga de Apple Developer Program ($99/ano) logada no `eas credentials` → iOS — o CLI gera a chave APNs (`.p8`) sozinho durante esse fluxo, não tem arquivo pra baixar do Firebase como no Android. Sem isso, `eas build --platform ios` falha ao tentar configurar push. Nenhuma mudança de código necessária no `PushNotificationService`/mobile pro iOS — é puramente configuração de credencial + build.

> ⚠️ **Endpoints backend corrigidos:** a linha abaixo estava errada desde a criação do roadmap — os endpoints reais (confirmados direto no `RequestsController`) são `GET /api/v1/requests/musicians/:musician_id?status=pending` (lista + `pending_count`) e `PATCH /api/v1/requests/:id/respond` (`{ action: "accept"|"reject" }`), não `POST /:id/accept`/`POST /:id/reject`.

**Endpoints backend:** `GET /api/v1/requests/musicians/:musician_id`, `PATCH /api/v1/requests/:id/respond` ✅

---

## Bloco 5 — Gorjetas (histórico + notificação)

> Implementado full-stack (jul/2026) — o backend só tinha `GET/PATCH/POST` de wallet e `POST /tips` prontos; 3 gaps bloqueavam o mobile de ser genuinamente funcional (listagem de tips não exposta via HTTP, wallet sem campos de elegibilidade de saque fora do fluxo de withdraw, sem notificação de gorjeta recebida) e foram resolvidos no backend antes do mobile, mesmo precedente do Bloco 4.4.

- [x] **5.1** — Domain types: `src/features/payment/domain/tip.types.ts` (`Tip`, `TipsPage`, `Wallet`, `WithdrawEligibility` + `getWithdrawEligibility()`)
- [x] **5.2** — API adapter: `src/features/payment/infrastructure/wallet.api.ts` (`getWallet`, `listTips`) — decisão de arquitetura: **não** migrar `useMusicianWallet`/`musician-wallet.api.ts` existentes (usados pelo wizard de cadastro e por `useEditWalletSection`, fora de escopo) — `payment/` bate no mesmo `GET /musicians/:id/wallet` com seu próprio adapter/tipo (superset com `min_withdrawal_amount_brl`/`withdrawal_days`), evitando importar `features/musician` de dentro de `features/payment` (proibido por FSD)
- [x] **5.3** — Hooks: `src/features/payment/application/useWallet.ts` + `useTips.ts` — `useTips` usa `useQuery` simples (`per_page: 30`, sem paginação incremental) para bater com o padrão já usado em todo o app (`useEstablishments` etc.) — nenhuma lista do mobile usa `useInfiniteQuery` hoje, não introduzido aqui
- [x] **5.4** — Tela: `WalletScreen` — saldo (via `WalletBalanceCard` + `AnimatedBalance`, contador animado sem precedente no projeto — Reanimated 4 `useAnimatedProps` sobre `TextInput`), histórico de gorjetas (`TipHistoryList`/`TipHistoryItem`, `GlowCard` com stagger + `Pressable3DCard` — mesmos primitivos já usados na Home/Bloco 11, nenhuma lib de animação nova), indicador de elegibilidade de saque. Wired em `MusicianTabNavigator.tsx` (substituiu o placeholder da tab "Gorjetas")
- [x] **5.5** — Componente: `WithdrawProgressBar` — "Você está a R$X de poder sacar" + prazo estimado, barra animada de verdade (`useSharedValue`+`withTiming`, diferente do precedente estático de `BadgeGrid`) com glow pulsante perto de 100%
- [x] **5.6** — Push notification: gorjeta recebida (valor + nome do fã) — `useNotificationResponseListener.ts` (novo, `shared/services/notifications/` — primeiro listener de notificação do projeto, cobre cold start via `getLastNotificationResponseAsync` e warm/background via `addNotificationResponseReceivedListener`) navega para `MusicianTabs > Wallet` ao tocar na notificação (`navigationRef.ts` novo, plugado no `NavigationContainer` de `RootNavigator.tsx`). Adicional não-literal do roadmap: `useWalletSocket.ts` ouve `tip.received` via socket (**sem** chamar `connectSocket()`/`disconnectSocket()` — o socket é singleton não reference-counted, já gerenciado por `useRequestsSocket` no escopo da sessão; um segundo connect/disconnect aqui derrubaria pedidos ao vivo no resto do app) pra invalidar cache + disparar `ConfettiBurst` (promovido de `features/musician/ui/components/` para `shared/components/`, único import atualizado em `StepFiveQrReveal.tsx`) quando a tela está aberta em foreground

> ⚠️ **Pendente antes de marcar como totalmente concluído:** `npx tsc --noEmit`, `npx expo config` e bundle real do Metro (`index.bundle`, HTTP 200, todos os módulos novos confirmados presentes no output — mesma verificação do Bloco 11) passam limpos, mas **falta confirmação manual em device/emulador** (nenhum disponível neste ambiente, mesma limitação já registrada nos Blocos 3/4.9/11) — em especial o fluxo de push real (permissão → token → notificação chegando → tap navegando pra Wallet) e a celebração via socket em tempo real.

**Endpoints backend:** `GET /api/v1/musicians/:id/wallet` (agora com `min_withdrawal_amount_brl`/`withdrawal_days`) ✅, `GET /api/v1/musicians/:id/wallet/tips` (novo) ✅. Notificação `tip.received` via `NotificationsGateway`/`PushNotificationService` (novo handler em `notifications-module/payment-events.handler.ts`) ✅

---

## Bloco 6 — Analytics básico pós-evento

> **Gap descoberto (jul/2026):** o endpoint `GET /musicians/:id/analytics` só retornava `{musician_id, average_rating, total_ratings, plan_tier, realtime_available}` — sem pedidos aceitos/rejeitados, gorjetas ou músicas mais pedidas (`business-rules.md` já registrava esse gap). Estendido no backend antes do mobile (ver `soundmeet-backend/Docs/roadmap.md`). Escopo é **global/all-time por músico**, não por evento — nenhum endpoint de requests/tips filtra por `event_id` hoje, então "pós-evento" na prática virou "resumo geral"; textos da tela usam "Total em gorjetas" em vez de "gorjetas do evento" por honestidade.

- [x] **6.1** — API adapter: `src/features/musician/infrastructure/analytics.api.ts` (`getAnalytics`)
- [x] **6.2** — Hook: `src/features/musician/application/useAnalytics.ts`
- [x] **6.3** — Tela: `AnalyticsScreen` (+ `AnalyticsHeroStats.tsx`, `RequestsOutcomeChart.tsx`, `TopSongsList.tsx`) — nota média + pedidos aceitos/rejeitados (contadores animados via `shared/components/AnimatedCounter.tsx`, novo — irmão do `AnimatedBalance.tsx` do Bloco 5 pra contagem inteira em vez de BRL), total em gorjetas (`AnimatedBalance`, reaproveitado), donut aceito×rejeitado feito à mão com `react-native-svg` + Reanimated (mesma técnica do `WizardProgress.tsx`, nenhuma lib de gráfico instalada), lista de músicas mais pedidas. Paleta teal+âmbar (design-system.md, linha "Analytics" da tabela de paleta por contexto). Entrada via nova tile em `QuickAccessGrid` (Home) + `ProfileStackParamList.Analytics`, mesmo padrão de back button de `QRCodeScreen`.

**Backend estendido** (jul/2026): `GetMusicianAnalyticsUseCase` passou a agregar `IRequestRepository.findAcceptedRequestsByMusician`/`findRejectedRequestsByMusician`/`findPopularSongs` (já existiam, reaproveitados sem criar métodos novos) + `IMusicianWalletRepository.findByMusicianId` (`total_earned`, líquido pós-taxa — mesmo valor exibido na Wallet). **Achado arquitetural:** a tentativa inicial de injetar `IRequestRepository`/`IMusicianWalletRepository` direto em `MusiciansModule` (via `forwardRef`, seguindo o precedente `Requests↔Audiences`) quebrou no carregamento do módulo — `MusiciansModule → RequestsModule → AudiencesModule → MusiciansModule` é um ciclo de import estático de 3 saltos que o `forwardRef` do NestJS não resolve (ele só adia o *uso* do binding em tempo de DI, não a instrução `import` em si, que o Node/CJS ainda executa e trava em `ReferenceError: Cannot access 'X' before initialization`). Corrigido criando um módulo orquestrador novo, `nest-modules/musician-analytics-module/` (controller próprio, `@Controller("musicians")`, mesma rota `GET :id/analytics`), que importa `MusiciansModule`+`RequestsModule`+`PaymentModule`+`PlansModule` como nó-folha sem aresta de volta — mesmo padrão já usado por `NotificationsModule`.

> ⚠️ **Pendente antes de marcar como totalmente concluído:** `npx tsc --noEmit`, `npx expo config` e bundle real do Metro (`index.bundle`, HTTP 200, todos os módulos novos confirmados presentes no output, incluindo `AnimatedCounter`) passam limpos no backend e no mobile — mas **falta confirmação manual em device/emulador** (mesma limitação já registrada nos Blocos 3/4.9/5/11), em especial a animação do donut SVG e dos contadores.

**Endpoints backend:** `GET /api/v1/musicians/:id/analytics` (contrato estendido) ✅

---

## Bloco 7 — Repertório + Play Mode

> Play Mode = teleprompter musical. Tela que o músico usa NO PALCO enquanto toca.

> **Implementado (jul/2026)** — escopo bem maior do que o roadmap original descrevia. Investigação prévia (backend + mobile) mostrou que o domínio `Repertoire` já estava 100% construído no backend (CRUD + reorder + share + convites nominais, Bloco 4D.1) mas com **3 bugs/gaps bloqueantes** que impediam o fluxo de funcionar de ponta a ponta — corrigidos antes do mobile, mesmo precedente dos Blocos 4.4/5. Decisões de escopo confirmadas com o usuário: "adicionar música" = busca por título/artista (não upload de áudio); reorder = `react-native-draggable-flatlist` (biblioteca, não gesto artesanal); sharing = link público + convite nominal PRO + tela "convites recebidos", tudo incluso (não só o roadmap original, que não cobria nenhum dos três).
>
> **Backend, achados e corrigidos antes do mobile** (ver `soundmeet-backend/Docs/roadmap.md` 4D.1e/6.5/6.6 pro detalhe completo):
> 1. `MusicianOwnershipGuard` resolvia o dono errado nas rotas aninhadas de repertório (`musicians/:musician_id/repertoires/:id/...`) — `params["id"]` (repertório) tinha precedência sobre `musician_id`, então reorder/share/invite/rename/delete/add-song/remove-song retornavam 403 pra qualquer músico real. Corrigido renomeando o param pra `:repertoire_id`.
> 2. Completar uma análise ai-cifra nunca escrevia o resultado de volta em `MusicLibrary` (só ficava no aggregate do job) — `GET .../chord-sheet` ficaria vazio pra sempre depois de uma análise via busca. Corrigido injetando `UpdateMusicLibraryUseCase` em `CompleteAiCifraAnalysisJobUseCase`.
> 3. Não existia endpoint HTTP de busca por texto livre (só um método interno usado por script CLI). Novo `GET /musicians/:id/ai-cifra/search`.
>
> **Fluxo real de "buscar e adicionar música"** (a única sequência que o backend realmente aceita, sem inventar campo novo em presenter nenhum): busca → `POST /music-library/items` (cria o item, id já conhecido no cliente) → `POST .../ai-cifra/uploads/from-provider/analyses` (com esse id) → poll `GET /ai-cifra/analyses/:id` até completed → `POST /repertoires/:id/songs` com o id do passo 1.

- [x] **7.1** — Domain types: `src/features/musician/domain/repertoire.types.ts` (Repertoire, RepertoireSong, RepertoireInvitee — não existe um agregado "Song" separado no backend, é um join row da MusicLibrary). Mais `chord-sheet.types.ts`, `cifra-search.types.ts`, `play-mode.types.ts` (linha achatada pro motor de auto-scroll) — arquivos-irmãos separados, não um `repertoire.types.ts` monolítico
- [x] **7.2** — API adapters: `repertoire.api.ts` (13 funções — CRUD + reorder + share/unshare + invite/revoke + listMyInvites + getSharedRepertoire) + `chord-sheet.api.ts` + `cifra-search.api.ts`
- [x] **7.3** — Hooks: `useRepertoires.ts`, `useRepertoire.ts`, `useRepertoireMutations.ts` (reorder com reordenação **otimista** no cache — `react-native-draggable-flatlist` depende de feedback instantâneo), `useRepertoireInvites.ts`, `useChordSheet.ts` (+ `buildTokenGrid`/`chord-sheet-timing.ts`), `useCifraSearch.ts` (debounced), `useCifraAnalysisJob.ts` (poll-until-terminal — não existe push/socket pra conclusão de análise)
- [x] **7.4** — Tela: `RepertoireListScreen` — lista de repertórios do músico
- [x] **7.5** — Tela: `RepertoireDetailScreen` — músicas do repertório, `<DraggableFlatList>` com reorder por arraste (handle dedicado — `GripVertical`, `onLongPress` — separado do swipe-to-remove horizontal pra não conflitar gestos) + swipe-to-remove (mesmo idioma de `RequestCard.tsx`)
- [x] **7.6** — Telas: `CreateRepertoireScreen` (Zod + react-hook-form, form standalone) / `EditRepertoireScreen` (renomear + excluir + compartilhar + convidar — consolidadas numa tela só, mesmo precedente de fusão do item 2.4/2.5; convite hoje é por `musician_id` colado manualmente, não existe endpoint de busca/diretório de músicos no backend)
- [x] **7.6b** — *(não estava no roadmap original — decisão do usuário)* Tela: `CifraSearchScreen` — busca por título/artista → cria `MusicLibrary` item → dispara análise → progresso poll → "Adicionar ao repertório". Tela: `RepertoireInvitesScreen` — convites recebidos de outros músicos (colaboração PRO)
- [x] **7.7** — Cifra em modo leitura entra direto no Play Mode (7.8), não uma `SongDetailScreen` separada — não fazia sentido ter duas telas de leitura de cifra quase idênticas (uma estática, uma com auto-scroll) pra uma feature cujo caso de uso real é sempre "ao vivo no palco"
- [x] **7.8** — **Play Mode** (4D.2) — tela fullscreen de performance:
  - [x] **7.8a** — `ChordTokenLine.tsx` — token a token via `View`/`Text` + Flexbox `flexWrap` (não Skia/SVG — o backend já garante "reflow só redistribui tokens, não altera anchors", texto nativo reflowável é exatamente pra isso); chords em teal (`typography.chordLive`, token novo — `mono` existente é 14px, menor que a letra, ficaria subordinado), letras em branco (`typography.liveBody`, 18px)
  - [x] **7.8b** — Linha atual com borda esquerda teal + fundo `brand.muted`; passadas em `text.muted`; futuras em branco meio-opaco. Tracking de linha ativa via `useAnimatedReaction` + `runOnJS` só quando o índice muda (não every-frame)
  - [x] **7.8c** — Auto-scroll "virtual playhead": ritmo geral controlado pelo usuário (slider ±0.25 na bottom bar, 0.5×–2×), distribuição relativa entre seções/linhas ponderada por `startMs`/`endMs` reais quando existem (seção instrumental longa rola mais devagar que verso denso no mesmo ritmo geral), cai pra heurística de contagem de palavras (~330ms/palavra) quando a música não tem timestamps. Um único `withTiming` contínuo (não loop de frame) — `usePlayModeAutoScroll.ts` + `chord-sheet-timing.ts` (worklets de mapeamento progress↔scrollY). Toque na tela pausa na hora; retomar é explícito e continua de onde o dedo deixou (calcula progress a partir da posição real de scroll, não volta pro ponto anterior)
  - [x] **7.8d** — Badge de pedidos pendentes na `PlayModeTopBar` (reaproveita `useRequests`, mesma query key da tab), tappable → `navigation.getParent()?.navigate('LiveDashboard')`
  - [x] **7.8e** — `PlayModeBottomBar` — ← anterior | pausar/tocar | próxima →, troca de música via `navigation.setParams` (mesma tela, sem empilhar) + reset do playhead (useEffect keyed em `flatLines`)
  - [x] **7.8f** — `useKeepAwake()` (mesmo padrão de `LiveDashboardScreen`) + `<StatusBar hidden />`
  - [x] **7.8g** — Badge "Customizada" (`StickyNote` âmbar) em `SongCard` quando `custom_notes` presente
- [x] **7.9** — *(jul/2026, revisão pós-implementação, não estava no roadmap original)* Convite nominal só funcionava pela metade: o convidado conseguia ver a lista de músicas do repertório (`GET .../:id` já suportava `isOwner=false`), mas `GET /music-library/:id/chord-sheet` só aceitava o próprio dono — ou seja, dava pra ver o repertório mas não pra realmente TOCAR a partir dele no Play Mode. Corrigido no backend (`CheckRepertoireSongAccessUseCase`, novo endpoint `.../repertoires/:id/songs/:id/chord-sheet`) e no mobile (`PlayModeScreen` agora sempre busca via repertório, usando `repertoire.musician_id` — o dono — não o musicianId de quem está logado). Ver `soundmeet-backend/Docs/roadmap.md` 4D.4c.
  - [x] **7.9a** — Compartilhamento público passou a servir a CIFRA de verdade (não só a lista de músicas): nova feature `src/features/shared-repertoire/` (fora de `features/musician` de propósito — alcançável tanto por músico quanto por fã, e FSD proíbe uma feature importar de outra). `ChordTokenLine`/`buildTokenGrid`/tipos de `ChordSheet` promovidos de `features/musician` pra `shared/` nesse processo — duplicar ~150 linhas de lógica de join seria pior que promover.
  - [x] **7.9b** — Deep linking `soundmeet://repertoire/shared/:token` construído do zero (não existia NENHUMA infra de deep link real no app antes — o único outro "esquema", o QR code do músico, é lido da câmera, nunca de uma URL do sistema). Espelha o padrão já validado de navegação por notification-tap (`navigationRef` + cold-start via `onReady` + warm via listener). **Decisão confirmada com o usuário:** exige login (reaproveita o auth-gate existente, sem bypass de rota pública dentro do app) — token pendente tocado antes do login terminar fica guardado (`deep-link.store.ts`) e é consumido assim que a sessão resolve, inclusive esperando o wizard do músico terminar quando aplicável (bug real encontrado numa revisão: o efeito não esperava `gate.kind === 'needs-wizard'` e descartava o token silenciosamente).
  - [x] **7.9c** — Convite nominal: "colar UUID manualmente" substituído por busca real de nome artístico via `GET /musicians?filter[stage_name]=` (já existia pra outros fluxos, zero mudança de backend).
  - [x] **7.9d** — **Confirmado com o usuário: a visualização pública/compartilhada é somente leitura, sem exceção.** `RepertoirePublicController` só tem métodos `@Get`; `shared-repertoire.api.ts` só exporta funções de leitura; nenhum `useMutation` na feature; as duas telas (`SharedRepertoireScreen`/`SharedSongViewerScreen`) não têm nenhum caminho de navegação de volta pras telas mutáveis (`RepertoireDetail`/`EditRepertoire`/`PlayMode`), mesmo quando quem abre o link é o próprio dono.
  - ⚠️ **Característica conhecida, não é bug:** se o dono perder o plano ESSENTIAL/PRO depois de compartilhar ou convidar, o link público e o acesso do convidado continuam ativos indefinidamente — nenhum gate de plano neste projeto é revalidado na leitura, só no momento da ação (compartilhar/convidar). Detalhado em [`soundmeet-backend/Docs/plans/musician-plans.md`](../../soundmeet-backend/Docs/plans/musician-plans.md#️-enforcement-de-gates-ação-vs-leitura-ler-antes-de-mexer-em-qualquer-gate-de-plano) — ler antes de mexer em qualquer gate de plano, backend ou mobile.

**Pré-requisito backend:** repertório + ai-cifra completos ✅ (3 gaps reais corrigidos jul/2026 — ver nota acima)

> ⚠️ **Pendente antes de considerar 100% fechado:** `npx tsc --noEmit`, `npx expo config` e bundle real do Metro (Android, `4034 módulos`, HBC, sem erro de resolução) passam limpos no backend e no mobile — mas **falta confirmação manual em device/emulador** (mesma limitação já registrada nos Blocos 3/4.9/5/6/11): em especial o auto-scroll de verdade num show (a formula de peso por seção é nova, sem precedente, precisa de calibração visual real), o drag-to-reorder em device físico, e o fluxo completo de busca→análise→adicionar contra o pipeline ai-cifra real (não só os testes unitários do backend). `react-native-draggable-flatlist` foi instalada e — ao contrário do que o plano inicial presumia — **não tem código nativo próprio** (só depende de `react-native-gesture-handler`/`react-native-reanimated`, já presentes no dev client), então não deveria exigir rebuild do dev client EAS; vale confirmar isso na prática mesmo assim.

---

## Bloco 8 — Afinador cromático

- [~] **8.1** — Verificar permissão de microfone (`expo-audio` — `useMicrophonePermission.ts`, `createPermissionHook` de `expo-modules-core` sobre `requestRecordingPermissionsAsync`/`getRecordingPermissionsAsync`) + solicitar em runtime
- [~] **8.2** — Algoritmo de detecção de pitch: **MPM** (não YIN/autocorrelação — decisão 10/07/2026, mais resistente a erro de oitava/ruído) via `react-native-pitchy` — captura e detecção 100% nativas (Pitchy não aceita buffer externo; `expo-audio` entra só pelo 8.1, não participa da captura de pitch). Suavização por mediana + histerese em `useTunerPitch.ts`
- [~] **8.3** — Tela: `TunerScreen` — fullscreen, sem distração; nota detectada em display grande (`TunerNoteDisplay`); arco radial com glow em vez de agulha reta (`TunerCentsMeter`, SVG + Reanimated 4, referência visual em `refs-front.md`)
- [~] **8.4** — Guard de plano: filtro de ruído (não o afinador básico, liberado pra todos os planos) trava pra Free via `plan_tier` (mesmo padrão de `useEditQRCodeSection.ts`) em `TunerNoiseFilterRow`

> `[~]` = **parcial, aguardando revisão** (convenção do CLAUDE.md raiz: `[x]` feito / `[~]` parcial / `[ ]` pendente). Código implementado e `npx tsc --noEmit` limpo (10/07/2026), passou por uma rodada de revisão crítica pós-implementação (achou e corrigiu 1 bug real de comparação de string em `plan_tier` — ver histórico de revisão), mas ainda **falta confirmação manual em device** (mesma limitação já registrada nos Blocos 3/4.9/5/6/7/11): `expo-audio` e `react-native-pitchy` são módulos nativos novos, exigem novo build de dev client EAS (`eas build --profile development`) antes de aparecer no device. Só vira `[x]` depois desse build+teste manual (permissão, detecção de pitch numa faixa real de instrumentos, toggle de filtro de ruído por tier).

**Pré-requisito backend:** `tuner_noise_filter` em `MusicianPlanFeatures` — ✅ (7.6a concluído 10/07/2026)

---

## Bloco 9 — Chat com Estabelecimentos (WebSocket)

> **Gap descoberto (jul/2026):** o backend (Bloco 7.1) já tinha domínio/REST/gateway completos, mas 3 lacunas reais impediam um chat genuinamente utilizável — corrigidas antes do mobile, mesmo precedente dos Blocos 4.4/5/6/7. (1) Bug real: `ConversationPrismaRepository.findByParticipant` não incluía `establishment_id` no `OR` — em produção um estabelecimento nunca via as próprias conversas (o teste que passava usava o repositório in-memory, que já tinha os três campos). (2) Sem push notification de mensagem nova — `MessageSentEvent` disparava mas nada escutava. (3) `ListConversationsUseCase` retornava só IDs, sem última mensagem/contagem de não lidas/nome do estabelecimento — `ConversationListScreen` não tinha como mostrar "quem" nem preview. Ver `soundmeet-backend/Docs/roadmap.md` Bloco 7.1 pro detalhe completo dos 3 fixes.

- [~] **9.1** — WebSocket: `src/shared/services/websocket/socket.client.ts` ganhou uma segunda factory, `getChatSocket()` (namespace `/chat`, screen-scoped — conecta/entra na room/sai/desconecta só em `ChatScreen`, diferente do singleton de sessão `/notifications`, ver comentário no arquivo). `useChatNotificationsSocket.ts` (novo) faz piggyback no socket de `/notifications` já aberto (sem connect/disconnect próprio, mesmo padrão de `useWalletSocket.ts`) pra atualizar a lista de conversas via o evento `chat.message.new` que o novo handler do backend emite na mesma room `user:${musicianId}` já usada por pedidos/gorjetas.
- [~] **9.2** — API adapter: `src/features/scheduling/infrastructure/conversation.api.ts` (`listConversations`, `getMessages`, `sendMessage`, `markAsRead`, `getEstablishmentSummary` — este último só usado no fallback de header quando o chat abre via push)
- [~] **9.3** — Hooks: `useConversations.ts`, `useChat.ts` (mensagens + `useSendMessage` com **UI otimista** — mensagem aparece na hora, reconciliada com a resposta do servidor, revertida em erro), `useMarkAsRead.ts`, `useChatSocket.ts` (realtime por conversa). **Decisão de implementação:** sem `useInfiniteQuery` — mesmo motivo já documentado em `useTips.ts` ("nenhuma lista do app usa isso hoje") mais um adicional real: o cursor de `GET /conversations/:id/messages` avança pra mensagens MAIS RECENTES (não mais antigas — `findByConversationId` ordena `created_at ASC`), o oposto do que "carregar mais ao rolar pra cima" precisaria. Uma página de até 100 (o máximo do backend) cobre o volume esperado do MVP.
- [~] **9.4** — Tela: `ConversationListScreen` — lista de conversas com nome/avatar do estabelecimento, preview da última mensagem, dot de não lidas. **Sem badge agregado fora dela** (decisão confirmada com o usuário) — a Home/tile Agenda não somam `unread_count`.
- [~] **9.5** — Tela: `ChatScreen` — bolhas com tick de status enviado/lido (`ChatBubble.tsx`, só 2 estados alcançáveis hoje — `'delivered'` está tipado no backend mas nenhum use-case o produz), input controlado simples sem react-hook-form (`ChatInputBar.tsx`, validação via `sendMessageSchema.safeParse()` no submit), header com fallback client-side de nome/avatar quando aberto via push (`ChatHeader.tsx`). Entrada via tile "Agenda" da Home (`QuickAccessGrid.tsx`, antes desabilitada) e via tap em notificação push (`useNotificationResponseListener.ts` estendido). Navegação registrada em `RootStackParamList` (`ConversationList`/`Chat`), irmã de `MusicianTabs` — mesmo racional de `SharedRepertoire`/`SharedSongViewer` (Home não tem stack própria pra aninhar essas telas).

> `[~]` = parcial, aguardando revisão (convenção do CLAUDE.md raiz). Backend: 17 testes de integração do `chat-module` (dois novos de regressão, ver revisão abaixo) + specs novos (`conversation-prisma.repository.spec.ts`, `chat-message-events.handler.spec.ts`, extensões de `list-conversations.use-case.spec.ts`) passam — 96 testes no total entre `core/chat`, `chat-module` e `notifications-module`. Mobile: `npx tsc --noEmit` limpo, `npx expo config` limpo, bundle real do Metro (Android, HTTP 200, todos os módulos novos confirmados presentes no output — `ConversationListScreen`, `ChatScreen`, `useChatSocket`, `getChatSocket`, `Avatar`, `date-format`, etc.). **Falta, mesma limitação já registrada nos Blocos 3/4.9/5/6/7/8:** confirmação manual em device/emulador — em especial o round-trip real do namespace `/chat` (join/leave, envio otimista + reconciliação, push chegando), que exige dois usuários logados (músico no mobile + estabelecimento, que não tem UI mobile — precisa disparar `POST /conversations/:id/messages` via Swagger/curl pra simular o lado do estabelecimento).

> **Revisão pós-implementação (jul/2026):** revisão de código em 8 ângulos sobre backend+mobile (ver nota espelhada em `soundmeet-backend/Docs/roadmap.md` Bloco 7.1 pros 2 achados de backend — validação estrita de UUID podendo derrubar `GET /conversations`, e um fetch morto no handler de push). Do lado mobile, achados reais corrigidos:
> - **Corrida real de duplicação de mensagem:** `POST /conversations/:id/messages` (backend) emite o socket `message.new` de volta pra própria room do remetente ANTES de retornar a resposta HTTP — então o eco da própria mensagem podia chegar em `useChatSocket.ts` antes de `useSendMessage`'s `onSuccess` reconciliar o id temporário, produzindo dois bubbles com o mesmo `message_id` (confirmado por 3 dos 8 ângulos de revisão, independentemente). Corrigido: `useChatSocket` agora recebe `userId` e ignora mensagens cujo `sender_id` é o próprio usuário — `onSuccess` da mutation é o único reconciliador da própria mensagem; o socket só trata mensagens de quem não somos nós.
> - **`useMarkAsRead` nunca disparava em mensagem recebida** apesar do comentário do próprio hook afirmar isso — só rodava no mount da tela. Corrigido conectando o mesmo guard acima: `useChatSocket` aceita um callback `onMessageFromOther`, chamado só quando a mensagem realmente não é um eco (via `useRef`, pra não reconectar o socket a cada render por causa de uma arrow function inline instável).
> - **Rollback de erro do envio podia descartar mensagens legítimas:** `useSendMessage`'s `onError` restaurava o snapshot inteiro de antes da mutation, apagando qualquer mensagem que tivesse chegado via socket durante a janela do POST em voo. Corrigido pra remover só a mensagem otimista que falhou, do estado atual do cache.
> - Dois gatilhos de scroll competindo em `ChatMessageList.tsx` (um `useEffect` + `onContentSizeChange` pro mesmo evento) — reduzido a um.
> - Cor (`rgba(12,12,20,0.55)`) e fonte (`Inter-Regular`/15px) hardcoded em vez de token — corrigidas (`${colors.text.inverse}8C`, `...typography.body`).
> - Lógica de formatação de data duplicada entre `ConversationListItem`/`ChatBubble` — extraída pra `shared/utils/date-format.ts` (`formatHHMM`/`formatShortDate`/`formatListPreviewTime`), reaproveitável por qualquer feature com preview de timestamp.
> - Avatar-com-fallback-de-ícone reimplementado em dois componentes — extraído pra `shared/components/Avatar.tsx` (com anel gradiente opcional, mesma técnica já usada em `MusicianRecommendationCard.tsx`).
> - `ConversationMessagesPage['conversation']` estava tipado via `Omit<Conversation, ...>`, acoplando um payload de `GET /conversations/:id/messages` a detalhes de enriquecimento que só existem em `GET /conversations` — desacoplado com um tipo-base `ConversationSummary` próprio.
> - `refetch` de `useChat` estava sendo puxado do hook e nunca usado em `ChatScreen` — conectado a um botão "Tentar novamente" no estado de erro, mesmo padrão já usado em `ConversationListScreen`.
> - Polimento visual: bolha própria (`ChatBubble`) passou a usar gradiente `brand` em vez de cor chapada (mesmo tratamento dado a superfícies de destaque no resto do app); avatar da lista de conversas ganhou anel gradiente teal+violeta (design-system.md: "Teal + Violeta → sofisticado, profundo, premium"); `ChatScreen` ganhou um glow ambiente único e contido perto do header (mais discreto que o padrão de 2 glows de outras telas, pra não competir com a legibilidade das mensagens).

**Endpoints backend:** `GET/POST /api/v1/conversations` (lista agora enriquecida com `establishment`/`last_message`/`unread_count`), `GET /api/v1/conversations/:id/messages`, `PATCH /api/v1/conversations/:id/read` + WebSocket `/chat` ✅. Notificação `chat.message.new` via `NotificationsGateway`/`PushNotificationService` (novo `NotificationsChatEventsHandler`) ✅

---

## Bloco 10 — Bottom Tab Navigation (músico) + Home

> Deve ser implementada assim que os Blocos 1-3 estiverem prontos, para dar estrutura visual ao app.

- [x] **10.1** — `MusicianTabNavigator.tsx` com tabs: Home | Ao Vivo | Repertório | Gorjetas | Perfil
- [x] **10.2** — Ícones Lucide por tab (`MusicianTabBar.tsx`) + badge de contagem (pedidos pendentes, via `useRequests(musicianId, 'pending').pending_count`)
- [x] **10.3** — Tela: `HomeScreen` do músico (jul/2026) — `src/features/musician/ui/screens/HomeScreen.tsx` + componentes em `ui/components/` (`HomeHeader`, `NextShowCard`, `QuickAccessGrid`, `DiscoveryCard`, `RecentActivityList`, `RecentBadgesRow`), primitivo `shared/components/GlowCard.tsx`. Visual de referência: `Claude Design/project/Home do Músico.dc.html` (fonte Manrope do mockup trocada por Inter, conforme design-system.md). Real vs. placeholder:
  - **Real:** avatar/nome/saudação (`useMusician`), saldo (`useMusicianWallet` — `MusicianWallet.balance` adicionado ao tipo, campo já vinha do backend), contagem de repertório (`GET /music-library/items` `meta.total`, novo `useRepertoireCount`), atividade recente (`useRequests(musicianId, 'all')` filtrado a `is_accepted`/`is_played`), conquistas (`GET /gamification/users/:user_id/badges`, novo adapter `shared/services/gamification/` + `useMusicianBadges` — nota: usa `userId`/`sub` do Keycloak, não `musicianId`), tile QR Code (navega `Profile > QRCode`), tile Repertório (navega pra tab `Repertoire`, ainda placeholder).
  - **Placeholder, sem endpoint:** "Próximo Show" (sem GET/listagem de booking confirmado no `scheduling-module`) e "Descoberta" (sem analytics de visualização de perfil) — ambos com estado vazio/teaser estático, sem número fabricado. Tiles "Cifras"/"Agenda" visuais e desabilitados (Blocos 7/9 ainda não implementados).
- [x] **10.4** — Guard de role no `RootNavigator` (jul/2026): usuário com role `audience` (sem `musician`) vai para `FanTabNavigator` (`src/navigation/FanTabNavigator.tsx`, shell mínimo — 3 tabs placeholder via `FanTabBar.tsx`, sem FAB, sem socket/push) em vez de cair em `MusicianTabs` por omissão. `FanTabParamList` adicionado a `types.ts`; `makePlaceholder` extraído de `MusicianTabNavigator.tsx` para `navigation/components/PlaceholderScreen.tsx` (reaproveitado pelos dois navigators). Usuário com as duas roles (`musician`+`audience`) continua em `MusicianTabs` (visão de músico tem precedência até o Bloco 10.5 existir). Pré-requisito consumido antecipadamente por 10.5 e pelo Bloco 11 — nenhum dos dois precisa reimplementar esse guard.

---

## Bloco 10.5 — Multi-Role / Account Switching

> Transversal. Implementar após Bloco 2 (músico) e Bloco 11 (fã) estarem operacionais, pois depende de ambos os aggregates existirem.
>
> **Nota (jul/2026):** o guard básico de role (10.4) já existe — `RootNavigator` decide entre `MusicianTabs`/`FanTabs` conforme `user.roles`. Este bloco constrói o *switching* (bottom sheet, token refresh) em cima dele, não o substitui.

- [ ] **10.5.1** — Header de perfil com avatar tappable → bottom sheet com roles ativas (ex.: "Conta Músico ✓ | Conta Fã") — switch instantâneo entre contextos
- [ ] **10.5.2** — CTA "Quero ser Músico também" (visível apenas para usuário com role `audience` only) → aciona wizard do músico (1.13)
- [ ] **10.5.3** — CTA "Quero ser Fã também" (visível apenas para usuário com role `musician` only) → cria aggregate audience + muda para contexto fã
- [ ] **10.5.4** — Após adicionar nova role: backend adiciona role no Keycloak (Admin API) → app executa token refresh silencioso para obter token atualizado com nova role no JWT; transparente para o usuário

**Regra de negócio fechada:** um usuário pode acumular `musician` e `audience` simultaneamente (suportado pelo Keycloak do backend). A troca de contexto não faz logout — apenas altera qual view/tabs o app exibe.

---

## Bloco 11 — MVP Público (Fase 2)

> **Implementado fora de ordem (jul/2026), sob autorização explícita do usuário** — a nota original ("iniciar somente após Bloco 9") foi conscientemente sobrescrita; Bloco 9 (Chat) segue `[ ]`. Depende só do Bloco 10.4 (shell `FanTabNavigator`), que já existia. Todo o código abaixo passou em `npx tsc --noEmit` (limpo) e num bundle real do Metro (Android, `index.bundle`, HTTP 200, todos os módulos novos confirmados presentes no output) — **sem verificação manual em device/emulador** (nenhum disponível neste ambiente, mesma limitação já registrada no Bloco 3).

- [x] **11.1** — Reutiliza `RoleSelectionScreen`/`RegisterScreen` (nenhuma mudança necessária — o guard de role do 10.4 já resolve `FanTabs` pós-registro do fã)
- [x] **11.2** — Esqueleto de domínio do fã: `src/features/audience/{domain,application,infrastructure}` — `audience.types.ts` (espelha `AudiencePresenter`), `establishment.types.ts`, `event.types.ts`, `musician-public.types.ts` (cópia própria de `MusicianPresenter`, não importada de `features/musician` — FSD proíbe cruzar features), `request.types.ts`, `tip.types.ts`, `audience.constants.ts` (`GENRE_OPTIONS` espelhando `VALID_GENRES` de `audience-preferences.vo.ts`, `INSTRUMENT_OPTIONS`, `AMENITY_OPTIONS`), `establishment.constants.ts`. Adapters: `audience.api.ts`, `establishment.api.ts`, `musician-public.api.ts`, `request.api.ts`, `tip.api.ts`, `leaderboard.api.ts`. Hooks (`application/`): `useAudience`, `useEstablishments`/`useEstablishment`/`useEstablishmentEvents`/`useEventPerformers`, `useMusicianPublic`, `useRecommendedMusicians`, `useAttendEvent`, `useScanQr`, `useSongRequest` (suggestions/make/vote), `useSendTip`, `useAudienceGamification`, `useLeaderboard`
- [x] **11.3** — Tela: `FanHomeScreen` — header com saudação + nível (`HomeHeader.tsx`), `QuickActionsRow` (Escanear QR real; Meus Pontos → `Profile > Gamification` via `navigation.getParent()`; Meus Pedidos desabilitado, ver 11.9), carrossel "Recomendados pra você" (`MusicianRecommendationCard`, `GET /audiences/:id/recommendations/musicians`), lista de estabelecimentos (`EstablishmentCard`). **Confirmado parcialmente bloqueado:** sem busca geo real (`roadmap.md` backend 7.13) — feed usa `GET /establishments` sem filtro de proximidade, só paginação simples
- [x] **11.4** — Tela: `FanExploreScreen` — `SearchBar` (nome) + `FilterSheet` (modal customizado com slide via Reanimated 4, sem `@gorhom/bottom-sheet` — não instalado ainda, ver Bloco 10.5.1) sobre `location_city`/`preferred_genres`/`amenities`/`is_verified`; sem raio geográfico (`roadmap.md` 7.13)
- [x] **11.5** — Tela: `EstablishmentDetailScreen` (+ `EstablishmentHero.tsx`, `TagChipRow.tsx`) — rating/is_open_now/amenities/preferred_genres/price_range/menu_pdfs (abre PDF via `Linking.openURL`, sem `expo-linking` — `Linking` nativo do RN já resolve), lista de eventos ativos (`EventListItem.tsx`, date-box no estilo do "Próximo Show" do músico)
- [x] **11.5b** — **Tela nova, descoberta durante a implementação (não estava em nenhum item do roadmap):** `EventPerformersScreen` + `PerformerRow.tsx` — tocar num evento não tinha como levar direto a `SongRequestScreen` (que exige `musicianId` + `eventId` juntos), porque um evento pode ter mais de um performer escalado (`GET .../events/:event_id/performers`). Essa tela lista os performers do evento e só então navega pro perfil público com `eventId` no contexto. Banda (`band_id`, sem `musician_id`) aparece informativa, sem CTA — perfil público de banda não existe ainda
- [x] **11.6** — Tela: `MusicianPublicProfileScreen` (+ `PublicStatCard.tsx`, `SocialLinksRow.tsx` — badge de letra IG/YT/SP, mesmo padrão de `ProfileSocialLinks.tsx` do músico, já que `lucide-react-native` não tem ícones de marca) — readonly, CTA "Pedir música" só habilitado quando a tela recebeu `eventId` no contexto (scan avulso do QR do músico não carrega evento — ver nota 11.7); CTA "Gorjeta" sempre disponível (`event_id` é opcional em `SendTipInput`)
- [x] **11.7** — Tela: `QRScannerScreen` (`expo-camera` `CameraView` + `useCameraPermissions`, API confirmada na v56.0.8 instalada) — parse client-side via regex antes de chamar `POST /audiences/:id/scan-qr` (evita round-trip pra QR obviamente inválido), navega pro perfil **sem** `eventId` (scan do QR pessoal do músico não carrega contexto de evento — só o fluxo Estabelecimento → Evento → Performer, acima, carrega). Esquema `soundmeet://establishment/:id` não suportado (`roadmap.md` 7.15)
- [x] **11.8** — Tela: `SongRequestScreen` (+ `SongSuggestionChips.tsx`) — chama `useAttendEvent` (silencioso, best-effort) ao abrir a tela pra satisfazer `CanMakeRequestPolicy.is_audience_attendee` antes do submit; sugestões via `GET /requests/musicians/:musician_id/suggestions`; envio via `POST /audiences/:id/music-requests` (wrapper gamificado). **Sem catálogo navegável** (`roadmap.md` 7.14) — só free-text + sugestões por popularidade
- [x] **11.9** — `MyRequestsScreen`: **confirmado ainda bloqueado, não implementado** — `GET /audiences/:id/requests` não existe (`roadmap.md` 7.12); tile "Meus Pedidos" em `QuickActionsRow` fica desabilitado ("Em breve"), mesma honestidade visual das tiles Cifras/Agenda da Home do músico
- [x] **11.10** — Tela: `TipMusicianScreen` (+ `TipAmountSelector.tsx`) — `POST /tips` direto (payment-module, confirmado que retorna `qr_code`/`copy_paste_code`, ao contrário do wrapper de audiences-module); QR renderizado com `shared/components/QRFrame.tsx` (reaproveitado); código copia-e-cola exibido como `<Text selectable>` (sem `expo-clipboard` instalado — copiar via long-press nativo do SO, não há botão "copiar" dedicado ainda). Aviso visível de gateway mock (`roadmap.md` Bloco 1.6)
- [x] **11.11** — Tela: `GamificationScreen` (+ `BadgeGrid.tsx`) — pontos/nível/progresso/badges via o MESMO adapter `shared/services/gamification/` criado no Bloco 10.3 (músico), sem duplicar
- [x] **11.12** — Tela: `LeaderboardScreen` (+ `LeaderboardRow.tsx`) — `GET /gamification/leaderboard`. **Gap descoberto:** `UserPointsPresenter` não tem nome/avatar (só `user_id`), e um fã não pode consultar o perfil de OUTRO fã (`GET /audiences/:id` é dono/admin-only) pra resolver isso — tela mostra posição+nível+pontos, sem nome fabricado (ver `roadmap.md` backend 7.16, novo)
- [x] **11.13** — Tela: `FanProfileScreen` — avatar/nome/nível, edição de `favorite_genres`/`favorite_instruments` via `PATCH /audiences/:id/complete-profile`, logout (mesmo `keycloak.service.ts` do músico)

**Componentes novos reutilizáveis criados neste bloco:** `shared/components/Pressable3DCard.tsx` (efeito de profundidade — scale + translateY + rotateX via Reanimated 4 — em toque, usado em `EstablishmentCard`/`MusicianRecommendationCard`/`EventListItem`/`PerformerRow`; deliberadamente não usa `GestureDetector`/Pan pra não roubar o gesto de scroll de listas horizontais). `features/audience/ui/components/EmptyState.tsx` reaproveitado em 4 telas.

**Revisão de qualidade pós-implementação (jul/2026)** — 3 passes de revisão independentes (correção funcional, contratos de backend re-verificados linha a linha contra o código-fonte, conformidade com CLAUDE.md/design-system.md), achados reais corrigidos:
- `GET /gamification/leaderboard` 422ava em toda chamada (`GetLeaderboardInput` sem `@Type(() => Number)`) — corrigido no backend, ver `soundmeet-backend/Docs/roadmap.md` 7.17
- `getUserPoints()` (adapter compartilhado) crashava com `TypeError` pra fã sem pontos ainda — backend retorna `null` cru (não `{data: null}`) nesse caso, `WrapperDataInterceptor` pula o wrap; corrigido pra `data?.data ?? null`
- Pontos/badges do fã não atualizavam na `GamificationScreen` depois de escanear QR ou pedir música — `useScanQr`/`useMakeMusicRequest` só invalidavam o cache de perfil, não o de gamificação (`audiencePointsKey`/`audienceBadgesKey`); `useAttendEvent` deliberadamente **não** ganhou a mesma invalidação — confirmado no código que `AttendEventUseCase` não credita pontos hoje, só registra presença
- `ScanQrResult.points_earned` estava tipado como `number`; o backend retorna `Points.toJSON()` (objeto `{value, source, description, metadata, earnedAt, isRecent}`) só nesse endpoint (scan-qr usa o VO direto, diferente de `MakeMusicRequestResult`/`SendTipResult`, que já eram number) — tipo corrigido, sem uso na UI hoje então sem regressão visível
- `SendTipPayload.establishment_id` era um campo morto (`SendTipDto` do backend não aceita, silenciosamente ignorado) e `TipPaymentMethod` incluía `'debit_card'`, que não existe no enum do backend (`'wallet'`, não `'debit_card'`) — ambos corrigidos
- `QRScannerScreen`: guard de reentrância usava `useState` (assíncrono/batched), possível double-scan disparando 2 chamadas de `scan-qr` + navegação dupla — trocado pra `useRef` síncrono
- `SocialLinksRow`/`SongSuggestionChips`: alvos de toque abaixo de 48×48px (regra do CLAUDE.md) — corrigidos
- `HomeScreen` (músico) e `FanHomeScreen`: cor de glow com `rgba()` mágico em vez de token — trocado por `` `${colors.token}24` ``
- `TipMusicianScreen`: tela de sucesso sem botão de voltar (ao contrário da irmã `SongRequestScreen`) — adicionado
- `BadgeGrid`: animação de brilho só rodava no mount, não reiniciava se uma badge desbloqueasse com o grid já montado (cenário real após o fix de invalidação acima) — dependência corrigida

---

## Libs ainda não instaladas (verificar antes de implementar o bloco correspondente)

| Bloco | Lib | Comando |
|-------|-----|---------|
| 0.10 | `expo-font` | `npx expo install expo-font` |
| 3.2 | `expo-sharing` | `npx expo install expo-sharing` |
| 3.3 | `expo-media-library` | `npx expo install expo-media-library` |
| 2.7 | `expo-image-picker` | `npx expo install expo-image-picker` |
| 11.5 | `expo-linking` | `npx expo install expo-linking` (já vem com Expo, verificar) |

---

## Decisões abertas

| Decisão | Status |
|---------|--------|
| Fonts: Google Fonts via expo ou arquivos locais | ⏳ Definir no 0.10 |
| Push notification — credenciais iOS (APNs) | ⏳ Precisa de conta paga Apple Developer Program; gerar via `eas credentials` → iOS quando for buildar iOS (ver Bloco 4.9) |
| Monitoramento de erros | ⏳ Sentry React Native |
| Algoritmo afinador: YIN vs autocorrelação | ⏳ Definir no Bloco 8 |
| Verificação de celular por SMS/OTP (posse do número coletado no cadastro do músico, item 1.19) | ⏳ Provedor a decidir (Twilio/AWS SNS/Zenvia); CPF único já cobre anti multi-conta por ora |

## Decisões fechadas

| Decisão | Resolução |
|---------|-----------|
| Tela de seleção de papel (músico/fã) | Tela dedicada `RoleSelectionScreen` após COMEÇAR — não integrada ao carrossel de onboarding |
| Cadastro de músico vs fã | Formulário base idêntico (nome + e-mail + senha); diferença acontece pós-login |
| Coleta de dados do músico | CPF + celular no signup (1.19, anti multi-conta); wizard 5 steps pós-login (stage_name + bio → instrumentos + gêneros → foto [Pular] → chave PIX [Pular] → QR pronto) |
| Coleta de dados do fã | Sem wizard — vai direto para home; perfil completa progressivamente; sem CPF/celular no signup |
| Autenticação por telefone | Descartado para MVP (login continua só e-mail+senha); celular agora é coletado (não usado pra login) no signup do músico como chave anti multi-conta/pré-preenchimento PIX |
| Email OU telefone no login | Descartado para MVP — custom Keycloak SPI; reavaliar V2 |
| Google OAuth | V2 pré-App Store; realm já tem identityProvider + keycloak-sync.mjs atualizado; preencher env vars quando pronto |
| Apple Sign In | Descartado — requer Apple Developer Program pago ($99/ano) |
| Login sem browser redirect | Direct Access Grants habilitado no soundmeet-mobile client; email/senha via formulário nativo |
| Google login | Chrome Custom Tab (overlay visual, não troca de app) — obrigatório pelo Google ToS |
| Estabelecimento no app mobile | Fora do MVP mobile; fluxo completo de estabelecimento fica no dashboard web |
| Multi-role / role switching | Suportado via avatar → bottom sheet; token refresh silencioso após nova role; Bloco 10.5 |
| `registrationAllowed` Keycloak | Permanece `false` — registro via `POST /api/v1/auth/register` (Keycloak Admin API) |
| Socket.io vs WebSocket nativo | Socket.io (mais simples com backend NestJS) — implementado no Bloco 4.3/4.4, `NotificationsGateway` `/notifications`, room `user:${sub}` auto-join no connect |
| Push notification service | Expo Notifications + `expo-server-sdk` (backend) — código pronto (Bloco 4.9). **Android configurado** (jul/2026): `google-services.json` + chave de service account FCM V1 enviada ao EAS via `eas credentials`. iOS (APNs) segue pendente — ver linha em Decisões abertas |
