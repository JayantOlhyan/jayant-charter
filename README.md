# Jayant Charter — Private Aviation Portfolio & Inquiry Platform

Founder-led private aviation web application for **Jayant Charter**, presenting private jets, group charters, and helicopters around custom itineraries with poster-first interactive 3D aircraft exploration and durable, Jayant-owned inquiry intake.

Built to **Portfolio Website PRD v1.1** (`25 November 2026`), the REA technical dissection in [docs/JESKO-REA-DISSECTION.md](./docs/JESKO-REA-DISSECTION.md), and the canonical [DESIGN.md](./DESIGN.md) — combining Jesko Jets' atmospheric opening cabin-window zoom-through, sky-to-cream scroll choreography, overhead X-ray blueprint wipe, and live 3D `Globe.gl` finale with our full multi-page architecture and interactive Digital Jets-inspired 3D aircraft showroom on `/aircraft`.

---

## Project Status & Milestone Checklist

- [x] **Milestone A — Repository, Design System & Content Foundations**
  - Next.js App Router (TypeScript strict), Tailwind CSS v4, shadcn/ui (Base UI), semantic CSS token system (`src/styles/tokens.css`), root `DESIGN.md`
  - Typed Zod content schemas (`src/content/schemas.ts`), build-time cross-reference/privacy validator (`npm run validate:content`), production bundle leakage scanner (`npm run verify:bundle`)
- [x] **Milestone B — 3D Asset Optimization & Poster-First Viewer**
  - All 5 aircraft GLBs optimized with `@gltf-transform/cli` into desktop (`0.70–1.39 MiB`, zero geometry loss on 3D lettering/hardware) and mobile (`0.61–1.24 MiB`) tiers
  - `Studio Small 09` HDR downsampled to `512×256` (`512 KB` raw / `319 KB` gzip)
  - Single-renderer `AircraftStudioViewer` with pinned `model-viewer` v4.1.0, camera presets, accessible HTML hotspots, race-safe configuration switching, 10s timeout fallback, WebGL context-loss recovery, mobile scroll safety, and reduced-motion support
- [x] **Milestone C — Public Portfolio & Expandable Templates**
  - Continuous 8-chapter homepage experience (`Arrival` → `The Approach` → `Choose the Journey` → `3D Hangar` → `Detail & Atmosphere` → `Process, Trust & Example Scenarios` → `FAQ & Inquiry` → `Closing Horizon`)
  - Dedicated pages: `/services/private-jets`, `/services/group-charter`, `/services/helicopters`, `/aircraft`, `/aircraft/hawker-4000`, `/aircraft/falcon-2000-classic`, `/about`, `/how-it-works`, `/inquire`, `/privacy`, `/terms`, custom `404`, dynamic `sitemap.xml` & `robots.txt`
  - Hidden-until-published expansion templates: `/case-studies`, `/case-studies/[slug]`, `/insights`, `/insights/[slug]`, `/destinations/[slug]`, `/charter/[slug]`
- [x] **Milestone D — Durable Inquiry Backend & Outbox**
  - `POST /api/inquiries` with Zod + `libphonenumber-js` international validation, sliding-window rate limiter, honeypot check, idempotency key + payload hash (`201`/`200`/`409`), internal duplicate flagging, atomic Drizzle/SQLite persistence (`inquiries`, `inquiry_events`, `delivery_jobs`), exponential retry outbox, PII redaction, and explicit onward-handoff consent guard
- [x] **Milestone E — Signature Scroll Choreography, Visual/A11y Audit & Release Gate**
  - Live desktop (`1440px`) and mobile (`390px`) reference audit of Jesko Jets and Digital Jets documented in [docs/REFERENCE-AUDIT.md](./docs/REFERENCE-AUDIT.md) and [docs/VISUAL-BOARD.md](./docs/VISUAL-BOARD.md)
  - Full REA reverse-engineering dissection of `https://jeskojets.com/` documented in [docs/JESKO-REA-DISSECTION.md](./docs/JESKO-REA-DISSECTION.md)
- [x] **Milestone F — REA-Faithful Jesko Multi-Page Rebuild & Digital Jets 3D Showroom**
  - **Photographic Cabin Window, Altimeter Preloader & Parallax Depth (`JeskoOpeningHero`, `FlightAltimeterRail`)**: Symmetric aviation altimeter intro climb (`0 → FL410`, once per session), real photographed dark espresso-suede cabin bulkhead & sculpted two-step bezel (`jesko-cabin-window-photo.webp`, feathered transparent glass cutout), real photographed woven accordion-pleated cabin blind with interactive brushed-titanium handle (`jesko-window-shade-photo.webp`), mirror-tiled 48-second cloud drift, desktop mouse-parallax cabin depth, scroll-scrubbed `1 → 6.8×` zoom-through, and a vertical flight-level progress rail (`FL450 → INTL`)
  - **Cloud Philosophy (`JeskoCloudPhilosophy`)**: Scroll-scrubbed word-highlight statement (`0.18 → 1.0`) and blur-to-sharp 2×2 founder pillars transitioning smoothly into warm cream (`#FFF8ED`)
  - **Live 3D Overhead Planform & X-Ray Scanline Blueprint Wipe (`JeskoPlanformBlueprint`)**: Pinned `320svh` warm architectural stone-to-cream studio framing our real-time overhead 3D Hawker 4000 (`90deg 14deg`), hairline metric sheet (`21.08 m / 18.82 m / 6.02 m`), and dual opposing `clip-path` X-ray scanline wipe into a true alpha-transparent Swiss CAD technical blueprint (`Scroll wipe | 3D Exterior | Blueprint`)
  - **Multi-Page Services Gateway, Synced Trust Accordion & Animated 404 (`HomeExperience`, `TrustEditorialSplit`, `NotFoundFlight`)**: GSAP curtain-revealed editorial links to `/services/private-jets`, `/services/group-charter`, `/services/helicopters`, flush counter-parallax accordion with sunlit cabin photography, live Dubai (`Asia/Dubai`) local clock (`lg+` header and desk strip), and Awwwards-inspired animated top-down aircraft `404` page
  - **Global 3D Globe Finale (`JeskoGlobalGlobe`)**: Feathered looping corridor wheel (`Dubai`, `Delhi NCR`, `Mumbai`, `Rajasthan`, `Goa`, `London`, `Geneva`, `Singapore`, `Zurich`, `Riyadh`) with live lat/lng telemetry and click-to-fly `Globe.gl` camera orientation over self-hosted Natural Earth polygons + animated gold flight arcs and cursor-following radial spotlight
  - **Global Magnetic Pill CTA, Sculpted Slide-Up Callback Drawer & Route Transitions (`CallbackDrawerProvider`, `ProgressiveInquiryForm`, `SiteHeader`, `PageTransition`)**: Dynamic `[data-nav-theme]` header with dual-layer roll links, live Dubai clock, magnetic floating pill (`power4.out` / `elastic.out`) with character-stagger + diagonal plane takeoff hover, and a seamless border-free slide-up `ProgressiveInquiryForm` drawer (`embedded` mode, warm elevated `.jc-field` paper inputs immune to OS dark-mode gray overrides, tactile pill selectors, flush hairline trip-details accordion, and unified `.jc-editorial-card` panels across `/inquire`, `/about`, `/aircraft/[slug]`, and `/services/[slug]`) wired to `POST /api/inquiries`
  - **Dedicated Digital Jets 3D Aircraft Showroom (`/aircraft`, `/aircraft/[slug]`)**: Full-bleed `AircraftStudioViewer` (*Twilight hangar*, *Daylight apron*, *Evening silhouette*, `In flight` / `Parked` / `Boarding`, Hawker 4000 & Falcon 2000 Classic), edge-to-edge Parked ↔ Boarding airstair comparison slider, and flush 4-panel macro CGI strip
  - Automated Vitest suite (`13/13` passing), 19-route / 7-viewport / 3D / Globe / Drawer / Mobile / Reduced-motion / E2E Playwright audit (`scripts/live-verify.mjs`, `0` console/page errors), production bundle privacy scan (`npm run verify:bundle`), and repo-wide Hallmark `sloplint` (`0 FAIL, 0 REFLEX` across 49 files)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript (`strict`) |
| Styling & Primitives | Tailwind CSS v4 + CSS custom properties + shadcn/ui (`@base-ui/react`) + `lucide-react` |
| Typography | `Cinzel` (sculpted luxury brand crest) + `Archivo` (variable-width expanded grotesque, `wdth: 125`) + `Plus Jakarta Sans` (body, UI, `tabular-nums`) via `next/font/google` |
| Motion & Scroll | GSAP + ScrollTrigger + Lenis (desktop fine-pointer only; auto-disabled under reduced motion) + GPU-composited CSS transitions |
| Interactive 3D & Globe | Self-hosted pinned Google `model-viewer` v4.1.0 (Apache-2.0) + `meshopt_decoder.js` (MIT) + `globe.gl` + `world-atlas` + `topojson-client` |
| Forms & Validation | `react-hook-form` + `zod` + `libphonenumber-js` |
| Durable Storage | Drizzle ORM + SQLite (`better-sqlite3`, WAL mode; Postgres-ready adapter seam) |
| Testing | Vitest + Playwright visual/a11y verification |

---

## Local Setup & Commands

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template (optional; sensible local defaults work out of the box)
cp .env.example .env.local

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Verification & Utility Scripts

```bash
npm run typecheck         # TypeScript strict check (tsc --noEmit)
npm run lint              # ESLint check
npm test                  # Vitest backend, idempotency, handoff & content privacy tests
npm run validate:content  # Validate content/*.json schemas, cross-refs & zero-leak rules
npm run build             # Full pipeline: validate:content -> next build -> verify:bundle
npm run optimize:assets   # Regenerate optimized desktop/mobile GLBs & WebP renders from source kits
```

---

## Configuration & Publishing Content

- **Site Settings & Feature Flags:** Edit `content/site-settings.json` to configure the public brand name, legal entity notice, verified contact channels, staffed response hours, and independent rollback flags (`enableLive3D`, `enableIntake`, `enableSmoothScroll`, `showPreviewBanner`).
- **Publishing Approved Case Studies or New Aircraft:** Add validated JSON records under `content/` (see [docs/OPERATIONS.md](./docs/OPERATIONS.md)). Empty collections stay hidden from navigation, homepage, and `sitemap.xml` until approved `status: "published"` records exist.
- **Asset Licensing, Reference Audit & Performance Profile:** See [docs/REFERENCE-AUDIT.md](./docs/REFERENCE-AUDIT.md), [docs/VISUAL-BOARD.md](./docs/VISUAL-BOARD.md), [docs/ASSET-LICENSES.md](./docs/ASSET-LICENSES.md), [docs/PERFORMANCE-PROFILE.md](./docs/PERFORMANCE-PROFILE.md), and [docs/ACCEPTANCE-MATRIX.md](./docs/ACCEPTANCE-MATRIX.md).

---

## Pre-Launch Owner Checklist (Before Live Public Traffic)

1. Confirm final legal entity name and jurisdiction notice (`content/site-settings.json`, `/privacy`, `/terms`).
2. Supply verified live receiving channel (`OWNER_NOTIFICATION_WEBHOOK_URL` / email / WhatsApp) and set `showPreviewBanner: false`.
3. Set `NEXT_PUBLIC_SITE_URL` and `SITE_INDEXABLE="true"` in production environment variables.
4. Optionally add real founder portrait/biography (`/about`) and approved anonymized case studies (`content/case-studies.json`).
