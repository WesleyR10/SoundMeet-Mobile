# SoundMeet — Design System

> Documento canônico de identidade visual e tokens de design.
> Logo escolhida: **Frequência • Conexão** (barras equalizador, teal) — `assets/logo/logo-verde.png`
> Decisão tomada em: 27/06/2026

---

## Logo

| Variação | Arquivo | Uso |
|---------|---------|-----|
| Símbolo teal (fundo escuro e claro) | `assets/logo/logo-verde.png` | App icon, splash, dark contexts |

**Conceito:** Barras verticais de equalizador convergindo para um ponto central — onda sonora + encontro.
Funciona de 16px (favicon) a 2m (banner de palco).

---

## Paleta de Cores
Teal  #00E0B8
  - Teal + Coral #FF6B6B = vibrantíssimo, jovem, energético
  - Teal + Violeta #7C3AED = sofisticado e profundo
  - Teal + Âmbar #F59E0B = quente e luminoso
  - Fundo #0C0C14 com teal = parece Matrix/holograma, muito premium

### Cor Principal — Teal `#00E0B8`

Energia, vibração, modernidade. Som que se propaga e conecta pessoas.
Referência visual: néon holográfico sobre fundo escuro — Matrix premium.

### As 4 Combinações da Marca

```
Teal  + Coral  → Vibrantíssimo, jovem, energético   (gorjetas, CTAs)
Teal  + Violeta → Sofisticado, profundo, premium      (momentos especiais)
Teal  + Âmbar  → Quente, luminoso, expressivo        (destaques, atenção)
Teal  + #0C0C14 → Matrix/holograma, ultra premium    (backgrounds, dark mode)
```

---

## Tokens — Dark Mode (padrão)

### Backgrounds

| Token | Hex | Uso |
|-------|-----|-----|
| `colors.bg.primary` | #0C0C14 | Background base (azul-preto profundo) |
| `colors.bg.surface` | #0D1A18 | Cards, modais, surfaces (teal-tinted) |
| `colors.bg.elevated` | #102320 | Elementos elevados, bottom sheets |
| `colors.bg.overlay` | rgba(0,0,0,0.72) | Overlays, backdrops modais |

### Brand — Teal

| Token | Hex | Uso |
|-------|-----|-----|
| `colors.brand.primary` | #00E0B8 | Cor principal — logo, CTAs primários, ativo |
| `colors.brand.light` | #33E8C6 | Hover, variante clara, glow |
| `colors.brand.dark` | #00B896 | Pressed state, ícones sobre claro |
| `colors.brand.muted` | rgba(0,224,184,0.12) | Backgrounds de badge, chip selecionado |
| `colors.brand.glow` | rgba(0,224,184,0.20) | Box shadow, aura de elementos ativos |

### Accents

| Token | Hex | Contexto semântico |
|-------|-----|-----|
| `colors.accent.coral` | #FF6B6B | Gorjetas, CTA principal, energia, ação imediata |
| `colors.accent.coralDeep` | #FF2E7A | Gradiente coral (ponto 2), destaque extremo |
| `colors.accent.amber` | #F59E0B | Pendente, atenção, estrelas, rating |
| `colors.accent.violet` | #7C3AED | Momentos premium, assinatura, badge especial |
| `colors.accent.violetLight` | #A855F7 | Hover violeta, variação clara |

### Estados Semânticos

| Token | Hex | Quando usar |
|-------|-----|-----|
| `colors.status.success` | #10B981 | PIX confirmado, pedido aceito, online |
| `colors.status.warning` | #F59E0B | Pendente, aguardando, atenção |
| `colors.status.error` | #EF4444 | Pedido rejeitado, erro, offline |
| `colors.status.live` | #00E0B8 | Ao vivo agora (usa a brand color) |

### Texto

| Token | Hex | Uso |
|-------|-----|-----|
| `colors.text.primary` | #F8FAFC | Texto principal |
| `colors.text.secondary` | #94A3B8 | Texto secundário, placeholders |
| `colors.text.muted` | #475569 | Desabilitado, timestamps, captions |
| `colors.text.inverse` | #0C0C14 | Texto sobre fundos claros/teal |
| `colors.text.brand` | #00E0B8 | Links, valores em teal, destaques |

### Borders e Separadores

| Token | Hex | Uso |
|-------|-----|-----|
| `colors.border.default` | #0F2E28 | Bordas sutis (teal-tinted) |
| `colors.border.strong` | #1A4A3C | Bordas visíveis, separadores |
| `colors.border.brand` | rgba(0,224,184,0.30) | Bordas de cards ativos, focus ring |

---

## Tokens — Light Mode (toggle)

| Token | Hex | Uso |
|-------|-----|-----|
| `colors.bg.primary` | #F0FEFA | Background levemente teal (não branco puro) |
| `colors.bg.surface` | #FFFFFF | Cards, surfaces |
| `colors.bg.elevated` | #E0FAF5 | Elementos elevados |
| `colors.brand.primary` | #008F74 | Teal mais escuro para contraste no claro |
| `colors.brand.light` | #00B896 | Hover no light mode |
| `colors.text.primary` | #081A17 | Quase preto com tom teal |
| `colors.text.secondary` | #2D5047 | Cinza esverdeado |
| `colors.border.default` | #C0EDE5 | Bordas suaves |

---

## Gradientes

```typescript
gradients: {
  brand:   [ #00E0B8, #00B896],          // teal suave — headers, cards ativos
  energy:  [ #FF6B6B, #FF2E7A],          // coral → magenta — gorjeta, CTA quente
  premium: [ #7C3AED, #4D9CFF],          // violeta → azul — momentos especiais
  warm:    [ #F59E0B, #FF6B6B],          // âmbar → coral — destaques quentes
  dark:    [ #0C0C14, #0D1A18],          // fundo → surface — subtle bg
  live:    ['rgba(0,224,184,0.0)', '#00E0B8'], // fade-in teal — indicador ao vivo
}
```

---

## Tipografia

| Token | Fonte | Peso | Tamanho | Uso |
|-------|-------|------|---------|-----|
| `text.displayXl` | Space Grotesk | 700 | 48px | Hero screens, splash |
| `text.displayLg` | Space Grotesk | 700 | 36px | Títulos de tela |
| `text.displayMd` | Space Grotesk | 600 | 28px | Seções, headers |
| `text.title` | Space Grotesk | 600 | 22px | Cards, subtítulos |
| `text.bodyLg` | Inter | 400 | 17px | Textos corridos |
| `text.body` | Inter | 400 | 15px | UI padrão |
| `text.bodySm` | Inter | 400 | 13px | Texto secundário |
| `text.caption` | Inter | 500 | 11px | Labels, timestamps |
| `text.mono` | JetBrains Mono | 400 | 14px | Cifras, acordes, código |

---

## Espaçamento

Baseado em grid de 4px:

```typescript
spacing: {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
  xxxl: 48,
}
```

---

## Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `radius.sm` | 8px | Tags, chips, badges |
| `radius.md` | 12px | Inputs, campos de texto |
| `radius.lg` | 16px | Cards, containers |
| `radius.xl` | 24px | Botões principais, bottom sheets |
| `radius.full` | 9999px | Avatares, ícones circulares, pills |

---

## Sombras (Elevation)

```typescript
shadows: {
  sm:    '0 2px 8px rgba(0,0,0,0.40)',
  md:    '0 4px 16px rgba(0,0,0,0.50)',
  lg:    '0 8px 32px rgba(0,0,0,0.60)',
  brand: '0 8px 32px rgba(0,224,184,0.15)',   // glow teal
  coral: '0 8px 24px rgba(255,107,107,0.25)', // glow gorjeta
  violet:'0 8px 24px rgba(124,58,237,0.20)',  // glow premium
}
```

---

## Paleta de Uso por Contexto

| Contexto no app | Cor dominante | Accent | Gradiente |
|----------------|--------------|--------|-----------|
| **Tela ao vivo (músico)** | Teal `#00E0B8` | Coral | `live` |
| **Gorjeta / PIX** | Coral `#FF6B6B` | Teal | `energy` |
| **Perfil do músico** | Teal | Âmbar | `brand` |
| **Gamificação / Ranking** | Âmbar `#F59E0B` | Violeta | `warm` |
| **Onboarding / Premium** | Violeta `#7C3AED` | Teal | `premium` |
| **Scanner QR** | Teal | — | `live` |
| **Analytics** | Teal + Âmbar | — | `warm` |
| **Chat / Agenda (músico)** | Violeta `#7C3AED` | Teal | `premium` |
| **Configurações** | Neutro | Teal | `dark` |

---

## Referências Visuais

Ver: `Docs/refs-front.md`

Direção: health monitoring dark UI + fitness energy + meditation gradients + banking premium
Vibe: **"Néon holográfico premium"** — Matrix encontra show ao vivo de artista internacional.
