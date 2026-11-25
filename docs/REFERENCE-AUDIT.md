# Primary Reference Live Inspection Audit

**Inspection Date:** 25 November 2026  
**Method:** Live interactive browser inspection across desktop (`~1440×900`) and mobile (`390×844`) viewports, full scroll traversal, and read-only DOM/network inspection.

---

## 1. Jesko Jets (`https://jeskojets.com/`)

### Observed Rendering & Engineering Architecture
- **No `<video>` tags and no frame-by-frame image sequences** (`1 <canvas>`, `0 <video>`, `24 <img>`, `32 <svg>`).
- **Motion stack:** Lenis smooth scroll + GSAP (`ScrollTrigger`, `SplitText`, `CustomEase`) + layered `.webp`/`.avif` imagery + CSS custom-property mask wipes (`--mask-y`, `--mask-size`) + subtle CSS `@keyframes` ambient cloud drift (`48s linear infinite`).
- **Single purposeful WebGL canvas:** One `Globe.gl` canvas in the closing chapter; all earlier aircraft and atmospheric transitions rely on GPU-composited transforms and masks rather than piling multiple WebGL scenes onto the page.

### Strengths Translated to Jayant Charter (Original Compositions)
1. **Continuous multi-stop atmospheric tonal transitions:** Instead of abrupt horizontal seams between dark and light bands, Jesko uses eased multi-stop gradients bridging sky, stone, ivory, and dark closing chapters.
2. **Scroll-scrubbed editorial typography reveal:** Large typographic manifesto where leading lines clarify in crisp ink while trailing lines stay muted and illuminate as the reader scrolls.
3. **Aircraft at monumental compositional scale:** The aircraft is treated as a primary architectural anchor with deliberate display typography and generous negative space around it.
4. **Synced interactive editorial accordion + imagery split:** Clean horizontal-rule expandable rows (`+`/`-`) paired with a large synchronized visual frame rather than generic 3-box icon cards.
5. **Restrained navigation & persistent callback accessibility:** Compact top navigation paired with a persistent, low-friction primary inquiry path.

### Observed Weaknesses We Deliberately Avoid
- **Transparent header collision:** Jesko's completely transparent fixed header causes scrolled oversized typography and mobile specs to pass directly behind and collide with the wordmark and nav links. **Our fix:** Translucent Deep Teal backdrop blur + subtle hairline border keeps nav legible at every scroll position.
- **Mobile aircraft-over-text overlap:** On `390px` mobile, Jesko's centered G650ER aircraft nose directly overlapped body paragraphs mid-scroll, and its 2×2 pillars row clipped horizontally. **Our fix:** Dedicated mobile art direction keeping text and aircraft on separate non-overlapping vertical planes with `0px` horizontal overflow (`320px–1920px`).
- **Heavy unoptimized hero preloader & invented-scale claims:** Jesko uses large `10,000px+` scaled window zooms and claims `"5K+ flights"` / `"174 countries"`. **Our fix:** Immediate `68.9 KB` LCP hero poster with zero preloader gate, and 100% honest founder-led positioning with zero invented metrics.

### Inaccessible / Unverified Items on Jesko Jets
- Initial `load` event exceeded 10s on external CDN scripts (`assets.slater.app` reported status `0`), and two responsive knob `srcset` requests aborted on mobile reload; full visual and DOM inspection completed cleanly after `domcontentloaded` settle.

---

## 2. Digital Jets (`https://www.digital-jets.com/products`)

### Observed Rendering & Engineering Architecture
- **No real-time WebGL 3D exterior aircraft meshes found on `/products`.**
- **Exterior & Cutaway Spins:** Sirv 360° pre-rendered JPEG image sequences (`fishinpocketstudio.sirv.com`) painted onto 2D `<canvas>` elements with `Drag to spin` and fullscreen triggers.
- **Before / After Split Comparison Sliders (`⇄`):** Interactive draggable vertical wipe overlaying perfectly aligned static renders (e.g., Daytime vs. Night cabin lighting; Exterior vs. Cutaway).
- **Air-to-Air & Detail Presentation:** Crisp studio/high-altitude imagery combining high-contrast cloudscapes, tight macro hardware framing, and clean horizontal-rule `Features & Options` accordions.

### Strengths Translated to Jayant Charter (Elevated With Real-Time 3D)
1. **True real-time WebGL exterior exploration (exceeding 2D JPEG spins):** Our photo-referenced `Hawker 4000` (3 configs) and `Dassault Falcon 2000 Classic` (2 configs) run as real-time PBR `model-viewer` scenes (`0.70–1.39 MiB` Meshopt GLBs) with bounded orbit, zoom, presets, and HTML hotspots.
2. **Studio Lighting Atmosphere Modes (Daylight Apron / Twilight Hangar / High-Altitude):** Translates Digital Jets' lighting presentation cleanly to our real-time PBR stage using our downsampled `studio-env.hdr` (`319 KB` gzip) and calibrated exposure/backdrop presets.
3. **Interactive Before / After Configuration Comparison Slider (`⇄`):** Uses our camera-matched `hawker-4000-parked.webp` (`1025×528`) and `hawker-4000-boarding.webp` (`1025×535`) renders so visitors can smoothly drag (or use keyboard arrow keys) across the fuselage to reveal the deployed forward airstair and vestibule—working even with WebGL disabled.
4. **Full-bleed Digital Jets macro gallery:** Larger, calmer, border-restrained studio close-ups of nacelles, entry hardware, and landing gear with crisp engineering captions.

### Observed Weaknesses / Inaccessible Elements on Digital Jets
- **Cross-origin `3DVista` Digital Tour iframe (`magellanpz.b-cdn.net`):** Cross-origin DOM inaccessible; rendered dark-navy/blank with console warning `Permissions policy violation: xr-spatial-tracking is not allowed`.
- **Broken Web Viewer tab icons (`narc-is.co.uk/.../menu-*.png`):** Failed to load, leaving broken image placeholders and wrapped text.
- **Mobile horizontal layout drift:** Bottom Web Viewer expanded page width past `390px` on mobile.
- **Audience prompts:** Digital Jets' broker/operator accordion is B2B visualization marketing, not a traveler inquiry flow—our inquiry stays focused on Jayant Charter's traveler & arranger journey.
