@AGENTS.md

# SoundMeet Mobile — Claude Code Instructions

**Conceito:** App mobile da plataforma SoundMeet — conecta músicos, público e estabelecimentos via QR code, pedidos musicais, gorjetas PIX e gamificação.

**Projeto:** `soundmeet-mobile/` (React Native + Expo SDK 56)
**Backend:** `../soundmeet-backend/` (NestJS — **255 endpoints HTTP, 26 módulos, 23 domínios DDD** — recontado em 22/ago/2026)

---

## Documentação canônica — leia antes de implementar

| Doc | Quando usar |
|-----|-------------|
| `Docs/soundmeet-mobile-plan.md` | Decisões de plataforma, stack, arquitetura, ordem de desenvolvimento |
| `Docs/design-system.md` | **Fonte de verdade** de cores, tokens, tipografia, espaçamento, sombras |
| `Docs/roadmap-mobile.md` | Próxima tarefa a implementar — não pule a ordem dos blocos |
| `Docs/refs-front.md` | Referências visuais (Dribbble / Pinterest) |
| `Docs/workflow/git-workflow.md` | Commits e branches |
| `../soundmeet-backend/prisma/schema.prisma` | Entidades e tipos de dados |

> **Atenção:** O `Docs/design-system.md` é mais recente que o `Docs/soundmeet-frontend-plan.md`.
> Em caso de conflito de cores ou tokens, o **design-system.md prevalece**.

---

## Stack instalada (package.json é a fonte de verdade)

| Camada | Biblioteca | Versão |
|--------|-----------|--------|
| Framework | Expo SDK | 56 |
| Runtime | React Native | 0.85.3 |
| Linguagem | TypeScript | ~6.0 |
| Navegação | React Navigation | v7 (**native-stack** + Bottom Tabs) |
| Animações | **Reanimated** | **4.x** — API nativa direta |
| Gestos | react-native-gesture-handler | ~2.31 — Gesture API (`Gesture.Pan()`, `GestureDetector`) |
| Animações Lottie | lottie-react-native | ~7.3 |
| Estado servidor | TanStack Query | v5 |
| Estado cliente | Zustand | v5 |
| HTTP | Axios | ^1.18 |
| Estilo | `StyleSheet.create` + `tokens.ts` | RN nativo — NativeWind **removido** |
| Ícones | Lucide React Native | ^1.21 |
| Auth | expo-auth-session | SDK 56 |
| Storage seguro | expo-secure-store | SDK 56 |
| Validação de formulário | Zod | ^4 |
| Formulário (telas standalone) | react-hook-form + @hookform/resolvers | ^7 / ^5 |
| Câmera / QR | expo-camera | SDK 56 |
| Notificações push | expo-notifications | SDK 56 |
| Keep awake | expo-keep-awake | SDK 56 |
| SVG | react-native-svg | ^15 |
| Áudio (permissão de microfone) | expo-audio | SDK 56 |
| Detecção de pitch (afinador) | react-native-pitchy | ^1.3 |

### Libs NÃO instaladas — verificar package.json antes de usar
- `expo-av` — **removido** (06/07/2026): nunca usado em `src/`, causava crash no boot em New Architecture (`NoClassDefFoundError: LazyKType` no `VideoViewModule`). Substituído por **`expo-audio`** (instalado 10/07/2026 pro afinador cromático, Bloco 8 — usado só pela API de permissão de microfone; `react-native-pitchy` faz a captura+detecção de pitch por conta própria, ver seção de áudio/tuner abaixo).
- `@shopify/react-native-skia` — não instalado ainda (ver Tier 3 na seção de animação abaixo — decisão tomada 10/07/2026: **não usar** no afinador cromático, arco radial com glow em SVG + Reanimated já cobre a necessidade)
- `@react-three/fiber` — não instalado ainda
- Gluestack UI — não instalado ainda
- `nativewind` + `tailwindcss` — **desinstalados** (28/jul/2026): ficaram meses desabilitados com zero `className` em `src/`, mas ainda pesando ~28MB e ativos no pipeline do Metro. Ver a seção "Estilização" para o motivo técnico e as condições de reavaliação.
- `@react-navigation/stack` — **desinstalado** (28/jul/2026): já era proibido em runtime (usa `InteractionManager`, depreciado no RN 0.85+), mas sobrevivia como import de tipo em `navigation/types.ts`, tipando errado três navigators que são `createNativeStackNavigator`. Ver "Navegação — decisão crítica".

> **Correção (jul/2026):** `@gorhom/bottom-sheet` **já está instalado e em uso** (`InviteMemberSheet`, `OpenToGigsDecisionSheet`, `FilterSheet`, `RoleSwitchSheet`, `ChordDiagramSheet`) — a entrada anterior nesta lista dizia "não instalado ainda", desatualizada. Ver Tier 2 abaixo.

### Libs incompatíveis com React Native — NUNCA use
- GSAP, Framer Motion, Barba.js, Anime.js → DOM-only, não funcionam em RN
- **Moti** → NÃO usar; v0.30 (latest) só suporta Reanimated 3; incompatível com Reanimated 4 + New Architecture (Expo SDK 56). Sem versão compatível disponível (v1.0 não lançada). Reconfirmado via pesquisa em 06/07/2026 — segue sem suporte oficial a Reanimated 4.
- Use **Reanimated 4 diretamente**: `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withRepeat`, `withDelay`, `withSpring`, `interpolateColor`

### Libs de animação — pesquisa 06/07/2026 (Tier 1 e 2 aprovados)

> Levantamento feito para decidir a base de animação do app, já que Moti/Framer Motion/GSAP estão descartados (ver acima). Tier 3 (Skia/Skottie) e Tier 4 (Rive) existem mas não estão aprovados aqui — avaliar caso a caso quando surgir a necessidade (celebrações de gamificação). Afinador cromático (Bloco 8) já avaliado 10/07/2026: **Skia não necessário** — arco radial com glow implementado só com `react-native-svg` + `useAnimatedProps`/`interpolateColor` do Reanimated 4, mesma técnica de `WizardProgress.tsx`.

**Tier 1 — já instalado, é a base certa, continuar usando como padrão principal:**
- `react-native-reanimated` (v4) + `react-native-worklets` — fundação de toda animação; hand-roll direto (`useSharedValue`/`useAnimatedStyle`/`withTiming`/`withSpring`/`interpolateColor`), sem lib de abstração por cima
- `react-native-gesture-handler` — parear com Reanimated pra interações de gesto (swipe accept/reject de pedidos, drag de bottom sheet)
- `lottie-react-native` — ilustrações complexas vindas de After Effects (onboarding, wizard); sem interatividade, só reprodução
- `react-native-svg` — gráficos vetoriais custom (já usado em `WizardProgress.tsx`)

**Tier 2 — já instalado e em uso:**
- `@gorhom/bottom-sheet` v5 — suporte **first-class** confirmado a Reanimated 4 + New Architecture (Fabric). Resolve snap points, backdrop, gesto de arrastar de forma nativa e performática — não vale reinventar isso à mão. Padrão: `BottomSheetModal` + `BottomSheetBackdrop` (`pressBehavior="close"`) + `BottomSheetView`, prop `visible` + **`useSheetModalVisibility(visible)`** (`shared/hooks/`) → `ref={sheetRef}` e `onDismiss={trackDismiss(onClose)}`.
  - 🔴 **Nunca `useEffect(() => { if (visible) present(); else dismiss(); })`** (era o padrão até 25/set/2026, em 23 sheets). Na 5.2.x, `dismiss()` num modal fechado prende o status em `DISMISSING` e o `handlePortalRender` passa a recusar renderizar: **todo `present()` seguinte é no-op mudo**. Pegava no mount com `visible=false` (diagrama de acorde, seletor, anotação nunca abriam) e depois de o usuário fechar por gesto (o sheet abria uma vez só). O hook só chama `dismiss()` em sheet aberto; o `trackDismiss` é obrigatório porque é ele que avisa que a lib fechou sozinha. Regressão em `shared/hooks/__tests__/useSheetModalVisibility.test.tsx`, verificada contra o padrão antigo. Já usado em `InviteMemberSheet`/`OpenToGigsDecisionSheet`/`FilterSheet`/`RoleSwitchSheet`/`ChordDiagramSheet` (diagrama de acorde no Play Mode, jul/2026).

### Navegação — decisão crítica
- **NUNCA usar `@react-navigation/stack`** — usa `InteractionManager` internamente, depreciado no RN 0.85+. **Desinstalado em 28/jul/2026**; nem como import de tipo.
- **Sempre usar `@react-navigation/native-stack`** — animações nativas via `react-native-screens`, sem `InteractionManager`, mais performático
- **A tipagem tem que casar com o navigator.** Até 28/jul/2026, `RootScreenProps`, `AuthScreenProps` e `ProfileScreenProps` em `navigation/types.ts` usavam `StackScreenProps` (stack JS) enquanto `RootNavigator`, `AuthNavigator` e `ProfileStackNavigator` são `createNativeStackNavigator` — as screens recebiam um tipo que promete opções de `setOptions` que o native-stack ignora em runtime. Todos os helpers agora usam `NativeStackScreenProps`; tabs seguem com `BottomTabScreenProps`.

---

## Identidade visual (resumo — detalhes em `Docs/design-system.md`)

### Cor da marca: Teal `#00E0B8`
> Violeta aparece no plano antigo mas foi **substituído por Teal** na decisão final.
> Violeta (#7C3AED) ainda é usado como accent de momentos premium/assinatura.

| Token | Hex | Uso |
|-------|-----|-----|
| `colors.brand.primary` | `#00E0B8` | Logo, CTAs primários, ativo |
| `colors.bg.primary` | `#0C0C14` | Background base |
| `colors.accent.coral` | `#FF6B6B` | Gorjetas, CTA de energia |
| `colors.accent.violet` | `#7C3AED` | Momentos premium, badge especial |
| `colors.status.success` | `#10B981` | PIX confirmado, aceito |

**Dark mode é o padrão.** Light mode existe como toggle.

### Tipografia
- **Space Grotesk** — displays, títulos, wordmark
- **Inter** — body, UI padrão
- **JetBrains Mono** — cifras, acordes, código

---

## Arquitetura: Feature-Sliced Design (FSD)

> **Layout real (verificado jul/2026) difere do idealizado abaixo:** só existem hoje `auth, musician, audience, payment, scheduling, shared-repertoire`. `establishment` foi excluído do MVP mobile (decisão fechada — Fase 3, dashboard web). `gamification` não virou slice própria — vive em `shared/services/gamification/` por ser consumida tanto por `musician` quanto por `audience`. `ai-cifra` nunca ganhou slice própria — a lógica de chord-sheet/Play Mode vive dentro de `features/musician/`. `band` (gestão de banda) ainda não tem nenhuma slice — ver roadmap-mobile.md.

```
src/
  features/
    musician/
      domain/         # tipos, interfaces, validações locais
      application/    # hooks que orquestram use-cases (TanStack Query)
      infrastructure/ # adapters de API (1 arquivo = 1 recurso backend)
      ui/             # screens e components da feature
    audience/
    establishment/
    payment/
    gamification/
    scheduling/
    ai-cifra/         # (futuro)
  shared/
    components/       # design system (Button, Card, Avatar...)
    hooks/            # hooks utilitários compartilhados
    services/
      http/           # Axios client + interceptors
      websocket/      # Socket.io client
      storage/        # expo-secure-store abstraído
    design-system/    # tokens de cor, tipografia, espaçamento
    utils/
  navigation/         # React Navigation (stacks, tabs, drawers)
  app/                # entry point, providers, bootstrapping
```

### Convenções por camada
- `domain/` → TypeScript puro, sem imports de RN ou Expo
- `application/` → hooks com TanStack Query; lógica de negócio aqui, não em `ui/`
- `infrastructure/` → 1 arquivo por recurso backend; retorna tipos do `domain/`
- `ui/` → screens e components; delegam para hooks de `application/`
- Nunca importar de `features/X` dentro de `features/Y` — use `shared/`

---

## Convenções de código React Native

### Estilização — quando usar cada abordagem

> **NativeWind REMOVIDO de vez (28/jul/2026) — não reintroduzir sem decisão explícita.**
> Motivo original: `react-native-css-interop` v0.2.x substitui o JSX runtime via
> `createInteropElement()`, incompatível com Fabric + Hermes JSI do Expo SDK 56, causando
> `Cannot read property 'useContext' of null` em qualquer hook filho. Ficou desabilitado
> por semanas (preset do babel fora, zero `className` em `src/`) mas continuava instalado
> e ativo no pipeline do Metro — puro peso morto. O que saiu: pacotes `nativewind` +
> `tailwindcss` (~28MB com o `react-native-css-interop`), `withNativeWind` do
> `metro.config.js`, `global.css`, `tailwind.config.js`, `nativewind-env.d.ts` e o
> `import './global.css'` do `App.tsx`. Os tokens de cor do `tailwind.config.js` já
> estavam duplicados em `tokens.ts` — nada se perdeu.
>
> **Estilo é 100% `StyleSheet.create` + `tokens.ts`.** Reavaliar só se o NativeWind v5
> (reescrita para New Architecture) sair e for comprovadamente compatível com esta stack.

| Situação | Abordagem correta |
|----------|------------------|
| Qualquer layout ou estilo | **`StyleSheet.create`** + tokens de `tokens.ts` |
| Valores animados de Moti/Reanimated | **`style` prop** — sempre |
| Valores computados em JS (ex: `width: SW * 0.6`) | **`style` prop inline** |
| Sombras multi-campo | **`StyleSheet`** ou spread do token `shadows.*` |

**Nunca usar número mágico de cor, fonte ou espaçamento.** Toda cor vem de `tokens.ts`; toda tipografia vem de `typography.*`; todo espaçamento vem de `spacing.*`. Nada hardcoded.

Exemplo correto:
```tsx
// StyleSheet para tudo (NativeWind removido do projeto)
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary, paddingHorizontal: spacing.xl },
});

// Animação → style prop (obrigatório)
<MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: spacing.xl }}>

// Sombra → spread do token
<View style={[s.card, shadows.brand]}>
```

### `position: absolute` — uso correto

`position: absolute` é válido **apenas** para:
- Elementos decorativos que flutuam sobre o layout (glows, partículas, overlays)
- Elementos de UI que precisam se sobrepor ao conteúdo (FAB, badge, tooltip)

**Nunca** usar para estrutura de layout — use Flexbox.

**Regra de coordenadas:** nunca hardcodar `top/left` em pixels absolutos. Use:
- `Dimensions.get('window')` no nível do módulo (constante de arquivo, portrait-only)
- Percentuais via `SW * 0.5`
- Flexbox + `alignSelf` quando possível

> **Convenção mantida:** use `Dimensions.get('window')` no nível do módulo em
> subcomponentes, não `useWindowDimensions()`. A restrição original era técnica (o
> NativeWind v4 interceptava o render via `api.js` e quebrava o dispatcher de hooks) e
> deixou de existir com a remoção do NativeWind — mas a convenção continua valendo por
> simplicidade: o app é `orientation: portrait` (app.json), a largura nunca muda, e uma
> constante de módulo evita re-render desnecessário.

```tsx
// Padrão para subcomponentes
const SW = Dimensions.get('window').width; // módulo level — portrait-only, seguro

export function OnboardingBackground() {
  // sem hook, sem problema
```

### Tamanho de arquivo e componentização

**Limite: ~200 linhas por arquivo.** Acima disso, extrair componentes.

Regra de extração:
- Tem nome lógico próprio? → componente
- Tem mais de ~60 linhas de JSX? → componente
- Pode ser reutilizado em outra tela? → `src/shared/components/`
- É específico de uma feature? → `src/features/[feature]/ui/components/`

Estrutura padrão de tela grande:
```
features/auth/ui/
  screens/
    OnboardingScreen.tsx      # orquestra, < 150 linhas
  components/
    OnboardingBackground.tsx  # layer decorativo
    OnboardingHero.tsx        # logo + anéis
    SlideCarousel.tsx         # slides + dots (reutilizável → shared)
shared/components/
  EqBar.tsx                   # reutilizado em múltiplas telas
  FloatingParticle.tsx        # reutilizado em múltiplas telas
```

### Formulários — Zod + React Hook Form (padrão obrigatório, item 1.21)

Toda validação de formulário usa **schema Zod** (`domain/*.validation.ts`) como fonte única de tipo + regra — nunca `useState` por campo com uma função `validateX` manual escrita à mão.

Dois tratamentos, escolhidos pela arquitetura da tela (não por preferência pontual):

| Situação | Abordagem |
|----------|-----------|
| Tela standalone com 1 form e 1 submit (ex.: `LoginScreen`, `RegisterScreen`, `CompleteMusicianSignupScreen`) | Zod schema + `useForm({ resolver: zodResolver(schema) })` + `<Controller>` por campo. Ganho: cada `Controller` isola o próprio re-render (ex. `PasswordStrengthHint` só re-renderiza dentro do `Controller` de senha), schema único como fonte de tipo+validação. |
| Steps de um wizard multi-tela com estado central (`useReducer`) e botão de avançar **fora** do form (ex. `MusicianSetupWizardScreen`/`StepOneIdentity`/`StepFourPix`) | **Só Zod** (`schema.safeParse`), sem `react-hook-form` — encaixar RHF exigiria `forwardRef`/`useImperativeHandle` só pra um botão externo disparar validação; complexidade desnecessária para 1-2 campos por step. |

Regras:
- Schemas ficam em `features/[feature]/domain/*.validation.ts` — nunca dentro de `ui/`.
- Reaproveitar validadores primitivos já existentes em `shared/utils/` (`cpf.ts`, `phone.ts`, `email.ts`) dentro do `.refine()`/`.superRefine()` — nunca duplicar um regex de e-mail/CPF/telefone dentro de um schema.
- O componente de input (`FormField`) nunca importa de `react-hook-form` — recebe só `value`/`onChangeText`/`onBlur`/`error`, pra funcionar tanto sob `Controller` quanto sob o padrão Zod-only do wizard.
- Antes de criar um novo formulário (`EditProfileScreen`, onboarding de estabelecimento, etc.), reveja esta seção — não reintroduzir validação manual por `useState`.

### Dimensões e responsividade

- **`Dimensions.get('window')`** no nível do módulo — app é `portrait` travado (app.json), largura constante
- **Evitar `useWindowDimensions()`** em subcomponentes — desnecessário em portrait travado
- Preferir Flexbox + percentuais a pixels absolutos
- Tamanhos mínimos de toque: **48×48px** em todo elemento interativo

---

## Regras de ouro — NUNCA viole

- **Docs/design-system.md é a fonte de verdade de design** — não inventar tokens fora dele.
- **Reanimated 4** — não assumir API do Reanimated 3; verificar docs da versão instalada.
- **Expo SDK 56** — verificar docs em `https://docs.expo.dev/versions/v56.0.0/` antes de usar qualquer API.
- Domínio não depende de infra — `domain/` sem imports de Axios, Expo ou RN.
- Nunca colocar lógica de negócio em screens ou components de `ui/`.
- Nunca commitar `.env`, secrets, `node_modules`.
- Nunca fazer force push em `master` ou `develop`.
- **Commits somente quando o usuário pedir explicitamente.**
- Diff mínimo — não refatorar código não solicitado.
- Nunca implementar features fora da ordem do `Docs/roadmap-frontend.md` sem confirmação.
- Verificar `package.json` antes de usar qualquer lib — não assumir que está instalada.
- **Nunca hardcodar número mágico** — toda cor/fonte/espaçamento referencia um token.
- **Arquivo de screen > 200 linhas?** Extrair componentes antes de continuar.

---

## UX do músico — regras de design obrigatórias

O músico usa o app em condições adversas (palco, bar escuro, uma mão livre):

1. **Tela ao vivo (Play Mode)** — fonte mínima 18px, contraste máximo, 0 distrações.
2. **Ações críticas** (aceitar/rejeitar pedido) — botões grandes, swipe gestures (direita = aceitar, esquerda = rejeitar).
3. **Áreas de toque** — mínimo 48×48px em todos os elementos interativos.
4. **Keep awake** — `expo-keep-awake` ativo em todas as telas de performance.
5. **Notificações push** — músico não precisa ter o app aberto para receber gorjeta/pedido.

---

## Ordem de desenvolvimento (MVP)

### Fase 1 — MVP Músico (atual)
1. Onboarding + Login Keycloak (PKCE via `expo-auth-session`)
2. Criar / editar perfil do músico
3. QR Code gerado (exibir)
4. Gerenciar pedidos ao vivo
5. Gorjetas recebidas (histórico)
6. Analytics básico pós-evento
7. Repertório (criar, listar, Play Mode)
8. Afinador cromático (`expo-audio` só pra permissão de microfone + `react-native-pitchy` pra captura/detecção MPM — `expo-av` foi removido, ver seção de libs)
9. Chat com estabelecimentos (WebSocket)

> **Próxima tarefa = primeiro `[ ]` em `Docs/roadmap-mobile.md`**

### Fase 2 — MVP Público
Scanner QR → Perfil músico → Pedido + votação → Gorjeta PIX → Gamificação

### Fase 3 — Dashboard Web (`soundmeet-web/` — futuro Next.js)

---

## Autenticação

> 🔴 **AUTH-3 (25/set/2026): e-mail e senha são NATIVOS de novo.** A `LoginScreen`
> coleta a senha e a manda a `POST /auth/login`, que faz o grant no client
> CONFIDENCIAL do Keycloak — este app nunca fala `grant_type=password` com o
> Keycloak. Só o **Google** usa o PKCE descrito abaixo.
>
> - **Refresh e logout escolhem o canal pelo `azp` do token**
>   (`shared/services/auth/session-channel.ts`): sessão do client público
>   (Google) renova no Keycloak; sessão do confidencial (senha e cadastro)
>   renova em `POST /auth/refresh`. O Keycloak recusa refresh token de client
>   diferente do emissor — era por isso que quem se cadastrava caía no login
>   uns 15 min depois. Regressão em `session-routing.test.ts`.
> - `password-session.api.ts` usa instância axios **própria**: um 401 de
>   login/refresh passando pelo `httpClient` dispararia o refresh do interceptor,
>   que chamaria a si mesmo.
> - **Conta de estabelecimento é recusada ANTES de gravar a sessão**, e a sessão
>   aberta no provedor é revogada.
> - Visual: `SoundwaveMark` (a logo viva — barras medidas do PNG, onda nascendo
>   do ponto central, reage a cada tecla, acelera no envio, clipa em coral no
>   erro), `StageLightsBackground` (dois feixes de refletor) e
>   `ForgotPasswordSheet`. Tudo respeita "reduzir movimento".

**Keycloak + OAuth 2.0 Authorization Code Flow (PKCE)** — hoje só o login com Google

- Lib: `expo-auth-session`
- Storage: `expo-secure-store`
- Redirect URI: `soundmeet://auth/callback`
- Token refresh automático via interceptor Axios
- Claims do Keycloak: `musician_id`, `establishment_id`, `audience_id`, `roles`

### ⚠️ Variável de ambiente SEM `EXPO_PUBLIC_` não chega ao aparelho

`babel-preset-expo` inlina **apenas** `process.env.EXPO_PUBLIC_*`
(`plugins/inline-env-vars.js`), e o React Native monta `global.process.env` sem nada além de
`NODE_ENV` (`Libraries/Core/setUpGlobals.js:32`). A variável antiga chamava-se `APP_ENV`: era
`undefined` em runtime, então **todo APK/IPA publicado se declarava `development`** — o Sentry
marcava evento de produção como dev e amostrava 100% das transações, e qualquer regra "só em
produção" nascia morta. Renomeada para `EXPO_PUBLIC_APP_ENV` em 26/ago/2026 (SM-017).

Duas consequências que valem para qualquer variável nova:

- Referência precisa ser **estática** (`process.env.EXPO_PUBLIC_X`). Acesso dinâmico
  (`process.env[chave]`) compila e devolve `undefined` no aparelho.
- `src/shared/services/config/env.ts` valida no boot e **recusa `http://`/`ws://` fora de
  development** — por ali passam o access token de toda chamada e o JWT do handshake do
  Socket.io. O piso é `__DEV__`, não a variável: bundle de release sem `EXPO_PUBLIC_APP_ENV`
  assume `production`, o mais restrito. Em `production` o host ainda precisa estar em
  `PRODUCTION_HOST_ALLOWLIST`. `npm run check:eas-env` faz a mesma checagem em `eas.json`
  antes do build.
  - ⚠️ **A senha VOLTOU a passar por aqui** no AUTH-3 (25/set/2026): `POST /auth/login` vai
    pelo `API_BASE_URL` — mais um motivo para a recusa de `http://` fora de development. O
    `KEYCLOAK.URL` (só o Google, hoje) passa pela mesma validação de esquema.

---

## HTTP Client (Axios)

Interceptors obrigatórios:
1. Attach JWT (`Authorization: Bearer <token>`)
2. Refresh automático de token expirado
3. Error handling global (401 → logout, 422 → exibir erros de validação)

### Envelope de resposta do backend — NUNCA esqueça

O backend embrulha **toda** resposta HTTP num envelope via `WrapperDataInterceptor` global (padrão FC3):
- Recurso único: `{ "data": { ...recurso } }`
- Lista paginada: `{ "data": [...], "meta": { current_page, per_page, ... } }` (o interceptor pula o wrap quando o body já tem `meta`, ou é falsy)

**Regra obrigatória em todo adapter de `infrastructure/`:** tipar a resposta como
`ApiEnvelope<T>` (de `src/shared/services/http/types.ts`) e retornar `data.data` —
nunca `data` cru. Ignorar isso causa campos `undefined` silenciosos (bug real:
cadastro criava a conta mas o app lia `access_token` undefined e mostrava "erro
inesperado").

```ts
const { data } = await httpClient.post<ApiEnvelope<RegisterResponse>>('/auth/register', payload);
return data.data; // ← desembrulha o envelope
```

---

## Git & Commits

### Branches
- `master` (produção), `develop` (desenvolvimento)
- `feature/nome` · `bugfix/nome` · `hotfix/nome` · `release/x.y.z`

### Conventional Commits
```
type(scope): description
```

**Escopos mobile:** `project` · `auth` · `navigation` · `design-system` · `musician` · `establishment` · `audience` · `payment` · `gamification` · `scheduling` · `ai-cifra` · `shared` · `ui` · `build` · `expo`

---

## Estado atual (jul/2026)

> Última verificação: auditoria completa em 16/jul/2026, lendo os arquivos reais (não só o roadmap). A versão anterior desta seção ("apenas estrutura de pastas, sem implementação real") estava **desatualizada** — há ~27.600 linhas de código real em `src/`, com Blocos 0-11 do `roadmap-mobile.md` majoritariamente implementados e integrados ao backend de verdade (não mock), exceto onde o próprio roadmap-mobile.md diz o contrário.

### O que está implementado e funcional
- Auth PKCE real via `expo-auth-session` contra Keycloak (não stub)
- Onboarding, signup, wizard de setup do músico, perfil (view/edit), QR Code (código pronto, falta só confirmação em device com dev client novo — ver Bloco 3)
- Pedidos ao vivo com socket.io real, gorjetas/wallet reais (`GET /musicians/:id/wallet`), analytics real
- Repertório + Play Mode consumindo a pipeline real de IA musical (`GET .../chord-sheet`, tokens com timestamp real quando disponíveis). **jul/2026:** diagrama de acorde no tap (`ChordDiagramSheet`, dataset `@tombatossals/chords-db` + braço do violão em `react-native-svg`) e redesign de animação (linha ativa em mola, progresso com gradiente animado, badge de transição de seção, micro-interações na barra inferior) — código completo/typecheck limpo, **sem confirmação em device ainda**.
- Afinador cromático e Chat com estabelecimentos: código completo, pendente só de confirmação em device físico (módulo nativo/teste com 2 usuários)
- MVP Público (Bloco 11): scanner QR real (`expo-camera`), gamificação (badges/pontos/leaderboard) consumindo endpoints reais, envio de gorjeta real
- Multi-role switching, tabs, agenda/scheduling — reais

### Gaps confirmados (não é falta de implementação genérica — são itens específicos)

> **Revisado em 06/ago/2026** contra o código do backend. Três afirmações desta lista estavam
> desatualizadas e foram corrigidas abaixo — ver `../soundmeet-backend/Docs/roadmap-web.md` §2.

- ~~Login via Google OAuth — não implementado~~ — **existe** (`loginWithGoogle`, `kc_idp_hint`)
- ~~**Login por senha (AUTH-1, 31/ago/2026):** a `LoginScreen` não tem mais campos de e-mail/senha.~~
  **Revertido no AUTH-3 (25/set/2026)**: os campos voltaram, e `POST /auth/login` também — no
  client confidencial. Ver a seção "Autenticação" acima
- ~~`MyRequestsScreen`~~ · ~~Checkout de assinatura~~ · ~~Criar banda~~ — **os três entregues em 05/set/2026**, junto com o **saque PIX**, que nem estava nesta lista. Ver `Docs/roadmap-mobile.md` 11.14 a 11.18 e a seção "Carteira, assinatura e banda" abaixo
- ~~**ai-audio (separação de stems) como feature de produto — zero UI**~~ — **desatualizado:** o Modo Ensaio (Bloco 12, 22/ago/2026) é exatamente isso (`PracticeModeScreen` + `usePracticeStems`)
- Skia, Gluestack UI — não instalados (não são mais um plano ativo, ver seção de libs de animação acima)

### ⚠️ Tema claro — infraestrutura pronta, migração ESCALONADA (05/set/2026)

O `design-system.md` anuncia *"Light mode existe como toggle"* desde jun/2026 e
**não existia**: `ThemeContext` e `useTheme` estavam prontos com **zero
consumidores**, e 271 arquivos liam `colors` direto de `tokens.ts`. Não era
esquecimento — era um beco, e agora ele tem saída.

**🔴 A razão técnica, que explica por que ninguém tinha migrado.**
`StyleSheet.create` roda no **carregamento do módulo**, antes de qualquer
componente montar: nenhum hook alcança ali. Adotar o tema exigiria reescrever
todo bloco de estilo do app. A saída é `shared/design-system/makeStyles.ts`:

```ts
const useStyles = makeStyles((colors) => ({ root: { backgroundColor: colors.bg.primary } }));
export function Tela() { const s = useStyles(); /* … */ }
```

A folha é memoizada **por tema** — trocar de tela não recria nada.
⚠️ **Estilo que só usa `spacing`/`radius`/`typography` NÃO migra**: não muda com
o tema, e trocar folha estática por hook é custo sem ganho.

**🔴 Dois bloqueios que existiam antes da migração, e ninguém tinha visto:**

- **`ThemeContext` cobria só 4 dos 6 grupos** — faltavam `accent` e `status`
  inteiros. Uma tela migrada quebraria no primeiro `colors.accent.coral`
  (gorjeta) ou `colors.status.success` (PIX confirmado), que são as cores do que
  o produto **faz**. Hoje o tipo é derivado de `tokens.ts` (`Widen<typeof
  darkTokens>`), então esquecer um grupo virou erro de compilação.
- **`lightColors` tinha 8 chaves** e o `ThemeContext` inventava o resto em
  runtime (`'#007A63'`, `'#64748B'`) — valores que não existiam em documento
  nenhum e que ninguém tinha medido. Agora a paleta nasce inteira em
  `tokens.ts`, espelhando `soundmeet-web/src/app/globals.css`.

**🔴 A paleta clara foi MEDIDA contra WCAG e reprovava.** É o que o
`architecture.md` do web já pedia desde o W0 e nunca fora executado:

- `brand.primary` dava **3.87** para texto branco em cima — o rótulo do **botão
  primário** reprovava AA;
- `border.default` (1.23) e `border.strong` (1.54) contra os **3.0** que o
  critério 1.4.11 exige: campo de formulário cuja borda não se enxerga;
- `text.muted` reprovava sobre `bg.elevated`.

Corrigidas escurecendo com matiz preservado (HLS). Como todos os fundos claros
estão perto do branco, escurecer o suficiente para o texto passar faz o branco
**em cima** passar junto — não há trade-off, só um piso.

**🔴 E o teste encontrou o que eu não procurava: o tema ESCURO, que está em
produção, também reprova.** `text.muted` (2.16–2.57), `accent.violet`
(2.87–3.42, como texto **e** como fundo de botão), `border.strong` (1.63–1.94).
**Não corrigi**, e a escolha é deliberada: `accent.violet` é cor de marca e
`text.muted` pinta caption em mais de cem lugares — é decisão de design, não
conserto mecânico. As falhas viraram `KNOWN_DARK_FAILURES` em
`design-system/__tests__/theme-contrast.test.ts`, com a asserção comparando o
**conjunto exato**: elas não podem crescer, e corrigir uma obriga a apagar a
linha. Mesmo precedente do allowlist de `route-auth-coverage.spec.ts` no backend.

**Cobertura da migração — 234 de 268 arquivos (87%):**

| | |
|---|---|
| `shared/components` | **35/35** ✅ |
| Telas (`ui/screens`) | **57/57** ✅ |
| Componentes de feature | ~142 de 176 |

`ThemeProvider` com três estados (sistema → claro → escuro; "sistema" é o
default e segue o aparelho via `useColorScheme`) e `ThemeMenuRow` no Perfil do
músico **e** do fã.

⚠️ **Os 34 restantes são as formas que o codemod RECUSA**, e a recusa é a
feature. Quase todos são "helper (não exportado) usa a folha ou cor fora do
componente exportado" — `AnimatedStatCard`, `BadgeCard`, `MenuItem`, `Segment`,
`Row`… O hook injetado no componente exportado não alcança aquele escopo, e o
conserto é o mesmo padrão já aplicado em `QRFrame`/`ResultList`/`AnimatedDot`:
o helper **é componente**, então chama `useStyles()`/`useTheme()` por conta
própria. Enquanto não forem migrados, esses trechos ficam escuros no tema claro
— visualmente errado, nunca quebrado.

⚠️ **`scripts/migrate-theme.py` recusa mais do que aceita, de propósito.** A
primeira versão migrava tudo que casasse com o padrão feliz e estragou arquivos
de **seis** formas distintas, cada uma descoberta só quando o `tsc` ficou
vermelho:

1. **mapa de cor em constante de módulo** (`PrimaryButton`, `HOME_GLOWS`,
   `SLIDES`, `TONE_COLOR`) — array/objeto avaliado no carregamento congela a
   paleta escura;
2. **arquivo com vários componentes** (`Skeleton`) — o hook entrava só no
   primeiro;
3. **helper usando cor fora do componente exportado** (`QRFrame`);
4. **valor padrão de parâmetro** (`accentColor = colors.brand.primary`) — é
   avaliado fora do corpo, onde o hook não existe. O conserto é
   `accentColor?: string` + `accentColor ?? colors.…` dentro;
5. **assinatura genérica** (`ResultList<T extends { id: string }>({…}: {`) — o
   `}) {` na coluna zero truncava a varredura do bloco ANTES do corpo, e o
   helper passava como limpo;
6. **folha sem cor mas componente com cor em prop** (`ChordDiagram`,
   `AmbientGlowBackground`) — seriam classificados "estático" e ficariam presos
   no dark para sempre, sem nada quebrar.

Rodar em lote sem conferir cada arquivo é como se introduz regressão visual em
massa. A flag `--prepared` existe só para arquivos em que o autor **já** injetou
o hook nos helpers à mão.

---

### ✅ Estados de tela: `EmptyState` e `Skeleton` — 05/set/2026

Duas dívidas visuais sistêmicas, medidas antes de atacar. Não eram falta de
tela: atingiam as 57 que já existiam.

**`EmptyState` promovido para `shared/components/`.** Morando em
`features/audience/ui/components/`, a regra de ouro do FSD impedia `musician`,
`scheduling`, `contract` e `payment` de importá-lo — então **21 lugares**
reescreveram o mesmo `View` centralizado com `emptyTitle`/`emptySubtitle` à mão,
cada um com um espaçamento e uma decisão de ícone diferente. Mesmo precedente e
mesmo motivo de `StageTechSpecSection` (F1.2). **9 telas migradas**; os estilos
mortos foram removidos junto, senão a duplicação volta pela porta dos fundos.

- **`icon` é obrigatório.** Metade dos sites à mão não tinha nenhum, e duas
  linhas de texto centralizadas leem como *erro de carregamento*, não como
  "ainda não há nada aqui".
- 🔴 **`action` existe porque estado vazio sem saída é o defeito, não o
  estilo.** Este projeto já pagou duas vezes: a tile "Meus Pedidos" desabilitada
  e o "peça pro líder te convidar" do `MyBandsScreen` — os dois com o endpoint
  pronto do outro lado.
- **`accessible` agrupa** ícone, título e subtítulo numa leitura só; sem isso o
  leitor de tela anuncia três nós soltos e o título chega sem a explicação.
- ⚠️ **Há um SEGUNDO padrão, e ele não deve virar `EmptyState`:** o vazio
  *inline dentro de um card* (`TipHistoryList`, `EscrowHistoryList`,
  `TopSongsList`, `BandAgendaSummary`, `ReportSongList`) — ícone de 28px e uma
  linha. O `EmptyState` é `flex: 1` e estouraria o cartão.

**`Skeleton` + `SkeletonList` (`shared/components/Skeleton.tsx`).** Eram **38
telas** com `ActivityIndicator` de tela cheia: o spinner substituía o conteúdo
inteiro, sem estrutura, e a chegada dos dados dava salto de layout. O
`soundmeet-web` já não fazia isso (20 `loading.tsx` + `skeleton.tsx`) — a
assimetria pesava no lado onde a rede é pior. **9 telas migradas, 29 restantes.**

- 🔴 **`itemHeight` tem de bater com o card real da tela.** Um esqueleto de
  altura genérica devolve o salto que ele existe para eliminar — e é pior que o
  spinner, porque promete uma forma e entrega outra. Por isso cada call site
  passa a altura do seu card (`ContractCard` 112, `InquiryCard` 116, conversa
  84, ranking 64…), e o esqueleto mora **dentro do mesmo `listContent`** da
  lista real.
- 🔴 **Reduce motion desliga o pulso, não o encurta.** Com a preferência ligada
  o bloco fica estático na opacidade média — mesma decisão do
  `TipCelebrationOverlay`. Uma versão atenuada continuaria pulsando na
  periferia da visão.
- **Pulso de opacidade, não varredura de gradiente:** shimmer exigiria um
  `expo-linear-gradient` animado por bloco, e numa lista são 6 gradientes ao
  mesmo tempo. `opacity` roda na thread de UI e comunica a mesma coisa.
- **Larguras decrescentes por linha (65% / 90% / 40%)** — bloco cheio em todas
  as linhas lê como caixa vazia, não como texto por vir.
- ⚠️ Telas compostas (Carteira) pedem esqueleto **bespoke** que reproduz a
  pilha real, não `SkeletonList`. Ver `WalletScreen`.

~~**🔴 Dívida que fica, e é a maior das três:** o light mode está morto nos dois
projetos.~~ — **RESOLVIDO nos dois; parágrafo corrigido em 08/set/2026.**

Este trecho descrevia o estado *anterior* à migração e ficou contradizendo a
seção "Tema claro" acima, no mesmo arquivo. Verificado contra o código real:

- **Mobile:** `ThemeProvider` com três estados e `ThemeMenuRow` no Perfil do
  músico **e** do fã; 234 de 268 arquivos migrados para `makeStyles`. Não são
  mais "zero consumidores" — ver a seção "Tema claro" acima para os 34 que
  faltam e por que o codemod os recusa.
- **Web:** `layout.tsx` **não** fixa mais o tema. O `data-theme="dark"` que
  continua no `<html>` é só o default do SSR; quem decide é o `ThemeScript`
  síncrono (escolha salva > `prefers-color-scheme` > dark), e o `ThemeToggle`
  mora no `DashboardTopbar`.
- ⚠️ O aviso *"contraste WCAG AA nunca foi medido"* também caducou: foi medido
  em 05/set nos dois, reprovou, e as duas paletas claras foram corrigidas.
  `theme-contrast` existe dos dois lados, com paridade cruzada desde 08/set.

⚠️ **A lição, essa fica:** um parágrafo de estado envelhece em silêncio e passa a
contradizer o próprio arquivo. Ao fechar uma dívida, corrija o lugar que a
declarava — não só o lugar que a implementa.

---

### ✅ Carteira, assinatura e banda — 05/set/2026

Quatro fatias que tinham backend pronto e nenhum caminho no app. O que liga as quatro:
**um endpoint entregue sem cliente não produz erro** — nada falha, nada aparece no log, e a
capacidade simplesmente não existe para quem usa o produto.

🔴 **Saque PIX (`WithdrawSheet`) — o pior dos quatro.** O backend fechou o `WithdrawToPixUseCase`
em 26/ago (SM-023) com lock `FOR UPDATE`, idempotência, estorno e e2e contra Postgres real. O app
não tinha botão. Pior: a `WithdrawProgressBar` anunciava **"Você já pode sacar!"** e a tela acabava
ali — o cachê liberado da custódia entrava em `balance` e ficava preso.

- 🔴 **A `Idempotency-Key` é a única barreira contra o duplo clique, e só o cliente pode dar.** O
  lock serializa concorrentes e o saldo barra o segundo quando não há fundo para os dois — mas com
  saldo sobrando os dois saques são legítimos vistos um de cada vez, e sairiam os dois.
- 🔴 **O ciclo de vida da chave é o oposto do intuitivo nos dois sentidos.** O backend **replica**
  qualquer transação que já exista com a chave, inclusive uma que falhou. Sem resposta do servidor
  (timeout, rede) → reenviar com a **mesma** chave, porque a transferência pode ter saído com a
  resposta perdida. Resposta conclusiva (422/409/403) → **chave nova**, senão o servidor replica a
  recusa para sempre. `shouldReuseIdempotencyKey` decide, com teste dos dois lados.
- 🔴 **A chave tem que ser IMPREVISÍVEL, não só única** — `findByIdempotencyKey` no backend é lookup
  global, sem escopo de músico (achado registrado em `Docs/roadmap-mobile.md` 11.18).
- 🔴 **`useRef`, nunca `useState`, para guardá-la.** `setState` é assíncrono e em lote: dois toques
  rápidos leriam o valor antigo e um geraria chave nova. Mesmo motivo do guard do `QRScannerScreen`.
- 🔴 **Bug pré-existente:** `getWithdrawEligibility` só olhava valor, então quem tinha saldo e
  nenhuma chave PIX lia "já pode sacar" e levava 422. `getWithdrawAvailability` checa a chave
  **antes** do valor.

**Assinatura (`CheckoutSheet` + `ActiveSubscriptionCard`).** O CTA avisava "em fase final de
integração" desde antes de o `plans-module` ter controller — e ele tem 7 rotas desde jun/2026.

- ⚠️ **`GET /plans` passa pelo envelope** apesar de `@Public()`: sem `meta` no presenter, o
  `WrapperDataInterceptor` embrulha. É `data.data`.
- ⚠️ **`DELETE .../subscription` responde 200 com corpo**, não 204.
- 🔴 **`checkout_url` é nullable** — sem URL, "assinatura registrada, aguardando confirmação", nunca
  navegar para `null`.
- 🔴 **O CPF não vem do perfil, e é decisão do backend:** `MusicianPresenter` expõe `cnpj` (MEI) mas
  nunca o CPF, nem para o dono. A validação do app é **mais rígida que a da API** (`@Matches`
  frouxo, sem checksum): documento errado passaria, criaria a assinatura no Asaas e falharia lá,
  com o músico já fora do app.
- **Preço passou a ser hidratado por `GET /plans`** (`hydratePlanPricing`). `plans.config.ts` segue
  como fallback e fonte de copy; o que ele deixou de decidir é dinheiro.

**Banda (`CreateBandSheet` + `BandDangerZone`).** O estado vazio de `MyBandsScreen` era um beco sem
saída — "peça pro líder te convidar" — com `POST /bands` existindo desde sempre.

- ⚠️ **Só campos do `CreateBandDto` podem viajar.** Com `forbidNonWhitelisted` (INP-1), campo extra
  virou **422**: payload por desestruturação explícita, nunca spread de estado de formulário.
- **`genres` é obrigatório no app e não no backend** — o filtro de descoberta é `hasSome` sobre esse
  array, e banda sem gênero nasce invisível para quem contrata.
- 🔴 **Dissolver exige digitar o nome**; **transferir liderança só oferece membro `accepted`** (o
  backend recusa `pending` com 422).

**`MyRequestsScreen`.** `request.rules.ts` é **espelho intencional** de
`features/musician/domain/request-boost.rules.ts`, não import — FSD proíbe o cruzamento, e as duas
telas dizem coisas diferentes sobre o mesmo dado. 🔴 `awaiting_payment` vira **ação** ("Conclua o
PIX"), não selo.

**Aviso de gateway mock na `TipMusicianScreen`** virou condicional a `ENV.IS_DEV`. Era texto fixo:
num build de produção, um QR PIX legítimo aparecia com selo de "ambiente de testes" — quem lê isso
não paga, e não há erro para alguém descobrir.

---

### ✅ Apresentação ao vivo — concluído em 22/ago/2026

Arquitetura do subsistema em `../soundmeet-backend/Docs/performance/live-performance.md`.

**Nasceu de uma validação:** o "Salvar no Spotify" existia num lugar só — a tela de sucesso de
`SongRequestScreen`, com título e artista **digitados pelo próprio fã**. Era "salve o que você
pediu", nunca "salve o que você está ouvindo", porque o `PlayModeScreen` avançava de música com
`navigation.setParams` e o backend nunca ficava sabendo.

Onde o código foi parar (a slice `performance` **não existe** — ver a regra FSD abaixo):

- `shared/services/performance/` — `performance.api.ts` + `performance.types.ts`. Mesmo precedente
  de `shared/services/gamification/`: é consumido por `musician` **e** por `audience`, e a regra de
  ouro proíbe `features/X` importar de `features/Y`.
- `features/musician/application/` — `liveSet.store.ts` (o interruptor), `usePerformance.ts`,
  `useBroadcastCurrentSong.ts`.
- `features/audience/application/useLivePerformance.ts` — polling de 20s do "tocando agora".

🔴 **O set aberto é o interruptor, e isso é a feature.** `useBroadcastCurrentSong` não faz nada sem
`liveSet.store.activeSet`. Transmitir automaticamente cada música aberta no Play Mode publicaria a
rotina de estudo de alguém e envenenaria currículo, relatório e setlist com a mesma música repetida
14 vezes numa tarde de quarta. E **só o dono do repertório transmite**: convidado nominal estudando
cifra alheia não está no palco de ninguém.

Outras decisões registradas:

- **`expo-secure-store`, não `AsyncStorage`,** para o set ativo: `@react-native-async-storage` não
  está instalado e é dependência **nativa** — custaria rebuild do EAS por um JSON de 5 campos.
- **`key={song.id}` no `SaveToSpotifyAction`** dentro do `NowPlayingCard`. Sem isso o estado interno
  de "salva" sobreviveria à troca de música e o fã veria "Salva na sua biblioteca" para uma faixa
  que nunca salvou.
- **`lastSentRef` guarda a música ENVIADA, não a confirmada** — entre o disparo e a resposta,
  `current_song` ainda aponta para a anterior, e sem o ref o efeito redispara a cada render.
- **Falha em silêncio no palco:** erro ao registrar a música não vira banner. O músico está tocando;
  interromper a tela de palco por um registro secundário é o pior resultado possível.
- **`PerformanceReport`/`PerformanceHistory`/`MyResume`/`SetlistSuggestions` em
  `RootStackParamList`**, mesmo racional de `ContractList`: o tab bar está fixo em 5 rotas.

### ✅ Foto do artista no disco de vinil — 18/set/2026

Pedido do usuário depois de ver o editor de foto do painel web: a foto é o SELO de um disco, e o selo
gira enquanto sobe. Mesmo objeto nas duas pontas do produto.

- **`VinylRecord`** (`shared/components`) — sulcos em SVG, selo com a foto e o REFLEXO PARADO por
  cima. 🔴 Quem gira é o selo, nunca o reflexo: luz girando junto lê como "imagem rodando", não
  "disco tocando" (mesma regra do `.sm-vinyl` do web). Ao parar, o selo **termina a volta para a
  frente** antes de zerar — voltar direto a 0° giraria ao contrário. Sob "reduzir movimento" não gira;
  o eixo aparece e diz "enviando". Escuro nos dois temas (vinil é preto).
- **`vinyl-geometry.ts`** (testado) — não existe `conic-gradient` em RN, então o reflexo é feito de
  fatias com opacidade em rampa, nos mesmos ângulos do CSS do web (0° = topo, sentido horário).
- **`AvatarPicker`** passou a ser o disco, com a mesma API. Duas props novas:
  - `busy` — o selo gira (cadastro: durante o "Continuar"; edição: durante o envio);
  - `confirmBeforeChange` — a foto escolhida POUSA no disco (`ZoomIn` por `key`) e aparece em
    `AvatarPlacementPreview` (busca das casas, conversa, página do QR code — conferidos no código do
    web) com "Salvar foto" / "Cancelar". 🔴 Antes, na edição de perfil, escolher **subia na hora**.
    Ligado só na edição: no cadastro o "Continuar" da etapa já é a confirmação.
- O enquadramento continua sendo o editor NATIVO (`allowsEditing`, 1:1) — pinça e arraste são o
  gesto que o sistema já ensina, e nenhuma dependência nova entrou.
- Falha no envio agora **volta a foto anterior** no disco (`useEditProfileForm`). Antes a foto nova
  ficava na tela com o banner de erro dizendo o contrário.

### ✅ Proposta de show no chat — aceitar/recusar — 18/set/2026

🔴 **O app não tinha tela de booking nenhuma.** `GET /scheduling/bookings/:id`, `confirm` e `cancel`
não tinham chamador em `src/`, e o painel do estabelecimento afirmava "quem aceita é o artista, pelo
aplicativo" — tanto para "Propor um show" quanto para a proposta nova feita de dentro da conversa.

- **`ProposalCard`** fixado no topo do `ChatScreen` (bilhete: canhoto com o dia, faixa, cachê,
  status). Aceitar e Recusar pedem confirmação (`Alert`): é compromisso com data e multa, e o artista
  responde com uma mão, no palco ou no trânsito.
- **`useConversationOffer`** acha a proposta pelas duas portas: `conversation.booking_id`, ou o
  `booking_id` da inquiry da conversa (lista filtrada por `establishment_id` — não há `GET` de inquiry
  única). Mensagem nova da casa recarrega a proposta: é assim que chega uma proposta nova ou ajustada.
- **`offerStage`** (puro, testado): pendente com prazo vencido já é `expired` (o backend só marca no
  próximo toque); cancelada ANTES de confirmar é "não aceita", DEPOIS é "show cancelado" — decidido
  por `confirmed_at`, não pelo status.
- A decisão vem primeiro; a mensagem "✅ Aceitei a proposta…" / "Não vou poder aceitar…" vai depois,
  best-effort. O socket ignora o eco da própria mensagem, então é o refetch que a põe no fio.
- **`describeOfferError`** traduz o que o `confirm` revalida (agenda bloqueada, show no mesmo
  horário, teto por dia, 403 de líder de banda).
- Push `booking.proposed`/`booking.revised` abre a **lista de conversas** (o push traz o booking, não
  a conversa).

⚠️ **Exige rebuild do app** (JS novo; sem `expo-updates` não há OTA). Nenhuma dependência nativa nova.
Os 3 erros de lint em `useChatSocket`, `InquiryDecisionSheet` e `AvailabilityEditorScreen` são
**pré-existentes** — não foram tocados.

### ✅ Contrato digital (B4) — concluído em 19/ago/2026

Feature `contract` completa em `src/features/contract/` (FSD: domain/application/infrastructure/ui).
Arquitetura do subsistema em `../soundmeet-backend/Docs/contract/contract-digital.md`; detalhes da
fatia e armadilhas em `Docs/roadmap-mobile.md` Bloco 13.

O que segue abaixo eram as decisões de briefing, **todas implementadas** — ficam registradas porque
explicam por que a fatia tem a forma que tem.

- 🔴 **O músico não tem tela de booking no app.** `GET /scheduling/bookings` continua sem chamador
  em `src/`, e o `convert-to-booking` segue fora do F1.2. Por isso **o contrato é a tela do show**:
  `ContractShowSummary` mostra data, dia da semana, horário, duração, endereço e cachê, todos com o
  texto **pronto do backend** — reformatar criaria uma segunda verdade sobre documento congelado.
- **Reúso, zero primitiva nova:** `GlowCard` com `riseDelay={index * 60}`, `Pressable3DCard`,
  `AmbientGlowBackground`, `ErrorBanner`, `PrimaryButton`, `@gorhom/bottom-sheet` com
  **`BottomSheetScrollView`** (o texto é longo) no molde de `InquiryDecisionSheet.tsx`, e — o melhor
  reúso da fatia — **`shared/components/StageTechSpecSection.tsx`** para o Anexo I, o componente que
  o F1.2 promoveu para `shared/` exatamente por isto.
- **Navegação em `RootStackParamList`, não em tab.** `ContractList` e `ContractDetail`, no
  precedente de `ConversationList`/`Agenda`/`InquiryList`. Entradas: tile em `QuickAccessGrid.tsx` e
  linha em `ProfileMenuGroups.tsx`, em `colors.accent.violet` (contrato é extensão da
  agenda/negociação).
  - ⚠️ **Sem `badgeCount`, ao contrário do que este briefing pedia.** A contagem viria de
    `features/contract` e a regra de ouro proíbe `features/musician` importar de outra feature —
    mesmo motivo já registrado no tile de Propostas. O contador existe **dentro** da feature
    (`usePendingContractCount`, no filtro "Aguardando você (n)" da lista).
- **`contract.rules.ts` puro concentra o testável:** `canSign(contract, myRole)` — que evita
  oferecer ação que o backend recusa com 422 — e o mapa status → rótulo/cor. **Não inferir liderança
  de banda no cliente** (ficaria errado quando a liderança mudasse): deixar a ação disponível e
  tratar o 403 com `extractApiMessage`. Mesma decisão registrada no F1.2.
- **Aceite explícito**, nunca implícito por navegação — é o que sustenta a validade da assinatura
  (MP 2.200-2). Botão desabilitado até marcar e até rolar o documento até o fim.
  - 🔴 **`onScroll` não dispara em conteúdo que CABE na tela.** Contrato curto travava a assinatura
    para sempre. A trava mede viewport (`onLayout`) **e** conteúdo (`onContentSizeChange`) e
    reavalia nos dois — os callbacks não têm ordem garantida entre si.
- **"Baixar o PDF" é mandar para o próprio e-mail** (`POST /contracts/:id/document/send`).
  `expo-file-system` não está instalado, e a caixa de entrada é destino melhor que o sistema de
  arquivos para um documento com CPF, CNPJ e cachê.
- 🔴 **Gap aberto:** quando a emissão falha por falta de CPF/CNPJ do artista, **não existe contrato**
  — logo não há o que listar, e o músico nunca fica sabendo. Só o painel do estabelecimento vê as
  chaves de `missing`, e metade delas só o artista resolve. Precisa de push ou aviso no perfil; é
  fatia própria.

**Já entregue nesta frente (ago/2026):** campo de **CNPJ do MEI** na seção Identidade de
`EditProfileScreen` (`shared/utils/cnpj.ts` com máscara e dígito verificador, no molde de `cpf.ts`).
Quem preenche passa a ser qualificado como pessoa jurídica no contrato, o que muda a cláusula de
tributos. O campo é **opcional e fica em configurações** — o cadastro continua sendo de pessoa
física, e `cnpj` não existe no payload de criação de propósito.

### ⚠️ Auditoria cruzada mobile × web × backend — 08/set/2026

Varredura dos dois clientes contra as **247 rotas reais** do backend. O resultado
principal contraria o medo: **a integração está alinhada** — todo caminho chamado
em `src/` existe no backend. Detalhe completo em `../soundmeet-web/CLAUDE.md`,
seção de mesma data.

Gates: `tsc` limpo · lint limpo · **29 suítes / 321 testes** (eram 28/319).

#### ✅ Cobertura de acessibilidade dos `<Pressable>` — 235/240 → 240/240

A cobertura já era ótima, e é exatamente por isso que o buraco durou: **5
`<Pressable>` sem nenhuma prop `accessibility*`** não quebram `tsc`, não quebram
lint, não quebram a tela. Só somem para quem usa leitor de tela.

🔴 **Os 5 estavam na MESMA feature** (cifra pessoal / comunidade — `Ver planos`,
`Revisar conflitos`, três `Tentar novamente`). É o padrão que importa: a lacuna
não chega espalhada, chega em bloco, quando uma fatia inteira é escrita sem o
hábito. Corrigidos com o mesmo par `accessibilityRole="button"` +
`accessibilityLabel` que o resto do app já usava.

Regressão em `shared/__tests__/pressable-a11y-coverage.test.ts`, no precedente do
`route-auth-coverage.spec.ts` do backend — varre o repositório em vez de confiar
em revisão:

- **Lê a tag de abertura contando `{}`.** Um `>` dentro de
  `onPress={() => …}` não fecha a tag; sem contar chaves, a varredura corta a
  prop no meio e um `accessibilityLabel` escrito depois passaria por ausente.
- 🔴 **Inclui arquivo não rastreado pelo git** (`ls-files --others`) — arquivo
  novo é justamente onde a lacuna nasce.
- ⚠️ **Filtra por `existsSync`**: `git ls-files` lista o que o índice conhece,
  incluindo arquivo **apagado** na cópia de trabalho e ainda não commitado. Foi o
  que aconteceu com o `EmptyState.tsx` promovido para `shared/` — sem o filtro a
  varredura morre em ENOENT. O próprio teste achou isso na primeira execução.
- **Duas guardas contra o falso verde:** o teste falha se achar menos de 100
  arquivos ou menos de 200 `Pressable`. Uma varredura que para de achar coisa
  passa em verde tendo verificado nada — é o pior modo de falha deste tipo de
  teste.
- ⚠️ **Checa presença, não qualidade.** `accessibilityLabel="botão"` passa aqui e
  continua inútil no aparelho. Ele mecaniza a regra barata; o rótulo dizer o que
  a ação faz segue sendo revisão humana.

#### 🔴 O violeta claro do web tinha divergido DESTE `tokens.ts`

`accent.violet` do tema claro daqui (`#6D28D9`) estava certo; o web ficara em
`#7c3aed`, o valor do tema **escuro**. Os dois passam AA — por isso nenhum dos
dois `theme-contrast` reclamou —, mas o mesmo acento de marca renderizava com
peso diferente em cada cliente.

O aviso *"mexeu numa, mexa na outra"* no topo de
`design-system/__tests__/theme-contrast.test.ts` **não era verificado por
ninguém**. Agora é: o `theme-contrast.spec.ts` do web lê este arquivo e compara
os 22 tokens hexadecimais. ⚠️ **A checagem mora só no lado do web** (é lá que ela
consegue ler os dois) e **pula quando o irmão não está no disco** — em CI de
repositório separado ela não roda. Mexeu em `lightColors` aqui, rode a suíte do
web também.

#### ⚠️ Compartilhamento não pontua gamificação, e não deve ser ligado como está

`imageShare.ts` serve três superfícies (QR, recap pós-show, recibo de gorjeta) e
**nenhuma reporta a `POST /audiences/:id/social-shares`**, que existe e pontua.

🔴 **Não wire.** `platform` é enum obrigatório que o share sheet do SO não
informa — o próprio `imageShare.ts` já documenta que nem "compartilhou de fato"
é possível saber —, e o agregado pontua **sem dedup**. Ligar hoje seria fabricar
`platform` e abrir farm de pontos por toque repetido. É decisão de produto +
correção no backend, não fiação.

---

### ✅ Catálogo no pedido de música e check-in do show — 09/set/2026

Duas rotas **entregues no backend e sem cliente nenhum**, achadas cruzando as
235 rotas reais contra os dois clientes. É o mesmo padrão que este documento já
nomeia — *"um endpoint entregue sem cliente não produz erro"* — só que desta vez
uma das duas prendia dinheiro.

**1. `RepertoirePicker` no `SongRequestScreen` (fecha a ressalva do 11.8).**
`GET /musicians/:id/repertoire` (`@Public()`, backend 9.6c) existe desde
**07/ago/2026** com busca por `title`/`artist`/`genre`, e ficou um mês sem
consumidor — nem aqui, nem no `soundmeet-web`. O fã digitava a música de memória
sem saber se o artista a toca.

- 🔴 **O texto livre CONTINUA, e isso é a decisão.** `MusicLibrary` é biblioteca
  pessoal e a maioria dos itens hoje tem só título/artista. Pedir uma música que
  o artista sabe tocar mas ainda não cadastrou é caso legítimo — travar o pedido
  no que está catalogado transformaria uma ajuda em barreira. O picker
  **preenche** os campos, não os tranca.
- 🔴 **`stillMatchesPick` (`domain/song-request.rules.ts`) desfaz a escolha
  quando o fã edita o texto.** Sem isso, escolher "Garota de Ipanema" e editar
  para "… (ao vivo)" continuaria mandando o `genre` da linha original — fato
  afirmado sobre uma música que já não é aquela. Não quebra nada e não aparece
  em log. A comparação é **exata** de propósito: qualquer `trim`/`toLowerCase`
  volta a aceitar como "a mesma música" um texto que o fã mudou justamente
  porque não era.
- **A busca do catálogo é debounced (400ms) e a rota tem `@Throttle(30/min)`
  PRÓPRIO** — catálogo é raspável. Digitar um título sem debounce gastaria
  metade da cota do minuto.
- **`keyboardShouldPersistTaps="handled"` no `ScrollView`**: sem isso o primeiro
  toque num resultado só fecha o teclado, e o fã escolhe a música em dois toques.
- Espelho no `soundmeet-web` (`SongCatalogPicker`), com uma diferença
  deliberada: lá a busca é **client-side sobre a página que a RSC já buscou**
  (`filterCatalog`, sem acento), porque a página é servidor e uma requisição por
  tecla queimaria o mesmo throttle.

**2. `ContractCheckInCard` — o check-in que destranca o cachê.**
🔴 `POST /scheduling/bookings/:id/check-in` **não tinha cliente em lugar
nenhum**, e `ReleaseBookingEscrowUseCase` recusa liberar com
`!booking.isCheckedIn`. Com a custódia ligada, o cachê do artista ficaria retido
**para sempre e em silêncio**: o job horário roda, não encontra nada liberável e
não registra erro.

- ⚠️ **Mora na tela do contrato porque o contrato é a tela do show neste app** —
  o músico não tem tela de booking (decisão já registrada acima). Os tipos ficam
  em `features/contract/domain/check-in.types.ts`; se `scheduling` precisar do
  mesmo dado, o caminho é promover para `shared/services/`, como `performance` e
  `gamification` — nunca `features/scheduling` importar de `features/contract`.
- 🔴 **O aviso de atraso importa mais que o botão.** Show terminado sem registro
  destaca "o cachê continua retido" — sem essa linha, a carteira mostra saldo
  retido e nada no app diz o que falta fazer.
- 🔴 **`dispute_reason` NÃO é exibido ao artista.** É o texto que o contratante
  escreveu para a mediação ler; mostrá-lo cru, sem canal de resposta,
  transformaria a tela do contrato num lugar de conflito sem saída. O que aparece
  é o fato (contestação aberta) e a consequência (liberação congelada).
- **Sem corpo na chamada, e isso é a garantia**: a hora é a do servidor. Aceitar
  `checked_in_at` do cliente permitiria registrar um show de ontem como se fosse
  de hoje — e o registro existe para provar *quando*.
- **`setQueryData` com a resposta, não `invalidateQueries`**: o backend devolve o
  booking já registrado, e refetch só para reler o que acabou de chegar faria o
  cartão piscar entre "registrar" e "registrado".
- O lado do estabelecimento (registrar **e** contestar) entrou no
  `soundmeet-web`, em `BookingPerformanceRecord`.

**Gates:** `tsc` limpo · lint limpo nos arquivos novos · **32 suítes / 352
testes** (medidos; eram 30/321 antes desta fatia — a auditoria de 08/set anotou
29/321, e a suíte tinha crescido desde então).

⚠️ O lint do repositório continua com **2 erros pré-existentes** de
`react-hooks/set-state-in-effect` (`FanProfileScreen`, `ReviewEstablishmentSheet`)
e 1 warning — não são desta fatia e não foram tocados.

---

### ✅ Áudio de apresentação do músico — 16/set/2026

Seção nova no acordeão do `EditProfileScreen`: o músico escolhe um **arquivo**
de 5 a 40s e o estabelecimento ouve no `soundmeet-web` antes de contratar.
`POST`/`DELETE /musicians/:id/presentation-audio`.

- 🔴 **`expo-document-picker` é módulo NATIVO novo ⇒ exige rebuild.** Não sai por
  OTA. O `expo-image-picker` que já existia não seleciona áudio.
- **É arquivo, não gravação** — e `expo-audio` já estava instalado para gravar.
  O áudio que representa o artista costuma já existir (trecho de show, demo
  mixada); forçar uma gravação de celular trocaria o melhor material dele pelo
  pior.
- 🔴 **A duração é medida no aparelho ANTES de subir**, por `createAudioPlayer`
  (sondagem de ~2s). Sem isso o músico esperaria vários MB por rede móvel para
  receber um 422 previsível. ⚠️ **Duração ausente NÃO reprova**: nem todo arquivo
  deixa medir, e transformar limitação do aparelho em impedimento de produto
  seria pior. O servidor mede de novo e decide.
- ⚠️ **A checagem local é por EXTENSÃO, nunca por `mimeType`.** O seletor do
  Android devolve `application/octet-stream` para MP3 legítimo com frequência —
  filtrar pela afirmação do sistema recusaria arquivo bom. Quem lê os bytes é o
  backend (`assertFileSignature`).
- **As mensagens de erro do servidor são exibidas cruas** (`extractApiMessage`):
  elas já vêm em PT-BR e com o número que o músico precisa ("o áudio tem 1min12 e
  o limite é 40 segundos"). Traduzir aqui trocaria o diagnóstico exato por um
  genérico.
- 🔴 **O estado do player é a URL que está tocando, não um booleano.** Com
  booleano, trocar o áudio exigiria `setState` dentro do efeito que recria o
  player — o que o `react-hooks/set-state-in-effect` reprova (mesma regra que
  ditou o `useSyncExternalStore` do relógio no web). Com a URL, o "parou" cai de
  graça na comparação.
- Limites espelhados do backend em `domain/presentation-audio.rules.ts`, com
  teste que falha se divergirem: divergir produz arquivo aceito na tela e
  recusado no envio (ou o contrário).

---

### ✅ Google Agenda — 24/set/2026

Card na `AgendaScreen` (`features/scheduling/`): conectar, ver a conta conectada e desconectar.
O backend existia desde jul/2026 (item 7.18) com OAuth, tokens cifrados e sync por fila — e
**nenhum chamador em cliente nenhum**. Detalhe e armadilhas em `../CLAUDE.md`
(seção "Google Agenda") e em `../soundmeet-backend/Docs/business-rules.md`.

- Arquivos: `domain/google-calendar.{types,rules}.ts`, `infrastructure/google-calendar.api.ts`,
  `application/useGoogleCalendar.ts`, `ui/components/GoogleCalendarCard.tsx`.
- O consentimento abre em Chrome Custom Tab (`openAuthSessionAsync`) e volta por
  `soundmeet://agenda/google?status=sucesso|cancelado|erro` — **o backend precisa redirecionar para
  esse deep link**, senão a aba não fecha sozinha (foi exatamente o que mudou no callback).
- ⚠️ **`parseGoogleCalendarReturn` faz parse manual por regex, nunca `new URL()`** — mesma razão de
  `qr-link.ts`/`external-url.ts`: o `URL` do RN diverge da WHATWG e o Jest roda em Node, onde o
  `URL` é o de verdade; um parser escrito sobre ele passaria em todo teste e erraria no aparelho.
- ⚠️ **Query com `enabled: false` fica `isPending` para sempre** no TanStack Query v5. Sem o
  early-return de `musicianId` nulo, o card exibiria spinner eterno — vale para qualquer card novo
  que busque o próprio dado.
- **Não precisa de rebuild nativo:** nenhum módulo nativo novo (`expo-web-browser` já estava
  instalado) e o deep link é só o `returnUrl` do `openAuthSessionAsync`, não um `intentFilter`.

---

## Comportamento esperado do agente

- **Verificar `Docs/design-system.md`** antes de definir qualquer cor, token ou tipografia.
- **Verificar `Docs/roadmap-frontend.md`** antes de iniciar nova tarefa (próxima = primeiro `[ ]`).
- **Verificar Expo docs v56** antes de usar qualquer API Expo.
- **Verificar `package.json`** antes de usar qualquer lib — não assumir que está instalada.
- Diff mínimo — não refatorar código não solicitado.
- Incerteza explícita — se não tiver certeza da API (especialmente Reanimated 4), verifique antes de afirmar.
