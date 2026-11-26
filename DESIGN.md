# Jayant Charter — Canonical Design Record (`DESIGN.md`)

**Status:** Active production design system (v2.0 — User-approved Jesko aesthetic + multi-page Digital Jets 3D Showroom release)  
**Updated:** 26 November 2026  
**Public working brand:** Jayant Charter  
**Primary references:** Jesko Jets (`jeskojets.com`) reverse-engineered via REA ([docs/JESKO-REA-DISSECTION.md](./docs/JESKO-REA-DISSECTION.md)) for the opening cabin-window shade pull-up & zoom-through, bright high-altitude azure sky (`#015AA9 → #8FC2D7`), warm cream (`#FFF8ED`), architectural stone (`#8A817D → #FFF8ED`), warm espresso charcoal (`#312726 → #000000`), expanded display grotesque typography, overhead X-ray blueprint wipe, synced editorial accordion, looping city wheel, magnetic pill CTA + slide-up callback drawer, and live 3D `Globe.gl` finale; Digital Jets (`digital-jets.com/products`) for the interactive `/aircraft` 3D Showroom, multi-atmosphere studio lighting, Parked-vs-Boarding ramp slider, and macro CGI detail strip. Full inspection notes live in [docs/JESKO-REA-DISSECTION.md](./docs/JESKO-REA-DISSECTION.md), [docs/REFERENCE-AUDIT.md](./docs/REFERENCE-AUDIT.md), and [docs/VISUAL-BOARD.md](./docs/VISUAL-BOARD.md).

---

## 1. Visual Philosophy & Guardrails

- **Role clarity over theatrical claims:** Jayant Charter is a founder-led private aviation inquiry service arranging private jets, group charters, and helicopters around custom itineraries. Licensed operating carriers operate flights and are named before confirmation. Aircraft presented on site are **illustrative examples**, never labeled *"Our fleet"*.
- **No internal partner branding in public UI:** Operational partners remain strictly server-side and off public navigation, page copy, logo strips, and browser source maps.
- **Zero AI-template clichés:** No uppercase tracked eyebrows, no middle-dot meta strips, no glued arrow suffixes on buttons, no pulsing dots, no purple/cyan gradients, no glassmorphism card clutter, no card-inside-a-card nesting, no invented metrics, testimonials, portraits, or booking availability claims.
- **HTML first, 3D progressive:** Every headline, value statement, service explanation, specification, and inquiry action is server-rendered semantic HTML immediately available before WebGL initializes and when 3D is unavailable.

---

## 2. Colour Tokens (Semantic CSS Variables — No Raw Hex in Components)

Per explicit user approval (`26 November 2026`), the palette shifted from deep forest teal to the Jesko high-altitude daylight sky, warm editorial cream, architectural stone, and warm espresso charcoal surface progression while retaining restrained warm gold (`#E8C184`) solely for active accents and flight arcs. All colours live in `src/styles/tokens.css` under `:root` and map into Tailwind v4 `@theme inline`.

| Token | Hex | Role |
|---|---|---|
| `--jc-teal-deep` | `#120e0d` | Deepest warm espresso charcoal base (Global finale, 3D Hangar, Footer) |
| `--jc-teal` | `#312726` | Primary warm espresso charcoal (Cabin bulkhead, dark CTAs, active tabs) |
| `--jc-teal-elevated` | `#3d3230` | Elevated dark UI chips & controls |
| `--jc-sky-deep` | `#015aa9` | High-altitude zenith azure sky (Opening window handoff & Cloud Philosophy top) |
| `--jc-sky-mid` | `#5fa2c9` | Mid-altitude daylight sky progression |
| `--jc-sky-pale` | `#8fc2d7` | Lower cloud-deck azure transitioning into cream |
| `--jc-ivory` | `#fff8ed` | Primary warm cream editorial reading surface & blueprint canvas |
| `--jc-stone` | `#f3ece0` | Secondary warm reading band & card surfaces |
| `--jc-stone-deep` | `#8a817d` | Architectural warm stone studio top for the Overhead Planform showcase |
| `--jc-paper` | `#fffcf7` | Crisp elevated paper surface for form inputs and drawer fields |
| `--jc-ink` | `#181413` | Primary espresso ink on light surfaces (high-contrast AA/AAA) |
| `--jc-muted` | `#635b57` | Supporting ink on Cream/Stone |
| `--jc-ivory-soft` | `#e7dfd3` | Supporting text on Espresso dark surfaces |
| `--jc-gold` | `#e8c184` | Restrained warm gold accent for flight arcs, focus rings, and selected highlights |
| `--jc-danger` | `#9e2e1b` | Validation errors on light surfaces |

---

## 3. Typography

Upgraded per user approval to match Jesko's wide architectural grotesque identity using 100% open-licensed Google Fonts self-hosted via `next/font/google` (SIL OFL, zero third-party runtime requests, zero proprietary font copying):

- **Brand Crest Serif (`--font-cinzel`):** `Cinzel` (`500`, `600`, `700`), used for the sculpted *Jayant Charter* brand emblem in the header, footer, altimeter preloader, and the high-contrast outlined cabin-window centerpiece (deep espresso ink `#181413` with luminous warm ivory outer stroke over sunlit clouds).
- **Display Expanded Sans (`--font-display`):** `Archivo` variable font (`weight: "variable"`, `axes: ["wdth"]`), styled at `font-variation-settings: "wdth" 125` with tight `-0.04em` to `-0.06em` display tracking and balanced wrapping (matching `GT America Expanded` proportions).
- **UI & Body Sans (`--font-sans`):** `Plus Jakarta Sans` (weights `400`, `500`, `600`, `700`; `font-variant-numeric: tabular-nums` on specifications, dimensions, and the live Dubai clock).

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

- **Opening Photographic Cabin Window, Altimeter & Zoom-Through (`JeskoOpeningHero`, `FlightAltimeterRail`):** Symmetric left/right aviation altimeter preloader (`0 → FL410`, ~0.9s once per session, skipped under reduced motion) lifting straight into our real photographed espresso-suede cabin bulkhead (`jesko-cabin-window-photo.webp`, feathered transparent glass cutout) and real photographed woven pleated shade (`jesko-window-shade-photo.webp`) with interactive handle tug, subtle curved-glass reflection sheen, desktop mouse-parallax depth (cabin wall vs. mirror-tiled 48s drifting clouds), mobile contrast scrim (`--jc-mobile-hero-scrim`), desktop `230svh` scroll-scrubbed zoom-through (`scale 1 → 6.8` centered at `50% 49.5%`), and a whisper-thin `xl+` vertical flight-level progress rail (`FL450 → INTL`).
- **Cloud Philosophy (`JeskoCloudPhilosophy`):** Scroll-scrubbed word-highlight statement (`0.18 → 1.0`) and blur-to-sharp 2×2 founder pillars handing off smoothly into warm cream.
- **Overhead Live 3D Planform & X-Ray Scanline Blueprint Wipe (`JeskoPlanformBlueprint`):** Pinned `320svh` warm architectural stone-to-cream studio framing our real-time overhead 3D Hawker 4000 (`90deg 14deg`, single active `<model-viewer>` context on `/`), hairline metrics (`21.08 m / 18.82 m / 6.02 m`), and dual opposing `clip-path` X-ray wipe with a traveling scanline hairline into our true-alpha Swiss CAD blueprint (plus manual `Scroll wipe | 3D Exterior | Blueprint` controls).
- **Global 3D Globe Finale & Animated 404 (`JeskoGlobalGlobe`, `NotFoundFlight`):** Feathered vertical looping city wheel with live lat/lng coordinates and click-to-fly camera orientation (`globe.pointOfView`) above a rising `Global` wordmark and lazy-mounted `Globe.gl` 3D Earth (`world-atlas` Natural Earth polygons + animated corridor arcs + cursor-following `--mask-x` radial spotlight); animated top-down aircraft `404` flight page over giant translucent stacked numerals.
- **Persistent Navigation, Magnetic Pill & Global Callback Drawer (`SiteHeader`, `CallbackDrawerProvider`, `PageTransition`):** Dynamic `[data-nav-theme]` dark/light header with dual-layer roll links and live Dubai (`Asia/Dubai`) clock; magnetic floating pill CTA (`power4.out` / `elastic.out`) opening the global slide-up `ProgressiveInquiryForm` drawer from any route and auto-hiding cleanly over `#inspect-aircraft`, `#inquire`, and when open.
- **Smooth Scroll & Reduced Motion:** Lenis active on desktop fine-pointer environments only; `prefers-reduced-motion: reduce` disables Lenis, shade/zoom scrub, marquee motion, and globe auto-rotation while preserving the complete visual story and explicit manual 3D inspection.
- **Digital Jets 3D Showroom (`/aircraft`, `/aircraft/[slug]`):** Poster-first always; reusable scene configs in `content/scenes.json`; desktop (`0.70–1.39 MiB`, ≤ 6 MB) & mobile (`0.61–1.24 MiB`, ≤ 3 MB) versioned GLB tiers; *Twilight hangar*, *Daylight apron*, *Evening silhouette* studio modes; explicit mobile 3D toggle (`touch-action="pan-y"`); 10s timeout & WebGL context-loss fallback; race-safe configuration switching; edge-to-edge Parked ↔ Boarding airstair comparison slider.

---

## 6. Aircraft Asset Identity & Provenance

- **Hawker 4000 (`hawker-4000`):** Derived exclusively from `models/hawker-4000-realistic/` (high T-tail, pearl white/Atlantic blue/champagne livery, `HAWKER 4000` lettering). Configurations: *In Flight*, *Parked*, *Boarding* (shallow display vestibule; never claimed as a full cabin).
- **Dassault Falcon 2000 Classic (`falcon-2000-classic`):** Derived from `models/falcon-2000/` (original Classic with CFE738-style nacelles, clean wing tips, nine windows per side). Never renamed EX, LX, or LXS. Configurations: *In Flight*, *Parked*.
- **Licenses retained:** Google `model-viewer` v4.1.0 (Apache-2.0), ambientCG material maps (CC0 1.0), Poly Haven `Studio Small 09` HDR environment (CC0 1.0).
