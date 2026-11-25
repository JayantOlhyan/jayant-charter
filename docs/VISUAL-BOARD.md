# Jayant Charter — Desktop & Mobile Visual Board & Scroll Architecture

**Updated:** 25 November 2026 (Post-Reference Inspection Revision 2.0)

---

## 1. Typography Evaluation (PRD §14.1 & §15.5)

- **Evaluated baseline (`Georgia` + system sans):** Clean legibility, but lacks the optical crispness, refined stroke modulation, and monumental luxury scale seen across Jesko Jets and manufacturer aviation houses (Dassault Falcon, Gulfstream) at `56px–88px`.
- **Finalized pairing (Documented in `DESIGN.md`):**
  - **Display (`--font-display`):** `Newsreader` (Google Fonts, SIL Open Font License, self-hosted via `next/font/google`, weights `400` and `500`, optical sizing enabled, `display: swap`). Delivers restrained editorial authority with zero hairline dropout on `#102B2A` Deep Teal.
  - **UI, Specs & Body (`--font-sans`):** `Plus Jakarta Sans` (Google Fonts, SIL Open Font License, self-hosted via `next/font/google`, weights `400`, `500`, `600`, `font-variant-numeric: tabular-nums`).

---

## 2. Continuous Tonal & Scroll Choreography Map

Instead of abrupt stacked rectangles, the homepage glides through a continuous multi-stop atmospheric sequence anchored by one cohesive aircraft story:

| Chapter | Desktop Composition (`1440×900`) | Mobile Composition (`390×844`) | Tonal Surface | Motion / 3D Owner |
|---|---|---|---|---|
| **1. Arrival → 2. Approach** (Continuous Unified Stage) | **Pinned 2-beat continuous stage (`210svh` bounded track):** Beat 1 (*Arrival*) opens with immediate `hawker-4000-hero.webp` poster (`59 KB`) over twilight sky + gentle ambient cloud drift, upgrading seamlessly to live `<model-viewer>` at identical `-36deg 76deg 76%` framing. Scrolling into Beat 2 (*Approach*) smoothly scrubs the **exact same live 3D aircraft** from 3/4 climb into a crisp **side profile (`-90deg 84deg 80%`)** on the right half while the sky eases into deep-teal-to-mist twilight and Jayant's scroll-illuminated manifesto appears cleanly on the left (zero text/aircraft collision). | **Intentional unpinned vertical flow:** Crisp hero headline + 1 sentence + CTAs + Hawker 4000 above the fold (`390×844`), flowing into a compact Approach editorial statement paired with the low-angle profile render (`hawker-4000-low-angle.webp`). Zero pinned scroll traps; native vertical touch scroll preserved. | `#0A1D1C` → `#102B2A` → multi-stop eased twilight mist → `#F7F5ED` Ivory | Single `ArrivalApproachStage` ScrollTrigger controller (pauses offscreen/hidden tab; collapses to static composition under `prefers-reduced-motion`). |
| **3. Choose the Journey** | Multi-stop transition into warm Ivory (`#F7F5ED`). Three full-width editorial spreads with alternating visual mass: **Private jets** (Falcon 2000 Classic studio spread), **Group charter** (Twilight large-cabin FBO apron photo, supporting 22+ guest planning without claiming Hawker/Falcon as 22-pax), **Helicopters** (Udaipur terrace twilight helicopter arrival photo, party size & engine preference). | Single-column editorial spreads with 16:10 full-bleed imagery above copy and `≥ 48px` full-width buttons. | `#F7F5ED` Ivory + `#EEECE2` Stone accents | Scroll-linked subtle editorial rhythm (no identical fade-in cards). |
| **4. Aircraft Exploration (Engineered Peak)** | Deep Teal (`#102B2A`) full-width studio hangar housing **one single `<model-viewer>` renderer** (mounted only when Arrival→Approach is out of view so two active WebGL contexts never compete). Includes **Hawker 4000** (*In Flight / Parked / Boarding*) & **Falcon 2000 Classic** (*In Flight / Parked*), **Studio Lighting Switcher** (*Twilight Hangar / Daylight Apron / Dusk*), camera presets, accessible HTML hotspots, and contextual callback action. | Poster-first (`hawker-4000-hero.webp`) with explicit **Explore in 3D (0.88 MB)** trigger and **Rotate 3D / Done rotating** scroll-safety toggle. | `#102B2A` Deep Teal studio (adaptable to Daylight Stone studio when toggled) | Exclusive user orbit ownership; pauses any ambient motion on pointer down. |
| **5. Detail & Atmosphere** | Warm Stone (`#EEECE2`) full-bleed craftsmanship chapter: opens with **Digital Jets-inspired Interactive Before/After Ramp Comparison Slider** (drag or arrow-key wipe comparing camera-matched `Parked` vs. `Boarding` airstair deployment on the Hawker 4000), followed by spacious full-bleed studio macro renders (`engine`, `entry`, `gear`, `falcon-engine`). | Full-width touch-friendly split slider (`input[type="range"]` accessible) + clean stacked macro plates. | `#EEECE2` Warm Stone → `#FBF9F3` Paper plates | Tactile interactive comparison wipe + gentle differential macro framing. |
| **6. Trust, Experience & Example Scenarios** | Warm Ivory (`#F7F5ED`) **Jesko-inspired 2-column synced editorial split**: left side holds interactive horizontal-rule accordion rows explaining Jayant's role, 3-step process, privacy consent, and licensed carrier transparency; right side displays a synchronized large editorial visual frame that crossfades smoothly with the active row. Followed by Deep Teal **Example Trip Scenarios** (clearly marked illustrative) + conditional hidden-until-published `CaseStudyGrid`. | Inline single-column expandable rows with contextual notes; clean stacked scenario ledger. | `#F7F5ED` Ivory + `#102B2A` Deep Teal ledger | Discrete state crossfade (`motion/react`), zero decorative clutter. |
| **7. FAQ & Inquiry** | Zero decorative motion. Calm Ivory FAQ accordion flowing into Warm Stone progressive **Request a callback** form (3 required fields: Name, Phone, Permission + expandable service-aware itinerary details). | Full-width `48px+` inputs, native tel/date/numeric keyboards, zero sticky overlap. | `#F7F5ED` Ivory → `#EEECE2` Stone | Static task focus. |
| **8. Closing Horizon** | Considered Deep Teal horizon band pairing final poised Falcon 2000 Classic silhouette with direct callback & exploration actions, resolving cleanly into the architectural footer mast without requiring replay. | Clean stacked close and accessible footer links. | `#102B2A` → `#0A1D1C` Deep Teal | Resolved static horizon. |

---

## 3. Single-Scene Camera Keyframe Contract (`content/scenes.json`)

| Scene ID | Aircraft | Keyframe 0 (`progress = 0.0`, Arrival) | Keyframe 1 (`progress = 1.0`, Approach) | Bounds & Policy |
|---|---|---|---|---|
| `home-arrival-approach` | `hawker-4000` (`flight`) | Orbit `-36deg 76deg 76%`, Target `auto auto auto`, FOV `30deg` (matches `hawker-4000-hero.webp` poster) | Orbit `-88deg 84deg 84%`, Target `0m 2.4m 0m`, FOV `28deg` (clean side profile, clear of left copy) | Desktop capable + non-reduced-motion only; auto-pauses offscreen and on hidden tab; instant static poster parity on mobile/reduced-motion/fallback. |
| `hangar-explorer` | `hawker-4000` / `falcon-2000-classic` | User-driven presets + 3 lighting atmospheres (`twilight`, `daylight`, `dusk`) | User-owned orbit, zoom, config switch | Single active `<model-viewer>`, 10s timeout, WebGL context-loss fallback, race-safe request tokens. |
