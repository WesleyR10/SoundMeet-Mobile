# SoundMeet — Plano de Desenvolvimento Frontend

> Documento gerado a partir do debate técnico de 27/06/2026.
> Atualizar conforme decisões evoluírem. Este é o documento canônico de referência para o frontend.

---

## 1. Visão Geral

**Produto:** SoundMeet — plataforma que conecta músicos, público e estabelecimentos em eventos ao vivo via QR code, pedidos musicais, gorjetas PIX e gamificação.

**Slogan:** "Onde o som encontra pessoas"

**Nome de marca:** SoundMeet (inglês, permanece — fácil repercussão, estilo Spotify/Tinder/iFood)

**Público-alvo inicial:** Brasil — primeiras aquisições em Belo Horizonte/MG

**Backend:** NestJS + TypeScript em `soundmeet-backend/` (153 endpoints HTTP, 25 módulos, 18 domínios DDD)

---

## 2. Decisão de Plataforma

### Mobile-First — Obrigatório

O produto depende estruturalmente do mobile:

- Scanner de QR code → câmera nativa
- Gorjeta PIX → integração com app bancário / deep links
- Notificações push → "sua música foi aceita", "nova gorjeta"
- Contexto de uso → usuário no bar, ao vivo, no escuro, celular na mão
- Afinador cromático → microfone em tempo real no palco

### Roadmap de Plataformas

| Fase | Plataforma | Projeto | Quando |
|------|-----------|---------|--------|
| 1 | iOS + Android (app músico) | `soundmeet-mobile` | Agora |
| 2 | iOS + Android (público + gamificação) | `soundmeet-mobile` | MVP |
| 3 | Web (dashboard músico/estabelecimento) | `soundmeet-web` | Pós-MVP |

> **Nota:** O dashboard web (analytics detalhados, gestão de agenda, planos) virá depois. Gestão de dados complexa em mobile é ruim UX. A stack escolhida suporta isso desde o início.

---

## 3. Stack Tecnológica

### Framework Mobile

**React Native + Expo SDK 52+** (EAS Build desde o início)

| Critério | Decisão |
|---------|---------|
| Linguagem | TypeScript (mesmo ecossistema do backend) |
| Toolchain | Expo SDK 52+ com EAS Build |
| Build pipeline | EAS Build (não Expo Go — compatibilidade com módulos nativos) |
| Plataformas alvo | iOS + Android |
| Monorepo | `soundmeet-mobile/` standalone dentro de `/SoundMeet/` |

**Por que não Flutter:** Dart é uma linguagem adicional; TypeScript já é dominado.
**Por que não Kotlin Multiplatform:** Complexidade alta demais para dev solo em MVP.

### Estrutura do Monorepo

```
SoundMeet/
  soundmeet-backend/       # NestJS (já existe)
  soundmeet-mobile/        # Expo React Native (CRIAR AGORA)
  soundmeet-web/           # Next.js (futuro — dashboard)
  soundmeet-frontend-plan.md  # este arquivo
```

> Não usar Turborepo ainda. Adiciona complexidade sem benefício no MVP. Reavaliar quando `soundmeet-web` surgir.

### Gerenciamento de Estado

| Responsabilidade | Biblioteca | Versão |
|-----------------|-----------|--------|
| Server state (cache, fetch, invalidação) | **TanStack Query** | v5 |
| Client state global (usuário logado, tema, QR state) | **Zustand** | v5 |
| Estado local de telas | `useState` / `useReducer` (React nativo) | — |

### Navegação

**React Navigation v7** (Stack + Bottom Tabs + Drawer)

### HTTP Client

**Axios** com interceptors para:
- Attach de JWT token (Keycloak)
- Refresh automático de token
- Error handling global

---

## 4. Autenticação

**Keycloak + OAuth 2.0 Authorization Code Flow (PKCE)**

| Biblioteca | Uso |
|-----------|-----|
| `expo-auth-session` | Flow PKCE com Keycloak |
| `expo-secure-store` | Armazenamento seguro de tokens |
| `expo-keycloak` (alternativa) | Wrapper simplificado |

**Configuração:**
- Standard flow no Keycloak
- Redirect URI: `soundmeet://auth/callback`
- Token refresh automático via interceptor Axios
- Claims do Keycloak: `musician_id`, `establishment_id`, `audience_id`, `roles`

---

## 5. Animações e Efeitos Visuais

> **CRÍTICO:** GSAP, Framer Motion, Barba.js, Anime.js são **incompatíveis com React Native** (DOM-only). As substituições abaixo entregam o mesmo resultado ou superior.

| Você queria | Substituto RN | Notas |
|-------------|--------------|-------|
| GSAP / Anime.js | **Reanimated 3** | Worklets na UI thread, 60-120fps |
| Framer Motion | **Moti** | API idêntica ao Framer Motion, built on Reanimated |
| Three.js + React Three Fiber | **@react-three/fiber** (renderer RN) | Funciona em React Native |
| Efeitos visuais / shaders | **React Native Skia** | Shopify, canvas nativo, extraordinário |
| Lottie / After Effects | **lottie-react-native** | Padrão da indústria |
| Parallax scroll | **Reanimated 3** + `useScrollViewOffset` | Nativo |

**Para o dashboard web (futuro):** GSAP, Framer Motion, Shadcn, Aceternity, 21st.dev — tudo funciona.

---

## 6. Componentes de UI

### Mobile

| Lib | Uso |
|-----|-----|
| **NativeWind v4** | Tailwind CSS para React Native |
| **Gluestack UI** | Componentes acessíveis, customizáveis, NativeWind-ready |
| **React Native Skia** | Elementos visuais customizados, ondas, gradientes |
| **Lucide React Native** | Ícones |

**Filosofia:** Não criar tudo do zero, mas customizar profundamente os componentes de base para não parecer genérico.

---

## 7. Arquitetura do Frontend

**Feature-Sliced Design (FSD) com Clean Architecture por feature**

```
soundmeet-mobile/src/
  features/
    musician/
      domain/              # tipos, entidades, validações locais
      application/         # use-cases como custom hooks
      infrastructure/      # chamadas à API (repositórios)
      ui/                  # screens, components
    audience/
    establishment/
    payment/
    gamification/
    ai-cifra/
    scheduling/
  shared/
    components/            # design system (Button, Card, Avatar...)
    hooks/                 # hooks utilitários compartilhados
    services/              # HTTP client, WebSocket, Storage
    design-system/         # tokens de cor, tipografia, espaçamento
    utils/
  navigation/              # React Navigation (stacks, tabs, drawers)
  app/                     # entry point, providers, bootstrapping
```

**Camadas por feature:**
- `domain/` → tipos puros, interfaces, regras de validação local
- `application/` → custom hooks que orquestram use-cases (TanStack Query + lógica de negócio)
- `infrastructure/` → adapters de API (1 arquivo = 1 recurso do backend)
- `ui/` → screens e components específicos da feature

---

## 8. Ordem de Desenvolvimento

### Fase 1 — MVP Músico (app mobile)

| # | Feature | Endpoints Backend | Prioridade |
|---|---------|-----------------|-----------|
| 1 | Onboarding + Login Keycloak | Auth | 🔴 Crítico |
| 2 | Criar / editar perfil do músico | `POST/PATCH /api/v1/musicians` | 🔴 Crítico |
| 3 | QR Code gerado (exibir + customizar) | `GET /api/v1/musicians/:id` | 🔴 Crítico |
| 4 | Gerenciar pedidos ao vivo | `GET/POST/PATCH /api/v1/requests` | 🔴 Crítico |
| 5 | Gorjetas recebidas (histórico) | `GET /api/v1/musicians/:id/wallet` | 🟡 Alto |
| 6 | Analytics pós-evento básico | `GET /api/v1/musicians/:id/analytics` | 🟡 Alto |
| 7 | Repertório (criar, listar, compartilhar) | `/api/v1/repertoires` | 🟡 Alto |
| 8 | Afinador cromático | Nativo (microfone) | 🟢 Médio |
| 9 | Chat com estabelecimentos | `/api/v1/conversations` + WebSocket | 🟢 Médio |

### Fase 2 — MVP Público

| # | Feature | Endpoints Backend |
|---|---------|-----------------|
| 1 | Scanner QR | `POST /api/v1/audiences/:id/scan-qr` |
| 2 | Perfil do músico (readonly) | `GET /api/v1/musicians/:id` |
| 3 | Pedido de música + votação | `POST /api/v1/requests` + vote |
| 4 | Gorjeta PIX | `POST /api/v1/tips` |
| 5 | Gamificação (pontos, badges, ranking) | `/api/v1/gamification` |

### Fase 3 — Dashboard Web (Estabelecimento)

- Busca de músicos
- Chat + agendamento
- Analytics de público
- Gestão de eventos

---

## 9. Identidade Visual

### Direção de Marca

**"Premium Nativo"** — a energia de um show ao vivo capturada em pixels. Não é um app de bar (muito nichado), não é um app branco e estéril (sem personalidade). É sofisticado com pulso. Dark mode como padrão, light mode como alternativa.

**Referências visuais consolidadas (Dribbble do usuário):**
- Health monitoring (ECG) → dark mode, dados visuais, neon sobre escuro
- Fitness (Aktion) → energia, tipografia bold, alto contraste
- Meditation → gradientes suaves, dark sophisticado
- Banking → premium, confiança, hierarquia clara
- Automotive logo → identidade abstrata, simbólica

### Paleta de Cores (Proposta Final)

**Dark Mode (padrão)**

| Token | Hex | Uso |
|-------|-----|-----|
| `--bg-primary` | `#0C0C14` | Background base (azul-preto profundo) |
| `--bg-surface` | `#141428` | Cards, modais, surfaces |
| `--bg-elevated` | `#1E1E3A` | Elementos elevados, hover |
| `--brand-primary` | `#7C3AED` | Cor principal da marca (violeta elétrico) |
| `--brand-light` | `#A855F7` | Estados hover, variante clara |
| `--accent-energy` | `#F97316` | Gorjetas, CTA principal, energia |
| `--accent-success` | `#10B981` | PIX confirmado, sucesso, aceito |
| `--accent-warning` | `#F59E0B` | Pendente, atenção |
| `--accent-error` | `#EF4444` | Rejeitado, erro |
| `--text-primary` | `#F8FAFC` | Texto principal |
| `--text-secondary` | `#94A3B8` | Texto secundário, placeholders |
| `--text-muted` | `#475569` | Texto desabilitado, timestamps |
| `--border` | `#1E293B` | Bordas sutis |
| `--gradient-brand` | `#7C3AED → #A855F7` | Gradiente marca |
| `--gradient-energy` | `#F97316 → #EF4444` | Gradiente gorjeta/energia |

**Light Mode (toggle)**

| Token | Hex | Uso |
|-------|-----|-----|
| `--bg-primary` | `#F8F7FF` | Fundo levemente violeta (não branco puro) |
| `--bg-surface` | `#FFFFFF` | Cards, surfaces |
| `--bg-elevated` | `#EDE9FE` | Elementos elevados |
| `--brand-primary` | `#6D28D9` | Violeta mais saturado no claro |
| `--text-primary` | `#0F0A1E` | Quase preto, leve toque roxo |
| `--text-secondary` | `#64748B` | Cinza médio |

**Por que violeta/roxo para a marca?**
- Spotify usa verde, Apple Music usa vermelho, YouTube Music usa vermelho — todos ocupados
- Roxo/violeta = criatividade, música, premium, exclusividade
- Não é cor de nenhum player dominante no Brasil
- Funciona bem em dark e light mode
- Acento laranja cria contraste vibrante (complementar quente vs. frio)

### Tipografia

| Uso | Fonte | Pesos |
|-----|-------|-------|
| **Display / Títulos** | Space Grotesk | 500, 600, 700 |
| **Body / Interface** | Inter | 400, 500, 600 |
| **Cifras / Chords / Mono** | JetBrains Mono | 400, 500 |

**Escala tipográfica:**
```
display-xl: 48px / Space Grotesk 700  (hero screens)
display-lg: 36px / Space Grotesk 700  (títulos de tela)
display-md: 28px / Space Grotesk 600  (seções)
title:      22px / Space Grotesk 600  (cards, headers)
body-lg:    17px / Inter 400           (textos corridos)
body:       15px / Inter 400           (UI padrão)
body-sm:    13px / Inter 400           (secundário)
caption:    11px / Inter 500           (labels, timestamps)
mono:       14px / JetBrains Mono     (cifras, código)
```

### Logo

**Direção:** Abstrato — as letras S e M formando um símbolo que evoca simultaneamente:
- Uma onda sonora (remetendo a "Sound")
- Dois círculos/arcos se encontrando (remetendo a "Meet")
- Uma nota musical abstrata

**Para geração da logo:** usar prompts na seção 11 deste documento.

**Variações necessárias:**
- Logo full (símbolo + wordmark "SoundMeet")
- Ícone solo (símbolo apenas — para app icon, favicon)
- Versão light (para fundos escuros)
- Versão dark (para fundos claros)

### Estilo Visual Geral

| Atributo | Decisão |
|---------|---------|
| Modo padrão | Dark mode |
| Toggle | Sim — dark/light com persistência |
| Bordas | `border-radius: 16px` (cards), `12px` (inputs), `24px` (botões) |
| Sombras | `box-shadow` com cor da marca (ex: `0 8px 32px rgba(124,58,237,0.15)`) |
| Glassmorphism | Usado com moderação (overlays, modais, player) |
| Gradientes | Brand gradient em headers, CTA, highlights |
| Animações | Presentes e fluidas — Reanimated 3 + Moti. Não decorativas, funcionais |
| Densidade | Média — não minimalista demais, não poluído |

---

## 10. UX do Músico — Considerações Especiais

O músico usa o app em condições adversas:
- **Uma mão livre** (a outra segura instrumento)
- **Luz baixa** (palco, bar)
- **Atenção dividida** (tocando)
- **Tempo limitado** (entre músicas, intervalos)

**Consequências diretas no design:**

1. **Tela principal do músico** = visualização ao vivo dos pedidos. Deve ser legível a 1 metro de distância, fonte grande, contraste máximo.
2. **Ações críticas** (aceitar/rejeitar pedido) = botões grandes, swipe gestures (aceitar = swipe right, rejeitar = swipe left — estilo Tinder)
3. **Bottom tab bar** = ícones com labels, áreas de toque mínimo 48x48px
4. **Notificações** = push para gorjeta recebida, novo pedido — músico não precisa ter o app aberto
5. **Modo performance** = tela que não apaga durante uso (keep awake), brilho preservado
6. **Afinador** = tela dedicada, sem distração, exibição grande do pitch detectado

---

## 11. Prompts para Geração de Design (Google Stitch / IA)

Use estes prompts no Google Stitch ou outra ferramenta de design por IA:

### Prompt — Play Mode / Cifra ao Vivo (tela que o músico vê enquanto toca)

> ⚠️ CORREÇÃO: A tela que o músico usa NO PALCO enquanto toca não é de gerenciamento
> de pedidos — é a cifra + letra sincronizada. O músico não consegue ler cards de
> pedido enquanto está tocando. O celular no palco = teleprompter musical.
> Pedidos são revisados ENTRE músicas via notificação rápida.
> Referência: roadmap-frontend.md item 4D.2 (Play Mode no Repertório).

```
Dark mode mobile full-screen app screen for a musician reading chord sheet + lyrics
while performing live on stage. Background: #0C0C14. Brand teal: #00E0B8.

This screen is a musical teleprompter — full screen, no distractions, maximum
readability at arm's length in a dark bar environment.

Layout (top to bottom):
- Thin top bar: song title (Space Grotesk bold, white) + progress indicator + 
  small badge showing pending requests count (coral pill, tappable)
- Main content area (90% of screen): chord sheet rendered token by token
  - Chords in teal #00E0B8, JetBrains Mono bold, positioned above their lyric word
  - Lyrics in white Inter, large font (18-20px minimum)
  - Current line highlighted (brighter white + subtle teal left border)
  - Past lines in muted grey, future lines in slightly dim white
  - Section labels (Verso, Refrão, Ponte) in teal small caps
- Auto-scroll progress: ultra-thin teal line at screen edge indicating position
- Bottom minimal bar: Previous song ← | ▶ Pausar scroll | → Next song

Visual feel: focused, clean, professional. Like a music stand that glows teal.
The musician cannot be distracted — only the music exists on this screen.
Subtle teal glow on the active line only.
```

### Prompt — Tela de Gorjeta (Público)

```
Dark mode mobile app screen for sending a music tip (gorjeta) to a musician via PIX.
Primary background: #0C0C14. Success color: #10B981 (green). 
Energy gradient: #F97316 to #EF4444.
Font: Space Grotesk for display, Inter for body.

Show a tip sending flow:
- Musician's avatar (circular, with violet glow ring)
- Musician name and current song playing
- Amount selector: R$ 5, R$ 10, R$ 20, custom (pill buttons)
- Optional message field: "Dedica para..." 
- Big CTA button: "Enviar Gorjeta via PIX" (orange gradient, full width)
- Small text: "Processado com segurança"

Cards with rounded corners (16px), subtle glassmorphism.
Warm, generous feeling. The experience of giving, not transacting.
High end premium feel. Dark sophisticated.
```

### Prompt — Tela de Perfil do Músico (Discovery)

```
Dark mode mobile app profile screen for a musician on SoundMeet platform.
Primary background: #0C0C14. Brand: #7C3AED. 
Font: Space Grotesk for name/title, Inter for details.

Hero area: musician photo with gradient overlay, name in large Space Grotesk bold,
instrument icons, genre tags as colored pills.
Stats row: total tips received (R$ amount), events played, fan rating (stars).
Below: "Solicitar Música" CTA (violet, full width), "Gorjeta" secondary button (orange outlined).
Bio section with expandable text.
Recent songs section: horizontal scroll of song cards.
Gamification: small "Top Fã" badge indicator.

Glassmorphism cards over dark background. Subtle animated particle effect in hero.
Style reference: premium music streaming meets nightlife sophistication.
Not generic app. Unique, energetic, dark luxury aesthetic.
```

### Prompt — Logo SoundMeet

```
Minimalist abstract logo for "SoundMeet" app.
The logo should be formed by the letters S and M merging into an abstract symbol.
The symbol should simultaneously suggest: a sound wave, two circles/arcs meeting,
and a musical note. The connection point represents where people meet through music.

Style: geometric, clean, modern tech. Single color works in multiple backgrounds.
Primary color: #7C3AED (electric violet/purple).
Should work as: app icon (512x512), small icon (32px), wordmark alongside text.

Do NOT make it literal (no guitars, no music notes, no headphones).
Pure abstract geometry. Think: Spotify logo level of abstraction but original.
The wordmark "SoundMeet" uses Space Grotesk Bold.
```

---

## 12. Setup Inicial do Projeto

### Pré-requisitos
- Node.js 20+
- EAS CLI: `npm install -g eas-cli` (pacote correto — `@expo/eas-cli` estava desatualizado/errado nesta doc)
- EAS CLI logado: `eas login`
- Conta EAS: já configurada

### Criar o projeto

```bash
cd /home/wesleyr10/Programação/Projetos/SoundMeet
npx create-expo-app soundmeet-mobile --template blank-typescript
cd soundmeet-mobile
```

### Dependências principais

```bash
# Navegação
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context

# Animações
npx expo install react-native-reanimated moti
npx expo install @shopify/react-native-skia

# Estado
npm install @tanstack/react-query zustand

# Auth
npx expo install expo-auth-session expo-secure-store expo-web-browser

# HTTP
npm install axios

# UI
npm install nativewind
npm install --save-dev tailwindcss

# Lottie
npx expo install lottie-react-native

# Câmera (QR Scanner)
npx expo install expo-camera expo-barcode-scanner

# Notificações Push
npx expo install expo-notifications

# Keep Awake (modo performance do músico)
npx expo install expo-keep-awake

# Microfone (afinador)
npx expo install expo-av

# 3D (quando necessário)
npm install @react-three/fiber @react-three/drei three
```

### Dependências adicionadas por bloco (pós-setup inicial)

Lista acima = bootstrap original do projeto (27/06/2026). Dependências abaixo entraram depois, feature a feature — `package.json` é sempre a fonte de verdade do que está instalado; esta lista é só o histórico de por que cada uma entrou.

```bash
# Bloco 3 — Compartilhar/salvar QR Code (cartão com marca, não QR cru)
npx expo install expo-sharing expo-media-library react-native-view-shot

# Bloco 3 — Feedback tátil (haptics) em ações de compartilhar/salvar
npx expo install expo-haptics
```

> **Atenção:** módulos nativos (todas as libs acima) só entram no binário em **build novo** do dev client (`npm run build:android:dev` / `npm run build:ios:dev`) — instalar via `npx expo install` atualiza o JS/`package.json`, mas o app já instalado no device continua sem o módulo nativo até reinstalar um dev client rebuildado. Sintoma se esquecer: `Cannot find native module 'X'` em runtime.

### Scripts de build (`package.json`)

Wrappers sobre `eas build` — evita depender de lembrar profile/flags a cada build:

| Script | Equivalente |
|--------|-------------|
| `npm run build:android:dev` | `eas build --profile development --platform android` |
| `npm run build:android:preview` | `eas build --profile preview --platform android` |
| `npm run build:android:prod` | `eas build --profile production --platform android` |
| `npm run build:ios:dev` | `eas build --profile development --platform ios` |
| `npm run build:ios:preview` | `eas build --profile preview --platform ios` |
| `npm run build:ios:prod` | `eas build --profile production --platform ios` |

Dia a dia (mudança só de JS/TS) continua sendo só `npm run start`/`android`/`ios` — os scripts de `build:*` só são necessários quando algo nativo muda (nova lib com código nativo, ou config de plugin/permissão no `app.json`).

### EAS Build config

```json
// eas.json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

---

## 13. Arquivos Canônicos de Referência

| Arquivo | Quando consultar |
|---------|-----------------|
| `soundmeet-backend/Docs/architecture.md` | Entender como o backend está organizado |
| `soundmeet-backend/Docs/business-rules.md` | Regras de negócio por domínio |
| `soundmeet-backend/Docs/features.md` | O que o produto faz |
| `soundmeet-backend/Docs/roadmap.md` | Prioridades do backend |
| `soundmeet-backend/Docs/refs-front.md` | Referências visuais do usuário (Dribbble/Pinterest) |
| `soundmeet-backend/prisma/schema.prisma` | Entidades e tipos de dados |
| `soundmeet-frontend-plan.md` | Este documento |

---

## 14. Decisões Abertas (a resolver)

| Decisão | Status | Observação |
|---------|--------|-----------|
| Paleta de cores final | ✅ Proposta (Seção 9) | Validar após ver logo gerada |
| Logo / símbolo final | ⏳ Pendente | Usar prompt da Seção 11 no Google Stitch |
| Nome do app nas lojas | ⏳ Pendente | "SoundMeet" confirmado, verificar disponibilidade |
| Bundle identifier | ⏳ Pendente | `com.soundmeet.app` (sugestão) |
| Splash screen / onboarding | ⏳ Pendente | Definir após logo |
| Push notification service | ⏳ Pendente | Expo Notifications + FCM/APNs |
| Monitoramento de erros | ⏳ Pendente | Sentry para React Native |

---

## 15. Histórico de Decisões

| Data | Decisão | Razão |
|------|---------|-------|
| 27/06/2026 | React Native + Expo (não Flutter, não KMP) | TypeScript familiar, ecossistema imenso, New Architecture fecha gap de performance |
| 27/06/2026 | GSAP/Framer Motion/Barba.js descartados para mobile | DOM-only, incompatíveis com React Native |
| 27/06/2026 | Reanimated 3 + Moti + Skia como stack de animação | Substitutos superiores nativos do RN |
| 27/06/2026 | Violeta (#7C3AED) como cor da marca | Único entre concorrentes, premium, musical |
| 27/06/2026 | Space Grotesk + Inter como tipografia | Geométrica, moderna, boa legibilidade |
| 27/06/2026 | Dark mode como padrão + toggle light | Contexto de uso em ambientes escuros (palco, bar) |
| 27/06/2026 | EAS Build desde o início (não Expo Go) | Necessidade de módulos nativos (câmera, áudio, notificações) |
| 27/06/2026 | Músico como primeiro usuário do MVP | Produtor do conteúdo; sem músico não há experiência |
| 27/06/2026 | FSD + Clean Architecture por feature | Consistência com backend DDD, escalável, testável |
| 27/06/2026 | TanStack Query + Zustand para estado | Pragmático para MVP, sem overhead do Redux |
| 27/06/2026 | Monorepo simples (sem Turborepo por enquanto) | Evitar complexidade desnecessária no MVP |
| 06/07/2026 | Moti removido do stack de animação (Reanimated 4 direto, sem wrapper) | v0.30 (única versão publicada) só suporta Reanimated 3; incompatível com Reanimated 4 + New Architecture do Expo SDK 56; sem v1.0 lançada. Corrige a linha acima ("Reanimated 3 + Moti + Skia"), que ficou desatualizada — detalhe em `CLAUDE.md` |
| 06/07/2026 | `expo-sharing` + `expo-media-library` + `react-native-view-shot` (Bloco 3 — QR Code) | Exportar o `QRFrame` inteiro (bezel + marca + nome) como PNG via `view-shot`, e então compartilhar/salvar — cartão com identidade (estilo Spotify Code), não QR cru |
| 06/07/2026 | `expo-haptics` (Bloco 3 — feedback tátil) | Tick leve no toque de Compartilhar; notificação de sucesso real (após `Asset.create` confirmar) no Salvar — reforça sensação premium sem inventar um sistema de toast novo |
| 06/07/2026 | `react-native-worklets` adicionado explicitamente | Peer dependency obrigatória do Reanimated 4 desde a divisão do core em worklets separado; faltando, `expo-doctor` já avisa "app pode crashar fora do Expo Go" — exatamente nosso cenário (dev client) |
| 06/07/2026 | `expo-av` removido do projeto | Nunca foi usado em `src/` (só reservado pro afinador cromático, ainda não implementado); módulo nativo `VideoViewModule` quebra o boot do app em runtime com New Architecture (`NoClassDefFoundError: LazyKType`) — `expo-doctor` já sinalizava a lib como não mantida. Quando o afinador for implementado (Bloco 1 item 8), usar **`expo-audio`** (substituto atual recomendado pela Expo para gravação/captura de áudio), não `expo-av` |
