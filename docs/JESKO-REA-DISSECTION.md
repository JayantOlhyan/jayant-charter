# REA Reverse-Engineering Dissection: Jesko Jets (`https://jeskojets.com/`)

**Inspection Date:** 26 November 2026  
**Method:** Passive Chrome DevTools Protocol observation & static web bundle analysis via REA (`list_browser_targets`, `inspect_web_page`, `analyze_web_bundle`) + direct inspection of observed public page HTML/CSS/Slater bundle.

## Evidence Ledger

| Evidence ID | Tool | Scope & Confidence | Limitations |
|---|---|---|---|
| `ev_0dad8e9d3f4291280f6aa1aebe5f1c22f698e1a315adf4c2f07facdc71c46a15` | `list_browser_targets` | Observed target `41877FB176455069C4A5BC98ED2DC454` (`https://jeskojets.com/`) | Single page target on loopback CDP. |
| `ev_c6eb37c61e17403b857e4c2cedcfc384f542ea17db0da29bb4674d7c045fd97a` | `inspect_web_page` | Observed same-origin DOM & anchor routes (`#hero`, `#about`, `#flight`, `#benefits`, `#global`, `/ru`) | Third-party scripts/assets filtered before origin allowlist. |
| `ev_9bce3e34da71d6053509ffd762ba0138056c725eb2a3bf5517cf26747ca03776` | `inspect_web_page` (full origin allowlist) | Observed 14 runtime scripts and 39 CDN resources across Webflow, jsDelivr, CloudFront, unpkg, R2, and Slater | Passive observation; no JS evaluated by REA; attach-window limited. |
| `ev_03e8645972a8fefcced26894cf71a578b0d540d169818e436b2e8e2283088fae` | `analyze_web_bundle` (full origin allowlist) | Observed & statically parsed all 14 JS chunks including custom `45776.js` (`32,949` bytes) | Static AST/source inspection; does not prove every code branch executed. |

---

## 1. Key Finding: Zero Rendered `<video>` Elements

- **Observed:** `https://pub-0b16d9d13b1345e190ead530877e618a.r2.dev/og.mp4` is referenced only in page metadata (OpenGraph video). The live visual experience renders **zero `<video>` tags**.
- **Observed Visual Engine:**
  - Smooth scroll: `lenis@1.2.3` (`duration: 1.2`, exponential easing `1 - 2^(-10t)`, `smoothTouch: false`)
  - Motion & scroll: `gsap@3.13.0` + `ScrollTrigger` + `CustomEase` + `SplitText`
  - Page transitions: `@barba/core` (`0.6s` cross-fade + ScrollTrigger teardown/refresh)
  - 3D Globe: `globe.gl` (`1.88 MB` bundle, Three.js sphere + 10 animated curved flight arcs)
  - Micro-icons: `lottie-web@5.12.2` (`ico_scroll.json` + footer agency mark)
  - Custom choreography: `https://assets.slater.app/slater/16759/45776.js?v=31597` (`32.9 KB`, 18 subsystem initializers)
  - Typography: `GT America Expanded` (500 display, tight `-0.08em` tracking, `84.6%` line-height) + `GT America Extended` (500/700 UI & body)
  - Palette: `#312726` → `#000000` dark espresso gradient, `#015AA9` → `#8FC2D7` → `#FFF8ED` multi-stop sky gradient, `#7A716E` → `#FFF8ED` stone-to-cream gradient.

## 2. Exact Custom Easing Vocabulary (`CustomEase`)

- `InOut`: `0.76, 0, 0.24, 1`
- `Out`: `0.25, 1, 0.5, 1`
- `In`: `0.5, 0, 0.75, 0`
- `ease`: `0.25, 0.1, 0.25, 1`
- `Write`: `0.333, 0, 0.667, 1`

## 3. Complete Scene-by-Scene Mechanical Breakdown (Observed in `45776.js` + Inline CSS)

1. **Opening Preloader & Cabin Window Shade Lift (`initPreloader`, `initPreloaderAnimation`, `initPreloaderWindow`):**
   - Duration: `3s` on first session visit (`sessionStorage.getItem("hasVisited")`), `1s` on repeat visit.
   - Preloader lines blur in (`filter: blur(36px) → 0px`, `1s`, `stagger: 0.08`, `Out`) then blur out while `.preloader_bg` wipes via CSS `mask-image` (`--mask-y: 0% → 200%`, `1.2s`).
   - Simultaneously, `[preloader-window-c]` (cabin window blind) slides up (`yPercent: 0 → -92`, `scaleY: 1 → 0.5`, `1.2s`, `InOut`), the shade handle `[preloader-knob-c]` lifts (`0 → -92`), second knob fades in, and cabin darkness overlay `[preloader-front-over]` fades `1 → 0`.
2. **Hero Window Zoom-Through & Infinite Cloud Marquee (`initAllParallax`, `.sky-bg_hero_clouds_list`):**
   - `.link-logo` starts inside the cabin window (`y: 44vh, scale: 1.25`) and scrubs up to `y: 0vh, scale: 1` across `.hero_scroll-area`.
   - On scroll through `.hero_scroll-area`: `.hero-w_bg` scales `1 → 6.5` (`xPercent: 0 → -2`), `.hero-s` scales `1 → 8`, `[hero-s_left]` sweeps `0vw → -50vw`, `[hero-s_right]` sweeps `0vw → +50vw` — flying through the oval cabin window into open sky.
   - `.sky-bg_hero` drifts `0vh → 100vh`; `.sky-bg_hero_clouds_list` runs a seamless 48-second CSS `@keyframes marquee` (`translateX(-50%) → translateX(0%)`).
3. **Cloud Philosophy & Character Scrub Highlight (`initHighlightText`, `initScrollElementsReveal`):**
   - `.about-s` glides `y: -50vh → -200vh` over the multi-stop eased sky gradient.
   - `[data-highlight-text]` splits into characters and scrubs `opacity: 0.15 → 1` (`stagger: 0.04`) from `top 75%` to `bottom 75%`.
   - `[data-line-reveal]` / `[data-div-reveal]` enter from `filter: blur(36px), opacity: 0 → blur(0px), opacity: 1` (`1s`, `stagger: 0.1`).
4. **Overhead Aircraft Descent & Blueprint X-Ray Mask Wipe (`.jet_scroll-area`):**
   - `.light-bg` fades `0 → 1`.
   - `.jet` scales `1 → 0.4` (`yPercent: 0 → -15`, `scrub: 1.2`, `In`) while `.jet-w, .spec-w` travel `yPercent: 0 → 100`.
   - From `85% bottom` to `bottom bottom`, `.img-jet` shrinks its CSS mask (`--mask-size: 100% 150% → 100% 0%`) while `.blueprint` underneath expands (`--mask-size: 100% 0% → 100% 150%`, `--mask-y: 200% → 50%`), morphing exterior photo into technical floorplan.
5. **Synced Benefits Accordion + Counter-Parallax Image Reveal (`initBenefitsAccordion`):**
   - Expanding a row increments stacking `zIndex`, slides `.imgW` `yPercent: 100 → 0` while counter-gliding `.img` (`yPercent: -50 → 0, scale: 2 → 1`, `1s`, `Out`), rotates the `+` icon `0° → 90°`, and blur-reveals description lines.
6. **Infinite Looping City Wheel + Cursor-Lit 3D Globe (`initLoopingWords`, `initGlobe`, `initGlobeMaskFollow`):**
   - DOM-recycling vertical city wheel (`0.6s` glide + `0.8s` dwell on desktop; horizontal on mobile) inside feathered mask `.globe-s_city_content_mask`, which wipes out (`--mask-size: 100% 0%`) into rising display text (`y: 33.333em → 0em`) and rising 3D `Globe.gl` (`yPercent: 135, scale: 2 → 0, 1`).
   - `Globe.gl` renders 10 dashed animated flight arcs (`arcDashLength: 0.6`, `arcDashGap: 0.2`, `arcDashAnimateTime: 8000`, `autoRotateSpeed: 2`), wrapped in `.globe` whose radial CSS mask tracks horizontal mouse movement (`--mask-x: 50% + 75*(0.5 - x/w)`, `2.4s`, `Out`).
7. **Micro-Interactions (`initMagneticEffect`, `initBtnCtaHover`, `initLinkHover`, `initPopups`, `initThemeChange`, `initCurrentTime`, `initFavicon`):**
   - Magnetic buttons follow pointer (`power4.out`, `1.6s`) and snap back (`elastic.out(1, 0.3)`).
   - Floating bottom pill performs character-stagger vertical roll (`0.01s` stagger) + diagonal plane takeoff (`xPercent: 150, yPercent: -75`), lifts upward (`-16.632em`) into the globe closing band, and morphs into a close trigger when opening the slide-up booking drawer (`yPercent: 110 → 0`, `1s`, `Out`).
   - Dynamic header theme (`theme_on-color` / `theme_on-light`), live `Asia/Dubai` clock (`HH:MM`), and background-tab animated favicon.

## 4. Reconstruction Boundary (Original Assets & Honest Brand Identity)

- Every interaction mechanic, easing curve, scroll formula, CSS mask wipe, magnetic physics, slide-up drawer, and 3D globe architecture can be reconstructed cleanly as original Jayant Charter TypeScript/React/GSAP code.
- Jesko Jets' proprietary graphics, logo, G650ER photos, third-party `GT America` font binaries, agency credits, and business claims (`5,000 missions`, `174 countries`) are **not** copied; all imagery, fonts, 3D aircraft (`Hawker 4000`, `Falcon 2000 Classic`), and copy remain 100% original and honest to **Jayant Charter**.
