@AGENTS.md

# SoundMeet Mobile — Claude Code Instructions

**Conceito:** App mobile da plataforma SoundMeet — conecta músicos, público e estabelecimentos via QR code, pedidos musicais, gorjetas PIX e gamificação.

**Projeto:** `soundmeet-mobile/` (React Native + Expo SDK 56)
**Backend:** `../soundmeet-backend/` (NestJS — 153 endpoints HTTP, 25 módulos, 18 domínios DDD)

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
| Estilo | NativeWind | v4 (Tailwind para RN) |
| Ícones | Lucide React Native | ^1.21 |
| Auth | expo-auth-session | SDK 56 |
| Storage seguro | expo-secure-store | SDK 56 |
| Câmera / QR | expo-camera | SDK 56 |
| Notificações push | expo-notifications | SDK 56 |
| Keep awake | expo-keep-awake | SDK 56 |
| Áudio / microfone | expo-av | ^16 |
| SVG | react-native-svg | ^15 |

### Libs NÃO instaladas — verificar package.json antes de usar
- `@shopify/react-native-skia` — não instalado ainda
- `@react-three/fiber` — não instalado ainda
- Gluestack UI — não instalado ainda

### Libs incompatíveis com React Native — NUNCA use
- GSAP, Framer Motion, Barba.js, Anime.js → DOM-only, não funcionam em RN
- **Moti** → NÃO usar; v0.30 (latest) só suporta Reanimated 3; incompatível com Reanimated 4 + New Architecture (Expo SDK 56). Sem versão compatível disponível (v1.0 não lançada).
- Use **Reanimated 4 diretamente**: `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withRepeat`, `withDelay`, `withSpring`, `interpolateColor`

### Navegação — decisão crítica
- **NUNCA usar `@react-navigation/stack`** — usa `InteractionManager` internamente, depreciado no RN 0.85+
- **Sempre usar `@react-navigation/native-stack`** — animações nativas via `react-native-screens`, sem `InteractionManager`, mais performático

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

> **ATENÇÃO — NativeWind desabilitado (Expo SDK 56 + New Architecture):**
> `react-native-css-interop` v0.2.x substitui o JSX runtime via `createInteropElement()` que
> é incompatível com o Fabric + Hermes JSI do Expo SDK 56, causando `Cannot read property
> 'useContext' of null` em qualquer hook filho. O `nativewind/babel` preset foi **removido**
> do `babel.config.js`. Enquanto isso: **use somente `StyleSheet.create`**. Re-habilitar
> quando NativeWind v5 (reescrita New Architecture) for compatível com esta stack.

| Situação | Abordagem correta |
|----------|------------------|
| Qualquer layout ou estilo | **`StyleSheet.create`** + tokens de `tokens.ts` |
| Valores animados de Moti/Reanimated | **`style` prop** — sempre |
| Valores computados em JS (ex: `width: SW * 0.6`) | **`style` prop inline** |
| Sombras multi-campo | **`StyleSheet`** ou spread do token `shadows.*` |

**Nunca usar número mágico de cor, fonte ou espaçamento.** Toda cor vem de `tokens.ts`; toda tipografia vem de `typography.*`; todo espaçamento vem de `spacing.*`. Nada hardcoded.

Exemplo correto:
```tsx
// StyleSheet para tudo (NativeWind babel desabilitado)
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

> **ATENÇÃO — NativeWind + hooks:** `useWindowDimensions()` dentro de componentes filho
> causa `Cannot read property 'useContext' of null` porque o NativeWind v4 intercepta
> o render via `api.js` em um contexto onde o dispatcher do React não está disponível.
> **Use sempre `Dimensions.get('window')` no nível do módulo** para subcomponentes.
> O app é `orientation: portrait` (app.json) — a largura nunca muda.

```tsx
// Correto para subcomponentes com NativeWind
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

### Dimensões e responsividade

- **`Dimensions.get('window')`** no nível do módulo — app é `portrait` travado (app.json), largura constante
- **Nunca `useWindowDimensions()`** enquanto NativeWind babel estiver ativo — cria conflito de hooks
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
8. Afinador cromático (`expo-av`)
9. Chat com estabelecimentos (WebSocket)

> **Próxima tarefa = primeiro `[ ]` em `Docs/roadmap-mobile.md`**

### Fase 2 — MVP Público
Scanner QR → Perfil músico → Pedido + votação → Gorjeta PIX → Gamificação

### Fase 3 — Dashboard Web (`soundmeet-web/` — futuro Next.js)

---

## Autenticação

**Keycloak + OAuth 2.0 Authorization Code Flow (PKCE)**

- Lib: `expo-auth-session`
- Storage: `expo-secure-store`
- Redirect URI: `soundmeet://auth/callback`
- Token refresh automático via interceptor Axios
- Claims do Keycloak: `musician_id`, `establishment_id`, `audience_id`, `roles`

---

## HTTP Client (Axios)

Interceptors obrigatórios:
1. Attach JWT (`Authorization: Bearer <token>`)
2. Refresh automático de token expirado
3. Error handling global (401 → logout, 422 → exibir erros de validação)

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

## Estado atual (jun/2026)

### Estrutura FSD criada
- `src/features/` com musician, audience, payment, gamification, scheduling — esqueleto FSD presente
- `src/shared/` com components, hooks, services (http, websocket, storage), design-system, utils
- `src/navigation/` e `src/app/` presentes

### O que ainda não existe
- Implementação real dos screens e components (apenas estrutura de pastas)
- Integração com o backend
- Design system implementado em código (tokens não codificados ainda)
- Auth flow com Keycloak
- Skia, Gluestack UI — não instalados

---

## Comportamento esperado do agente

- **Verificar `Docs/design-system.md`** antes de definir qualquer cor, token ou tipografia.
- **Verificar `Docs/roadmap-frontend.md`** antes de iniciar nova tarefa (próxima = primeiro `[ ]`).
- **Verificar Expo docs v56** antes de usar qualquer API Expo.
- **Verificar `package.json`** antes de usar qualquer lib — não assumir que está instalada.
- Diff mínimo — não refatorar código não solicitado.
- Incerteza explícita — se não tiver certeza da API (especialmente Reanimated 4), verifique antes de afirmar.
