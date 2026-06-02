---
name: Encoteki
description: Community-driven conservation through blockchain governance and NFT stewardship.
colors:
  canopy-green: '#246234'
  deep-canopy: '#163C20'
  spring-mist: '#F0FAF3'
  warm-linen: '#F6F6EC'
  parchment: '#F9F9F6'
  dried-grass: '#E7E7C0'
  faded-sage: '#EFEFD6'
  straw: '#DADA9F'
  stone: '#515351'
  ash: '#7D817D'
  fog: '#CCCECC'
  charcoal: '#0D140F'
  near-black: '#1A1A1A'
  signal-red: '#D63B29'
  clay-red: '#FBE8E2'
  deep-blue: '#1346AC'
  river-blue: '#CEEEFD'
  deep-river: '#044462'
  amber-parchment: '#FEF3CD'
  burnt-amber: '#644E02'
typography:
  display:
    fontFamily: 'Outfit, system-ui, sans-serif'
    fontSize: 'clamp(2rem, 5vw, 4rem)'
    fontWeight: 700
    lineHeight: 1.1
  headline:
    fontFamily: 'Outfit, system-ui, sans-serif'
    fontSize: 'clamp(1.5rem, 3vw, 3rem)'
    fontWeight: 500
    lineHeight: 1.2
  title:
    fontFamily: 'Outfit, system-ui, sans-serif'
    fontSize: 'clamp(1.25rem, 2vw, 1.5rem)'
    fontWeight: 500
    lineHeight: 1.3
  body:
    fontFamily: 'Outfit, system-ui, sans-serif'
    fontSize: 'clamp(0.875rem, 1vw, 1rem)'
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: 'Outfit, system-ui, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: '0.05em'
rounded:
  full: '9999px'
  4xl: '2rem'
  2xl: '1rem'
  xl: '0.75rem'
  base: '0.625rem'
spacing:
  xs: '4px'
  sm: '8px'
  md: '16px'
  lg: '24px'
  xl: '32px'
  2xl: '48px'
  3xl: '64px'
components:
  button-primary:
    backgroundColor: '{colors.canopy-green}'
    textColor: '#FFFFFF'
    rounded: '{rounded.full}'
    padding: '12px 24px'
  button-primary-hover:
    backgroundColor: '{colors.deep-canopy}'
  button-secondary:
    backgroundColor: '#FFFFFF'
    textColor: '{colors.canopy-green}'
    rounded: '{rounded.full}'
    padding: '12px 24px'
  nav-pill:
    backgroundColor: '#FFFFFF'
    textColor: '{colors.ash}'
    rounded: '{rounded.full}'
    padding: '6px'
  nav-pill-active:
    backgroundColor: '{colors.spring-mist}'
    textColor: '{colors.canopy-green}'
  badge:
    rounded: '{rounded.2xl}'
    padding: '4px 12px'
  card-surface:
    backgroundColor: '{colors.parchment}'
    rounded: '{rounded.4xl}'
    padding: '20px'
  card-modal:
    backgroundColor: '#FFFFFF'
    rounded: '{rounded.4xl}'
    padding: '20px 24px'
  input-default:
    backgroundColor: '#FFFFFF'
    textColor: '{colors.near-black}'
    rounded: '{rounded.xl}'
    padding: '14px 16px'
---

# Design System: Encoteki

## 1. Overview

**Creative North Star: "The Greenhouse Commons"**

A shared space where things grow together. The Encoteki design system draws from the quiet energy of a communal greenhouse: warm, light-filled, structured enough to support life but never rigid. Every surface is bathed in the soft warmth of dried linen and sunlit parchment. The single accent, canopy green, marks where life happens: a vote cast, a mint confirmed, a community growing.

The system rejects the cold neon of crypto trading dashboards, the sterile void of corporate SaaS, and the cartoonish energy of gamified NFT platforms. PRODUCT.md's principle "warmth over polish" is the architectural rule here: the interface should feel like it was built by people who care about the land, not by a design system generator. Outfit carries all type roles, from bold display headlines down to fine labels, with humanist warmth and excellent legibility at every size.

Density is low. White space is treated as habitat, not waste. Interactions are soft and assured: pill-shaped buttons, gentle scale transitions, earthy fills. Nothing snaps, nothing bounces. The easing is always exponential out, matching the patient unfolding of natural growth.

**Key Characteristics:**

- Warm linen backgrounds with a single, deliberate green accent
- Generous rounding (pills for actions, large radii for containers)
- Single-family type system: Outfit at all scales, weight hierarchy from 700 display to 400 body
- Flat-by-default surfaces; shadows emerge only in response to state
- Soft motion with exponential ease-out curves
- Accessible to newcomers without patronizing experienced web3 users

## 2. Colors: The Greenhouse Palette

An earthy, tinted-neutral palette where green is the only saturated voice. The khaki family provides warmth without sterility; every gray carries a whisper of the brand hue. Color is restrained: canopy green appears on less than 10% of any screen, so when it does appear, it means something.

### Primary

- **Canopy Green** (`#246234` / `oklch(0.35 0.08 145)`): The singular accent. Buttons, active navigation, the footer ground, status confirmations. Its rarity is the point; overuse dilutes its authority.
- **Deep Canopy** (`#163C20` / `oklch(0.26 0.06 148)`): Hover and pressed states for green elements. Dark enough to register as a state change without introducing a new hue.
- **Spring Mist** (`#F0FAF3` / `oklch(0.97 0.015 155)`): The lightest green tint. Active nav pill background, subtle success states. Green's whisper, not its voice.

### Neutral

- **Warm Linen** (`#F6F6EC`): The primary page background. Every full-bleed container sits on this. Not white, not cream: linen. It carries faint yellow warmth that disappears at a glance but would be missed if removed.
- **Parchment** (`#F9F9F6`): Card and content surface. One step lighter than linen, just enough to lift content without a shadow.
- **Faded Sage** (`#EFEFD6`): The mid-khaki. Used sparingly for subtle differentiation when parchment and linen aren't enough.
- **Dried Grass** (`#E7E7C0`): Skeleton loading states, dividers, and the occasional border. The workhorse neutral.
- **Straw** (`#DADA9F`): The most saturated khaki. Reserved for when a neutral needs to feel more present (input borders with focus, interactive surface hints).
- **Fog** (`#CCCECC`): Border and divider color. Neutral with the faintest green tint.
- **Ash** (`#7D817D`): Secondary text, placeholders, muted labels. Readable against linen but clearly subordinate.
- **Stone** (`#515351`): Primary body text on light backgrounds. The default reading color.
- **Charcoal** (`#0D140F`): The login page background. Near-black with a green undertone. Used only on the dark authentication surface.
- **Near Black** (`#1A1A1A`): Headings on light backgrounds, high-emphasis text.

### Semantic

- **Signal Red** (`#D63B29`): Destructive actions, errors, failed transactions. Never decorative.
- **Clay Red** (`#FBE8E2`): Light error background tint.
- **Deep Blue** (`#1346AC`): Reserved for governance badge text on blue tint.
- **River Blue** (`#CEEEFD`): Governance badge background (Proof of Donation category).
- **Deep River** (`#044462`): Governance badge text on river blue.
- **Amber Parchment** (`#FEF3CD`): Proposal badge background.
- **Burnt Amber** (`#644E02`): Proposal badge text on amber parchment.

### Named Rules

**The One Voice Rule.** Canopy Green is the only saturated color on any given screen outside of categorical badges. If a new feature needs color, it uses the green or it uses a neutral. Introducing a second accent requires a design review.

**The Tinted Neutral Rule.** No pure `#000` or `#fff` anywhere in the system. Every neutral carries a trace of warmth. `#1A1A1A` replaces black; `#F9F9F6` replaces white. If it looks sterile, it's wrong.

## 3. Typography

**Font:** Outfit (with system-ui, sans-serif fallback) — all roles

**Character:** Outfit handles every type role with a single humanist family. Weight is the hierarchy instrument: 700 for display, 600 for headlines, 500 for titles and labels, 400 for body. One family, no font-switching, no serif/sans context mismatch. The result is consistent, warm, and always legible.

### Hierarchy

- **Display** (Outfit 700, `clamp(2rem, 5vw, 4rem)`, line-height 1.1): Hero headlines and page titles. Used sparingly; one per page at most.
- **Headline** (Outfit 600, `clamp(1.5rem, 3vw, 3rem)`, line-height 1.2): Section headers, page names (h1/h2). The primary structural text.
- **Title** (Outfit 500, `clamp(1.25rem, 2vw, 1.5rem)`, line-height 1.3): Card headings, modal titles, subsection labels (h3/h4).
- **Body** (Outfit 400, `clamp(0.875rem, 1vw, 1rem)`, line-height 1.6): All paragraph text, descriptions, form help text. Capped at 65ch line length on reading-heavy surfaces.
- **Label** (Outfit 500, `0.75rem`, line-height 1.4, letter-spacing 0.05em): Form labels, badge text, metadata, timestamps. Uppercase when used for category markers.

### Product Scale (Tailwind tokens)

Fixed `rem` scale for product surfaces. No raw `px` values or arbitrary `text-[Xpx]` utilities. Every text element in product UI references one of these tokens.

| Token | Size | Px | Use |
|---|---|---|---|
| `text-display` | 3.5rem | 56 | Hero headings. One per page at most. |
| `text-h1` | 2.25rem | 36 | Page titles |
| `text-h2` | 1.75rem | 28 | Section headers, modal titles |
| `text-h3` | 1.25rem | 20 | Card headings, subsections |
| `text-body` | 1rem | 16 | Body baseline. All prose references this. |
| `text-small` | 0.875rem | 14 | Secondary text, helper labels |
| `text-caption` | 0.75rem | 12 | Metadata, timestamps, UI captions |

Tokens are defined in `tailwind.config.mts` under `theme.extend.fontSize`. Line-heights are baked in per token so they never need to be specified separately.

## 4. Elevation

The system is flat by default. Surfaces separate through tonal layering (linen → parchment → white) rather than shadow. Shadows appear only as a response to state or to signal floating context.

### Shadow Vocabulary

- **Ambient** (`shadow-sm` / `0 1px 2px rgba(0,0,0,0.05)`): Navigation bar, secondary buttons. Present but invisible at a glance. Confirms the element floats without drawing attention.
- **Lifted** (`shadow-lg` / `0 10px 15px rgba(0,0,0,0.1)`): The mint modal and primary content containers. Signals "this is the focus area" on khaki backgrounds.
- **Dramatic** (`shadow-2xl` / `0 25px 50px rgba(0,0,0,0.25)`): Login modal, referral modal. Reserved for overlay contexts on dark or blurred backgrounds.
- **Green Glow** (`0 4px 12px rgba(36,98,52,0.2)` → hover: `0 6px 16px rgba(36,98,52,0.3)`): Primary sign-in button only. A soft colored shadow that reinforces the button's importance. Deepens on hover.

### Named Rules

**The Flat-By-Default Rule.** No surface carries a shadow at rest unless it's a floating overlay (modal, dropdown, toast). Depth is communicated through background color steps: linen (page) → parchment (card) → white (modal). Add a shadow only when the element physically floats above the page (dropdown menus, modals, toasts).

## 5. Components

### Buttons

Soft and assured. Pill-shaped, generously padded, with gentle scale transitions that feel like pressing something real.

- **Shape:** Full pill (border-radius 9999px), padding 12px 24px, responsive padding increases at tablet+
- **Primary:** Canopy Green (`#246234`) fill, white text, subtle green glow shadow. Hover deepens to Deep Canopy (`#163C20`) with enhanced shadow. Active scales to 0.95. Disabled at 50% opacity.
- **Hover / Focus:** Scale to 1.05 on hover, 0.95 on active. Focus-visible: 2px ring in canopy green with 2px offset. Transition 300ms ease-out.
- **Secondary:** White fill, canopy green text, thin green-tinted border (`border-primary-green/10`). Hover fills `primary-green/10`.
- **Danger:** White fill, signal red text, subtle ring border. Used for sign-out only.
- **Muted:** Neutral background (`neutral-60/20`), ash text. Loading/disabled states.

### Chips / Badges

Categorical markers for DAO proposal types. Each has a paired background and text color drawn from the semantic palette.

- **Style:** Rounded 2xl (1rem radius), horizontal padding 12px, vertical 4px. Icon + label layout.
- **Variants:** Proposal (amber parchment bg, burnt amber text), Proof of Donation (river blue bg, deep river text), Business Proposal (spring mist bg, deep canopy text).
- **State:** Static, non-interactive. No hover or focus states.

### Cards / Containers

- **Corner Style:** Large radius (rounded-4xl / 2rem) for primary content cards (mint modal, proposal cards). Rounded-2xl (1rem) for secondary containers (bento cards, payment selection).
- **Background:** White for modals and primary cards. Parchment for surface cards on linen backgrounds.
- **Shadow Strategy:** Flat by default. Lifted shadow only on the mint modal (the primary focal container). No shadow on list cards or bento cards.
- **Border:** Cards on white use `border-primary-green/40` (a 40% opacity green hint). Selection cards use border-only state changes (selected: full primary border + 5% primary fill).
- **Internal Padding:** 20px base, 24px at tablet. Consistent within each card type but varied between card types for rhythm.

### Inputs / Fields

- **Style:** White fill, subtle border (`border-border`), rounded-xl (0.75rem). 14px vertical padding, 16px horizontal.
- **Focus:** Border shifts to primary green (or green-tinted) with a 1px ring glow (`ring-primary-green/50`). Background lightens slightly on the login page (`bg-white/10` on dark).
- **Error:** Red-tinted border with red-tinted background fill. Error text below in signal red.
- **Disabled:** 50% opacity, cursor-not-allowed.
- **Referral code input variant:** Centered monospace text, wider letter spacing (`tracking-widest`), uppercase transform. Distinctly different from standard inputs to signal "code entry."

### Navigation

- **Desktop:** Centered pill container (rounded-full) with white/90 background, subtle border, and backdrop blur. Nav items are rounded-full buttons with spring-animated active indicator (green pill that slides between items with stiffness 500, damping 35).
- **Active state:** Spring mist background, canopy green text.
- **Inactive state:** Ash text, hover to near-black.
- **Mobile:** Slide-down panel from header, rounded-3xl, white/95 background with backdrop blur. Each item is a rounded-2xl button. Active item gets spring mist fill.
- **Typography:** Label scale (0.875rem), medium weight, wide tracking.

### Mint Modal (Signature Component)

The central transaction surface. A white rounded-4xl card (max-width 400px) centered on a linen background with a lifted shadow. Contains a multi-step flow (payment selection → review → status) animated with blur + scale + opacity transitions (exponential ease-out, 350ms). The modal uses `layout="position"` for smooth height animations between steps. Reduced motion users get instant opacity-only transitions.

## 6. Do's and Don'ts

### Do:

- **Do** use canopy green (`#246234`) as the sole accent on any screen. Its scarcity signals importance.
- **Do** tint every neutral toward warmth. The khaki scale (`#F6F6EC` through `#DADA9F`) replaces generic grays.
- **Do** use pill shapes (rounded-full) for all buttons and navigation items. Rounded-4xl for content cards, rounded-xl for inputs.
- **Do** respect `prefers-reduced-motion` for every animation. Duration 0 and no blur/scale transforms.
- **Do** use exponential ease-out curves (`[0.16, 1, 0.3, 1]`) for all transitions. Ease-out-quart or stronger.
- **Do** use Outfit across all type roles. Weight is the hierarchy instrument: 700 display, 600 headline, 500 title/label, 400 body.
- **Do** layer depth through background color (linen → parchment → white) before reaching for shadows.
- **Do** design every web3 interaction (minting, voting, wallet connection) for someone doing it for the first time.

### Don't:

- **Don't** introduce a dark-neon-terminal aesthetic, walls of charts, or jargon-heavy interfaces. This is not a trading floor. (From PRODUCT.md: "No dark-neon-terminal aesthetic, no walls of charts, no jargon-heavy interfaces.")
- **Don't** use hero-metric templates, sterile white voids, or stock photography. This is a community with a mission, not a B2B conversion funnel. (From PRODUCT.md: "No hero-metric templates, no sterile white voids, no stock photography.")
- **Don't** use pixel art, cartoon NFT vibes, or meme culture aesthetics. The environmental mission deserves sincerity and weight. (From PRODUCT.md: "No pixel art, no cartoon NFT vibes, no meme culture.")
- **Don't** use `#000000` or `#FFFFFF` anywhere. Every black and white is tinted.
- **Don't** use border-left or border-right greater than 1px as a colored accent stripe on cards, list items, or alerts.
- **Don't** use `background-clip: text` with gradient backgrounds.
- **Don't** use glassmorphism decoratively. Backdrop blur is reserved for navigation (functional overlay) and the login page (atmospheric context). Never on content cards.
- **Don't** use bounce or elastic easing. Motion is patient and exponential.
- **Don't** use modals when inline or progressive disclosure alternatives exist. The referral code creation is the one modal in the system; exhaust alternatives before adding another.
- **Don't** nest cards inside cards. If you need depth, use tonal layering.
