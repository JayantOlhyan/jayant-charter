# Third-Party Asset & Runtime Licenses

This repository preserves required license and provenance records for all public visual and 3D assets.

| Asset / Component | Source | License | Public Location | Notes |
|---|---|---|---|---|
| Google `model-viewer` v4.1.0 | `models/hawker-4000-realistic/model-viewer.min.js` | Apache-2.0 (`public/vendor/MODEL-VIEWER-LICENSE.txt`) | `/vendor/model-viewer.min.js` | Pinned self-hosted runtime |
| `meshoptimizer` Meshopt WASM Decoder | `meshoptimizer` npm package | MIT (`public/vendor/MESHOPT-LICENSE.md`) | `/vendor/meshopt_decoder.js` | Self-hosted same-origin Meshopt GLB decoder (29 KB) |
| `Studio Small 09` HDR environment | Poly Haven (Sergej Majboroda) | CC0 1.0 | `/models/v1/studio-env.hdr` | Downsampled to 512x256 (512 KB raw / 319 KB gzip) for web IBL |
| Generic metal & rubber PBR maps | ambientCG (Lennart Demes) | CC0 1.0 | Embedded inside `/models/v1/*.glb` | Generic surface variation maps, not measured aircraft scans |
| Hawker 4000 3D & WebP renders | `models/hawker-4000-realistic/` | Original procedural project asset | `/models/v1/hawker-4000-*.glb`, `/media/v1/hawker-4000-*.webp` | Photo-referenced high T-tail exterior study; approximate geometry |
| Falcon 2000 Classic 3D & WebP renders | `models/falcon-2000/` | Original procedural project asset | `/models/v1/falcon-2000-*.glb`, `/media/v1/falcon-2000-*.webp` | Original Classic exterior (CFE738-style nacelles, clean wing tips) |
| Atmospheric & Editorial Stills | Project visual production | Proprietary generated illustrative media | `/media/v1/hero-sky-plate.webp`, `helicopter-arrival.webp`, `group-charter-apron.webp` | Replaceable slots for future licensed photography |

Original `.blend` source files, reference photographs, and handoff ZIPs are intentionally excluded from this web repository and from `public/`.
