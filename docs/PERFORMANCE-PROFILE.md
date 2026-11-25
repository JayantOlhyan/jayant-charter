# 3D Asset & Performance Profile (Milestone B)

Measured locally on 25 November 2026 after running `npm run optimize:assets` (`@gltf-transform/cli`: `dedup`, `instance`, `palette`, `flatten`, `join`, `weld`, `prune`, `sparse`, WebP texture compression, Meshopt compression) and `scripts/downsample-hdr.mjs`.

## GLB Transfer Budgets vs. PRD Section 17.2 Targets

| Aircraft Configuration | Raw Source (MiB) | Optimized Desktop (MiB) | Desktop Target (≤ 6 MB) | Optimized Mobile (MiB) | Mobile Target (≤ 3 MB) | Reduction |
|---|---:|---:|:---:|---:|:---:|---:|
| Hawker 4000 — In Flight | 5.74 | **0.99** | PASS | **0.88** | PASS | -83% / -85% |
| Hawker 4000 — Parked | 7.82 | **1.34** | PASS | **1.19** | PASS | -83% / -85% |
| Hawker 4000 — Boarding | 8.12 | **1.39** | PASS | **1.24** | PASS | -83% / -85% |
| Falcon 2000 Classic — In Flight | 4.56 | **0.70** | PASS | **0.61** | PASS | -85% / -87% |
| Falcon 2000 Classic — Parked | 6.69 | **0.94** | PASS | **0.84** | PASS | -86% / -87% |

- **Desktop fidelity:** Built with `--simplify false` so all 3D aircraft lettering (`HAWKER 4000`, `FALCON 2000`, `DASSAULT`), fan blades, landing gear hardware, and airstair treads retain full source geometry.
- **Studio IBL Environment (`studio-env.hdr`):** Downsampled from `1024×512` (1.5 MiB) to `512×256` (**512 KB raw / 319 KB gzipped**), well under the 1 MB PRD target.
- **Hero Poster (`hawker-4000-hero.webp`):** 59.2 KB transparent WebP (`1866×749`) paired with the 9.7 KB twilight sky horizon plate (`hero-sky-plate.webp`) — **68.9 KB total above-the-fold hero imagery**, with `fetchPriority="high"` and explicit dimensions (`CLS = 0`).
- **Editorial Service Stills:** `group-charter-apron.webp` (50.7 KB), `helicopter-arrival.webp` (111.0 KB), `falcon-2000-hero.webp` (29.9 KB), `og-default.jpg` (47.1 KB).
- **3D Runtime Decision (D11):** Single pinned self-hosted `model-viewer` v4.1.0 runtime loaded dynamically on demand (0 KB in base page JS bundle). No second 3D runtime is shipped.
