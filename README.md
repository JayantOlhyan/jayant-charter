# Jayant Charter — Private Aviation Portfolio & Inquiry Platform

Founder-led private aviation web application for **Jayant Charter**, presenting private jets, group charters, and helicopters around custom itineraries with poster-first interactive 3D aircraft exploration and durable, Jayant-owned inquiry intake.

Built to **Portfolio Website PRD v1.1** (`25 November 2026`) and the canonical [DESIGN.md](./DESIGN.md), pairing Jesko Jets-inspired atmospheric scroll pacing with Digital Jets-style studio aircraft inspection inside Jayant Charter's Deep Teal, Ivory, and restrained Warm Gold design system.

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
  - Reusable 3D scene specification (`content/scenes.json`) driving the pinned desktop **Arrival → Approach** live 3D scroll transition (`-36°` three-quarter → `0°` broadside profile, bidirectional scrub, zero per-frame React re-renders, single-active-WebGL handoff to Chapter 4)
  - Digital Jets-inspired studio lighting atmosphere modes (*Twilight hangar*, *Daylight apron*, *Evening silhouette*) in `AircraftStudioViewer` and pixel-matched Before/After **Hawker 4000 ramp comparison slider** (`Parked` vs. `Boarding` airstair)
  - Jesko-inspired synced two-column **Trust & Experience** editorial split using a zero-JS-overhead CSS opacity stack (`259 kB` homepage First Load JS)
  - Automated Vitest contract/privacy/scene suite (`13/13` passing), real-browser desktop/mobile/reduced-motion live verification (`scripts/live-verify.mjs`), and repo-wide Hallmark `sloplint` (`0 FAIL` across 44 files)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript (`strict`) |
| Styling & Primitives | Tailwind CSS v4 + CSS custom properties + shadcn/ui (`@base-ui/react`) + `lucide-react` |
| Typography | `Newsreader` (optical display serif) + `Plus Jakarta Sans` (body, UI, `tabular-nums`) via `next/font/google` |
| Motion & Scroll | GSAP + ScrollTrigger + Lenis (desktop fine-pointer only; auto-disabled under reduced motion) + GPU-composited CSS transitions |
| Interactive 3D | Self-hosted pinned Google `model-viewer` v4.1.0 (Apache-2.0) + self-hosted `meshopt_decoder.js` (MIT) driven by `content/scenes.json` |
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
