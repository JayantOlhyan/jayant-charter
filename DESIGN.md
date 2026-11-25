# Jayant Charter — Canonical Design Record (`DESIGN.md`)

**Status:** Active production design system (v1.3 — Full-bleed Jesko × Digital Jets cinema & showroom release)  
**Updated:** 25 November 2026  
**Public working brand:** Jayant Charter  
**Primary references:** Jesko Jets (`jeskojets.com`) for continuous scroll-led visual narrative, multi-stop atmospheric transitions, monumental display typography, and synced editorial splits; Digital Jets (`digital-jets.com/products`) for studio-lit aircraft imagery, daylight/twilight/evening atmosphere modes, interactive Before/After ramp comparisons, and close-up engineering detail. Full live inspection notes live in [docs/REFERENCE-AUDIT.md](./docs/REFERENCE-AUDIT.md) and [docs/VISUAL-BOARD.md](./docs/VISUAL-BOARD.md).

---

## 1. Visual Philosophy & Guardrails

- **Role clarity over theatrical claims:** Jayant Charter is a founder-led private aviation inquiry service arranging private jets, group charters, and helicopters around custom itineraries. Licensed operating carriers operate flights and are named before confirmation. Aircraft presented on site are **illustrative examples**, never labeled *"Our fleet"*.
- **No internal partner branding in public UI:** Operational partners remain strictly server-side and off public navigation, page copy, logo strips, and browser source maps.
- **Zero AI-template clichés:** No uppercase tracked eyebrows, no middle-dot meta strips, no glued arrow suffixes on buttons, no pulsing dots, no purple/cyan gradients, no glassmorphism card clutter, no card-inside-a-card nesting, no invented metrics, testimonials, portraits, or booking availability claims.
- **HTML first, 3D progressive:** Every headline, value statement, service explanation, specification, and inquiry action is server-rendered semantic HTML immediately available before WebGL initializes and when 3D is unavailable.

---

## 2. Colour Tokens (Semantic CSS Variables — No Raw Hex in Components)

All colours live in `src/styles/tokens.css` under `:root` and map into Tailwind v4 `@theme inline`.

| Token | Hex | Role | Measured Contrast Pair |
|---|---|---|---|
| `--jc-teal-deep` | `#0A1D1C` | Atmospheric horizon base & deepest studio shadow | `--jc-ivory` text: **16.2:1** |
| `--jc-teal` | `#102B2A` | Primary dark surface (Hero, 3D Hangar, Closing, Footer) & dark CTA | `--jc-ivory` text: **13.7:1** |
| `--jc-teal-elevated` | `#163836` | Subtle elevated dark panels & hairline borders | `--jc-ivory` text: **11.1:1** |
| `--jc-ivory` | `#F7F5ED` | Primary editorial reading surface | `--jc-ink` text: **13.4:1** |
| `--jc-stone` | `#EEECE2` | Secondary warm reading band (Detail gallery, Inquiry shell) | `--jc-ink` text: **12.2:1** |
| `--jc-paper` | `#FBF9F3` | Input wells & studio specification cards on Stone | `--jc-ink` text: **13.8:1** |
| `--jc-ink` | `#182C2A` | Primary ink on light surfaces | vs `--jc-ivory`: **13.4:1** |
| `--jc-muted` | `#4E625D` | Supporting text on Ivory/Stone (refined slightly darker than `#536863` for comfortable AA margin) | vs `--jc-ivory`: **6.1:1**, vs `--jc-stone`: **5.5:1** |
| `--jc-ivory-soft` | `#C7D3CE` | Supporting text on Deep Teal | vs `--jc-teal`: **9.5:1** |
| `--jc-gold` | `#E8C184` | Primary CTA fill on Deep Teal (strictly paired with `--jc-teal` ink), focus ring on dark, hairline accent | `--jc-teal` ink on `--jc-gold`: **9.2:1** |
| `--jc-gold-hover` | `#F0CF9A` | Hover state for primary gold CTA | `--jc-teal` ink: **10.5:1** |
| `--jc-danger` | `#9E2E1B` | Validation errors on light surfaces | vs `--jc-paper`: **6.4:1** |
| `--jc-line-light` | `#D7D3C5` | Structural hairlines on Ivory/Stone | UI contrast compliant |
| `--jc-line-dark` | `rgba(247, 245, 237, 0.16)` | Structural hairlines on Deep Teal | Subtle architectural rule |

**Hard colour rules:**
- Never place `--jc-gold` text on `--jc-ivory` or `--jc-stone`.
- Never place `--jc-muted` text on `--jc-teal`.
- Never use pure `#000000` or `#FFFFFF` outside token definitions.

---

## 3. Typography

Upgraded from the baseline Georgia proposal per PRD §14.1 & §15.5, self-hosted via `next/font/google` (SIL OFL, zero third-party runtime font tracking, zero layout shift):

- **Display Serif (`--font-display`):** `Newsreader` (optical size axis, weights `400`, `500`, normal style; tight `-0.025em` tracking on display heads, `text-wrap: balance`).
- **UI & Body Sans (`--font-sans`):** `Plus Jakarta Sans` (weights `400`, `500`, `600`; `font-variant-numeric: tabular-nums` on figures, dates, and specifications).

### Scale
- **Hero Display (`h1`):** `clamp(2.75rem, 5.6vw, 5.25rem)` (44px – 84px), `line-height: 1.04`, `font-weight: 400`.
- **Section Display (`h2`):** `clamp(2rem, 3.8vw, 3.5rem)` (32px – 56px), `line-height: 1.1`.
- **Subheadings (`h3`):** `clamp(1.375rem, 2vw, 1.75rem)` (22px – 28px), `line-height: 1.22`.
- **Body:** `1rem` (16px minimum) to `1.125rem` (18px lead), `line-height: 1.6`, `max-width: 62ch` on prose.
- **Labels & Captions:** `0.875rem` (14px) or `0.8125rem` (13px) in `--font-sans`, sentence case, untracked. **Never** tracked uppercase eyebrows.

---

## 4. Layout, Spacing & Controls

- **Container cap:** `1320px` centred (`margin-inline: auto`), horizontal gutters `clamp(20px, 4.5vw, 56px)`. At `1920px`, outer gutters grow while grid columns and measure stay constant.
- **Spacing rhythm:** 8px scale (`--space-1: 4px`, `--space-2: 8px`, ..., `--space-16: 128px`).
- **Control targets:** Minimum `48px` height (`min-h-12`) for primary buttons, form inputs, selects, and touch targets; crisp low radius (`3px` buttons/inputs, `4px` frames).
- **Focus & states:** Instant `3px` `:focus-visible` outline (`--jc-gold` on dark surfaces, `--jc-teal` on light surfaces, `outline-offset: 3px`). Every interactive control supports default, hover, focus-visible, active, disabled, loading, error, and success states.
- **Overflow discipline:** `overflow-x: clip` on `html` and `body`; image-bearing grid tracks use `minmax(0, 1fr)`; display heads carry `overflow-wrap: break-word; min-width: 0`.

---

## 5. Motion, Scroll Choreography & 3D Rules

- **Signature Move (*Altitude Horizon, Cloud Approach & Overhead Planform*):** Full-bleed `300svh` pinned desktop 3-beat stage floating directly under whisper-thin transparent navigation. Paints an immediate optimized hero poster (`1280×800` above-the-fold safe), upgrades seamlessly to the live Meshopt 3D Hawker 4000 (`-36°` three-quarter, `shadow-intensity="0"` in sky), scrubs bidirectionally through a `0°` broadside Cloud-Deck profile (with upper-sky optical-focus pillars clear of the aircraft) and rises into a luminous Warm Stone architectural overhead vertical planform (`90° / 14° / 94%`, soft studio shadow `0.56`) framed by monumental split typography and hairline airframe metrics. Unmounts its WebGL context via `IntersectionObserver` before Chapter 4 so only one `<model-viewer>` context is ever active.
- **Persistent Navigation & Inquiry Pill:** Centered wordmark top strip floats transparently over `/` at `y = 0` and adopts `--jc-nav-scrolled` blur on scroll; persistent bottom-center `FloatingCallbackPill` stays effortlessly reachable while auto-hiding over `#inspect-aircraft`, `#inquire`, and `footer`.
- **Smooth Scroll:** Lenis active on desktop fine-pointer environments only; automatically disabled under `prefers-reduced-motion: reduce` and on touch devices so native mobile scrolling is never altered.
- **Composited Properties Only:** Animate `transform`, `opacity`, and `clip-path` only. Never `transition: all`; never animate `width`, `height`, `top`, or `left`. Synced editorial imagery (`TrustEditorialSplit`) uses a zero-runtime CSS opacity stack.
- **Reduced Motion:** `prefers-reduced-motion: reduce` disables Lenis, ambient cloud drift, and scrubbed camera transitions while preserving the complete 8-chapter visual story, high-res aircraft stills, and optional explicit manual 3D inspection.
- **3D Hangar Policy:** Poster-first always; reusable scene configs in `content/scenes.json`; maximum one active `<model-viewer>` instance per page; desktop (`0.70–1.39 MiB`, ≤ 6 MB) & mobile (`0.61–1.24 MiB`, ≤ 3 MB) versioned GLB tiers; three calibrated studio lighting modes (*Twilight hangar*, *Daylight apron*, *Evening silhouette*); explicit mobile 3D interaction toggle (`touch-action="pan-y"`); 10s timeout & WebGL context-loss fallback; race-safe configuration switching.

---

## 6. Aircraft Asset Identity & Provenance

- **Hawker 4000 (`hawker-4000`):** Derived exclusively from `models/hawker-4000-realistic/` (high T-tail, pearl white/Atlantic blue/champagne livery, `HAWKER 4000` lettering). Configurations: *In Flight*, *Parked*, *Boarding* (shallow display vestibule; never claimed as a full cabin).
- **Dassault Falcon 2000 Classic (`falcon-2000-classic`):** Derived from `models/falcon-2000/` (original Classic with CFE738-style nacelles, clean wing tips, nine windows per side). Never renamed EX, LX, or LXS. Configurations: *In Flight*, *Parked*.
- **Licenses retained:** Google `model-viewer` v4.1.0 (Apache-2.0), ambientCG material maps (CC0 1.0), Poly Haven `Studio Small 09` HDR environment (CC0 1.0).
