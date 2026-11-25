"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AircraftRecord, MediaAsset, SceneRecord } from "@/content/schemas";
import type { ModelViewerElement } from "@/types/model-viewer";
import {
  detectViewerCapability,
  ensureModelViewerLoaded,
} from "@/features/aircraft/model-viewer-loader";
import { trackSafeEvent } from "@/lib/analytics";

gsap.registerPlugin(ScrollTrigger);

interface ArrivalApproachStageProps {
  scene: SceneRecord;
  aircraft: AircraftRecord;
  skyPlate: MediaAsset;
  heroPoster: MediaAsset;
  approachPoster: MediaAsset;
  enableLive3D: boolean;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const PHILOSOPHY_PILLARS = [
  {
    title: "Direct first contact",
    body: "Every itinerary begins with one calm conversation with Jayant before feasibility checks start.",
  },
  {
    title: "Custom global routes",
    body: "Tailored departures worldwide, with active focus across Dubai, Delhi NCR, Mumbai, Rajasthan, and Goa.",
  },
  {
    title: "Verified before quoting",
    body: "Range under actual load, runway performance, and licensed operator authority confirmed per trip.",
  },
  {
    title: "Discreet by default",
    body: "Your details stay with Jayant first; onward sharing happens only after explicit permission.",
  },
];

export function ArrivalApproachStage({
  scene,
  aircraft,
  skyPlate,
  heroPoster,
  approachPoster,
  enableLive3D,
}: ArrivalApproachStageProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const mvRef = useRef<ModelViewerElement | null>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const cloudsVeilRef = useRef<HTMLDivElement>(null);
  const stoneBackdropRef = useRef<HTMLDivElement>(null);
  const darkScrimRef = useRef<HTMLDivElement>(null);
  const arrivalCopyRef = useRef<HTMLDivElement>(null);
  const cloudsCopyRef = useRef<HTMLDivElement>(null);
  const planformCopyRef = useRef<HTMLDivElement>(null);
  const pillarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const jetWrapRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const beatRef = useRef<number>(0);

  const [useInteractivePin, setUseInteractivePin] = useState<boolean>(false);
  const [stageInView, setStageInView] = useState<boolean>(true);
  const [shouldMount3D, setShouldMount3D] = useState<boolean>(false);
  const [live3DReady, setLive3DReady] = useState<boolean>(false);
  const [activeBeat, setActiveBeat] = useState<number>(0);

  const flightConfig =
    aircraft.configurations.find((c) => c.id === scene.configurationId) ||
    aircraft.configurations[0];
  const heroLighting = scene.lightingModes[0] || {
    exposure: 1.28,
    shadowIntensity: 0,
    shadowSoftness: 0.85,
  };
  const planformKeyframe = useMemo(
    () =>
      scene.keyframes.planform || {
        thetaDeg: 90,
        phiDeg: 14,
        radiusPct: 94,
        fieldOfViewDeg: 29,
      },
    [scene.keyframes.planform]
  );

  // Decide desktop pinned 3-beat cinema vs clean unpinned mobile/reduced-motion layout
  useEffect(() => {
    const cap = detectViewerCapability();
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const allowPin = isDesktop && !cap.prefersReducedMotion;
    setUseInteractivePin(allowPin);

    if (
      allowPin &&
      enableLive3D &&
      cap.shouldAutoLoad &&
      scene.qualityPolicy.desktopAutoUpgrade
    ) {
      let cancelled = false;
      ensureModelViewerLoaded()
        .then(() => {
          if (!cancelled) {
            setShouldMount3D(true);
            trackSafeEvent({
              name: "viewer_requested",
              sceneId: scene.id,
              qualityTier: "desktop",
              trigger: "auto",
            });
          }
        })
        .catch(() => {
          // Poster fallback remains cleanly active
        });
      return () => {
        cancelled = true;
      };
    }
  }, [enableLive3D, scene.id, scene.qualityPolicy.desktopAutoUpgrade]);

  // Release hero WebGL context cleanly when scrolled past Act III so Chapter 4 Showroom owns the sole renderer
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = Boolean(entries[0]?.isIntersecting);
        setStageInView(visible);
        if (!visible) {
          setLive3DReady(false);
        }
      },
      { rootMargin: "180px 0px", threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Listen for live model-viewer readiness with 10s safety timeout
  useEffect(() => {
    if (!shouldMount3D || !stageInView) return;
    const mv = mvRef.current;
    if (!mv) return;

    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) setLive3DReady(false);
    }, scene.qualityPolicy.timeoutMs);

    const onLoad = () => {
      settled = true;
      window.clearTimeout(timer);
      const kf = scene.keyframes.arrival;
      mv.cameraOrbit = `${kf.thetaDeg}deg ${kf.phiDeg}deg ${kf.radiusPct}%`;
      mv.fieldOfView = `${kf.fieldOfViewDeg}deg`;
      mv.jumpCameraToGoal?.();
      setLive3DReady(true);
      trackSafeEvent({
        name: "viewer_ready",
        assetVersion: `${scene.id}-v3`,
        elapsedBucket: "fast",
      });
    };

    const onError = () => {
      settled = true;
      window.clearTimeout(timer);
      setLive3DReady(false);
    };

    if (mv.loaded) {
      onLoad();
    } else {
      mv.addEventListener("load", onLoad);
      mv.addEventListener("error", onError);
    }

    return () => {
      window.clearTimeout(timer);
      mv.removeEventListener("load", onLoad);
      mv.removeEventListener("error", onError);
    };
  }, [
    scene.id,
    scene.keyframes.arrival,
    scene.qualityPolicy.timeoutMs,
    shouldMount3D,
    stageInView,
  ]);

  // Single authoritative GSAP ScrollTrigger controller driving 3-beat camera, atmosphere & typography
  useEffect(() => {
    if (!useInteractivePin) return;
    const track = trackRef.current;
    if (!track) return;

    const { arrival, approach } = scene.keyframes;
    const planform = planformKeyframe;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.35,
        onUpdate: (self) => {
          const p = clamp01(self.progress);

          // Split scroll into two seamless camera legs:
          // Leg A (0.0 -> 0.48): Arrival 3/4 (-36deg 76deg) -> Broadside Profile (0deg 83deg)
          // Leg B (0.48 -> 0.94): Broadside Profile -> Overhead Architectural Planform (90deg 14deg)
          const legA = smoothstep(0.02, 0.46, p);
          const legB = smoothstep(0.52, 0.92, p);

          let theta = lerp(arrival.thetaDeg, approach.thetaDeg, legA);
          let phi = lerp(arrival.phiDeg, approach.phiDeg, legA);
          let radius = lerp(arrival.radiusPct, approach.radiusPct, legA);
          let fov = lerp(arrival.fieldOfViewDeg, approach.fieldOfViewDeg, legA);

          if (legB > 0) {
            theta = lerp(approach.thetaDeg, planform.thetaDeg, legB);
            phi = lerp(approach.phiDeg, planform.phiDeg, legB);
            radius = lerp(approach.radiusPct, planform.radiusPct, legB);
            fov = lerp(approach.fieldOfViewDeg, planform.fieldOfViewDeg, legB);
          }

          const mv = mvRef.current;
          if (mv && mv.loaded) {
            mv.cameraOrbit = `${theta.toFixed(2)}deg ${phi.toFixed(2)}deg ${radius.toFixed(1)}%`;
            mv.fieldOfView = `${fov.toFixed(2)}deg`;
            mv.shadowIntensity = Number(lerp(0, 0.56, legB).toFixed(2));
          }

          // Vertical aircraft staging: slightly lifted at Arrival (-4vh, clearing lower-right display) -> lower cloud deck on Beat 2 (+14vh) -> poised center (-2vh) on Overhead Planform
          if (jetWrapRef.current) {
            const baseLift = lerp(-4, -2, legB);
            const cloudDrop = Math.sin(clamp01(p / 0.72) * Math.PI) * 18;
            const yVh = baseLift + cloudDrop;
            const scaleBoost = 1 + legB * 0.04;
            jetWrapRef.current.style.transform = `translate3d(0, ${yVh.toFixed(2)}vh, 0) scale(${scaleBoost.toFixed(3)})`;
          }

          // Atmospheric sky drift -> warm stone architectural studio handoff
          if (skyRef.current) {
            const sy = lerp(0, 14, clamp01(p * 1.4));
            const ss = lerp(1.03, 1.18, clamp01(p * 1.4));
            skyRef.current.style.transform = `translate3d(0, ${sy.toFixed(2)}%, 0) scale(${ss.toFixed(3)})`;
          }

          const cloudsPresence = smoothstep(0.2, 0.36, p) * (1 - smoothstep(0.56, 0.68, p));
          if (cloudsVeilRef.current) {
            cloudsVeilRef.current.style.opacity = cloudsPresence.toFixed(3);
          }

          const stoneReveal = smoothstep(0.56, 0.76, p);
          if (stoneBackdropRef.current) {
            stoneBackdropRef.current.style.opacity = stoneReveal.toFixed(3);
          }
          if (darkScrimRef.current) {
            darkScrimRef.current.style.opacity = (1 - stoneReveal).toFixed(3);
          }

          // Beat 1: Arrival split-corner monumental type (0 -> 0.24 out)
          const arrivalOut = 1 - smoothstep(0.06, 0.24, p);
          if (arrivalCopyRef.current) {
            arrivalCopyRef.current.style.opacity = arrivalOut.toFixed(3);
            arrivalCopyRef.current.style.transform = `translate3d(0, ${lerp(0, -28, 1 - arrivalOut).toFixed(1)}px, 0)`;
            arrivalCopyRef.current.style.pointerEvents = arrivalOut > 0.2 ? "auto" : "none";
          }

          // Beat 2: Cloud Philosophy (0.26 -> 0.56 active, 0.64 out)
          const cloudsIn = smoothstep(0.24, 0.38, p);
          const cloudsOut = 1 - smoothstep(0.54, 0.65, p);
          const cloudsAlpha = cloudsIn * cloudsOut;
          if (cloudsCopyRef.current) {
            cloudsCopyRef.current.style.opacity = cloudsAlpha.toFixed(3);
            cloudsCopyRef.current.style.transform = `translate3d(0, ${lerp(24, 0, cloudsIn).toFixed(1)}px, 0)`;
            cloudsCopyRef.current.style.pointerEvents = cloudsAlpha > 0.25 ? "auto" : "none";
          }

          // Optical focus illumination across the 4 pillars (zero React re-renders!)
          for (let i = 0; i < pillarRefs.current.length; i++) {
            const el = pillarRefs.current[i];
            if (!el) continue;
            const localFocus = smoothstep(0.28 + i * 0.045, 0.38 + i * 0.045, p);
            el.style.opacity = lerp(0.28, 1, localFocus).toFixed(3);
          }

          // Beat 3: Overhead Planform architectural spread (0.68 -> 1.0)
          const planformIn = smoothstep(0.68, 0.84, p);
          if (planformCopyRef.current) {
            planformCopyRef.current.style.opacity = planformIn.toFixed(3);
            planformCopyRef.current.style.transform = `translate3d(0, ${lerp(26, 0, planformIn).toFixed(1)}px, 0)`;
            planformCopyRef.current.style.pointerEvents = planformIn > 0.25 ? "auto" : "none";
          }

          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${Math.max(0.05, p).toFixed(3)})`;
          }

          const nextBeat = p < 0.26 ? 0 : p < 0.64 ? 1 : 2;
          if (nextBeat !== beatRef.current) {
            beatRef.current = nextBeat;
            setActiveBeat(nextBeat);
          }
        },
      });
    }, track);

    return () => ctx.revert();
  }, [planformKeyframe, scene.keyframes, useInteractivePin]);

  // =========================================================================
  // DESKTOP FULL-BLEED 3-BEAT CINEMA (Arrival -> Cloud Profile -> Overhead Planform)
  // =========================================================================
  if (useInteractivePin) {
    return (
      <div
        ref={trackRef}
        data-chapter="arrival"
        data-surface={activeBeat === 2 ? "light" : "dark"}
        className="relative h-[300svh] bg-[var(--jc-teal-deep)] text-[var(--jc-ivory)]"
      >
        <div className="sticky top-0 z-[var(--z-stage)] h-[100svh] w-full overflow-hidden">
          {/* Layer 0: Full-bleed twilight sky & high-altitude cloud horizon */}
          <div
            ref={skyRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 origin-center will-change-transform"
            style={{ transform: "scale(1.03)" }}
          >
            <img
              src={skyPlate.path}
              alt=""
              width={skyPlate.width}
              height={skyPlate.height}
              fetchPriority="high"
              className="h-full w-full object-cover object-bottom"
            />
          </div>

          {/* Layer 1: Gentle ambient cloud drift */}
          <div
            aria-hidden="true"
            className="jc-cloud-drift pointer-events-none absolute inset-x-0 bottom-0 h-[42%] opacity-35"
          />

          {/* Layer 2: Cinematic reading vignette (dark beats) */}
          <div
            ref={darkScrimRef}
            aria-hidden="true"
            className="jc-hero-cinema-scrim pointer-events-none absolute inset-0"
          />

          {/* Layer 3: Deep cloud-immersion veil for Beat 2 */}
          <div
            ref={cloudsVeilRef}
            aria-hidden="true"
            className="jc-clouds-depth-veil pointer-events-none absolute inset-0 opacity-0"
          />

          {/* Layer 4: Architectural warm stone studio backdrop for Beat 3 (Jesko planform spirit) */}
          <div
            ref={stoneBackdropRef}
            aria-hidden="true"
            className="jc-planform-stone pointer-events-none absolute inset-0 opacity-0"
          />

          {/* Layer 5: SINGLE CONTINUOUS CENTERPIECE LIVE 3D AIRCRAFT */}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div
              ref={jetWrapRef}
              data-plane="hero-jet"
              style={{ transform: "translate3d(0, -4vh, 0)" }}
              className="relative flex h-[min(74vh,640px)] w-[min(86vw,1080px)] items-center justify-center will-change-transform"
            >
              {/* Immediate crisp WebP poster before live WebGL takes over */}
              <img
                src={heroPoster.path}
                alt={heroPoster.alt}
                width={heroPoster.width}
                height={heroPoster.height}
                fetchPriority="high"
                className={`jc-aircraft-shadow pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
                  live3DReady ? "opacity-0" : "opacity-100"
                }`}
              />

              {shouldMount3D && stageInView && (
                <div
                  className={`h-full w-full transition-opacity duration-500 ${
                    live3DReady ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <model-viewer
                    ref={mvRef}
                    src={flightConfig.desktopUrl}
                    poster={heroPoster.path}
                    alt={heroPoster.alt}
                    camera-orbit={`${scene.keyframes.arrival.thetaDeg}deg ${scene.keyframes.arrival.phiDeg}deg ${scene.keyframes.arrival.radiusPct}%`}
                    camera-target="auto auto auto"
                    field-of-view={`${scene.keyframes.arrival.fieldOfViewDeg}deg`}
                    environment-image={scene.environmentUrl}
                    exposure={heroLighting.exposure}
                    shadow-intensity={heroLighting.shadowIntensity}
                    shadow-softness={heroLighting.shadowSoftness}
                    interaction-prompt="none"
                    interpolation-decay="95"
                    loading="eager"
                    reveal="auto"
                  >
                    <div slot="progress-bar" aria-hidden="true" hidden />
                  </model-viewer>
                </div>
              )}
            </div>
          </div>

          {/* ===============================================================
              BEAT 1 OVERLAY: SPLIT-CORNER MONUMENTAL ARRIVAL (Jesko Spirit)
          =============================================================== */}
          <div
            ref={arrivalCopyRef}
            className="absolute inset-0 z-20 mx-auto flex h-full w-full max-w-[1600px] flex-col justify-between px-[var(--gutter)] pb-16 pt-[96px] will-change-transform"
          >
            {/* Top-left primary display half */}
            <div className="max-w-[540px]">
              <h1 className="jc-display-monumental m-0 text-[var(--jc-ivory)]">
                Private charter
                <span className="sr-only"> for your itinerary.</span>
              </h1>
            </div>

            {/* Bottom split row: descriptor bottom-left | second monumental half + scroll cue bottom-right */}
            <div className="grid grid-cols-[minmax(0,360px)_1fr_minmax(0,520px)] items-end gap-8">
              <div>
                <div className="mb-4 h-px w-10 bg-[var(--jc-gold)]" />
                <p className="m-0 text-[16px] leading-[1.6] text-[var(--jc-ivory-soft)]">
                  Private jets, group charters, and helicopters arranged around your schedule, with Jayant as your first point of contact.
                </p>
                <div className="mt-5 flex items-center gap-6">
                  <a
                    href="#inquire"
                    className="text-[14px] font-semibold text-[var(--jc-gold)] underline underline-offset-8 transition-colors hover:text-[var(--jc-gold-hover)]"
                  >
                    Request a callback
                  </a>
                  <a
                    href="#inspect-aircraft"
                    className="text-[14px] font-medium text-[var(--jc-ivory)] underline decoration-[var(--jc-line-dark-strong)] underline-offset-8 transition-colors hover:decoration-[var(--jc-ivory)]"
                  >
                    Explore aircraft
                  </a>
                </div>
              </div>

              <div />

              <div className="text-right">
                <p
                  aria-hidden="true"
                  className="jc-display-monumental m-0 text-[var(--jc-ivory)]"
                >
                  for your itinerary.
                </p>
                <div className="mt-5 flex items-center justify-end gap-4 border-t border-[var(--jc-line-dark)] pt-3.5 text-[12px] text-[var(--jc-ivory-soft)]">
                  <span className="whitespace-nowrap">Scroll to descend</span>
                  <span aria-hidden="true" className="h-px w-8 shrink-0 bg-[var(--jc-line-dark-strong)]" />
                  <span>{heroPoster.caption}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===============================================================
              BEAT 2 OVERLAY: THROUGH THE CLOUDS PHILOSOPHY (Upper Sky, Clear of Jet)
          =============================================================== */}
          <div
            ref={cloudsCopyRef}
            aria-hidden={activeBeat !== 1}
            className="pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto w-full max-w-[1520px] px-[var(--gutter)] pt-[104px] opacity-0 will-change-transform"
          >
            <div className="grid grid-cols-[minmax(0,0.88fr)_minmax(0,1.25fr)] items-start gap-12">
              <div className="max-w-[460px]">
                <h2 className="jc-display-section m-0 text-[var(--jc-ivory)]">
                  Built around the flight you actually need.
                </h2>
                <p className="mt-4 m-0 text-[16px] leading-relaxed text-[var(--jc-ivory-soft)]">
                  Executive roadshows, family departures, and multi-aircraft wedding logistics handled with quiet precision.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-10 gap-y-7 pt-2">
                {PHILOSOPHY_PILLARS.map((pillar, i) => (
                  <div
                    key={pillar.title}
                    ref={(node) => {
                      pillarRefs.current[i] = node;
                    }}
                    style={{ opacity: 0.28 }}
                    className="border-t border-[var(--jc-line-dark-strong)] pt-3.5"
                  >
                    <h3 className="m-0 font-serif text-[22px] leading-snug text-[var(--jc-ivory)]">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 m-0 text-[14px] leading-relaxed text-[var(--jc-ivory-soft)]">
                      {pillar.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===============================================================
              BEAT 3 OVERLAY: ARCHITECTURAL OVERHEAD PLANFORM (Jesko step_18 Spirit)
          =============================================================== */}
          <div
            ref={planformCopyRef}
            aria-hidden={activeBeat !== 2}
            className="pointer-events-none absolute inset-0 z-20 mx-auto grid h-full w-full max-w-[1600px] grid-cols-[minmax(0,1fr)_minmax(280px,38vw)_minmax(0,1fr)] items-center gap-6 px-[var(--gutter)] pb-20 pt-24 text-[var(--jc-ink)] opacity-0 will-change-transform"
          >
            {/* Left wing margin: Giant model name + quiet hairline technical dimensions */}
            <div className="flex h-full flex-col justify-between py-8">
              <div>
                <p className="m-0 text-[13px] font-medium text-[var(--jc-muted)]">
                  Super mid-size exterior study
                </p>
                <p className="jc-display-wing mt-2 m-0 text-[var(--jc-ink)]">
                  Hawker
                </p>
              </div>

              <dl className="m-0 max-w-[300px] space-y-3 border-t border-[var(--jc-line-light)] pt-5 text-[13px]">
                {aircraft.specifications.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-baseline justify-between gap-4 border-b border-[var(--jc-line-light)] pb-2.5"
                  >
                    <dt className="text-[var(--jc-muted)]">
                      {spec.label.replace(" (model reference)", "")}
                    </dt>
                    <dd className="m-0 font-medium text-[var(--jc-ink)] tabular-nums">
                      {spec.value} {spec.unit}
                    </dd>
                  </div>
                ))}
                <div className="pt-1 text-[12px] text-[var(--jc-muted)]">
                  Illustrative exterior envelope. Exact tail configuration confirmed per itinerary.
                </div>
              </dl>
            </div>

            {/* Center corridor left completely open for live overhead 3D aircraft */}
            <div />

            {/* Right wing margin: Giant model number + editorial poised note */}
            <div className="flex h-full flex-col justify-between py-8 text-right">
              <div>
                <p className="m-0 text-[13px] font-medium text-[var(--jc-muted)]">
                  Composite fuselage, high T-tail
                </p>
                <p className="jc-display-wing mt-2 m-0 text-[var(--jc-ink)]">
                  4000
                </p>
              </div>

              <div className="ml-auto max-w-[320px] border-t border-[var(--jc-line-light)] pt-5 text-left">
                <p className="m-0 text-[15px] leading-relaxed text-[var(--jc-ink)]">
                  Swept wings, stand-up cabin class, and quiet rear-mounted turbofans suited to regional executive and family itineraries.
                </p>
                <a
                  href="#inspect-aircraft"
                  className="mt-4 inline-flex items-center text-[14px] font-semibold text-[var(--jc-teal)] underline decoration-[var(--jc-gold-muted)] underline-offset-8 transition-colors hover:text-[var(--jc-ink)]"
                >
                  Open interactive 3D showroom
                </a>
              </div>
            </div>
          </div>

          {/* Whisper progress hairline along bottom-right edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-6 right-[var(--gutter)] z-30 hidden items-center gap-3 text-[12px] xl:flex"
          >
            <span
              className={
                activeBeat === 2
                  ? "text-[var(--jc-muted)]"
                  : "text-[var(--jc-ivory-soft)]"
              }
            >
              {activeBeat === 0
                ? "01 Arrival"
                : activeBeat === 1
                  ? "02 Approach"
                  : "03 Planform"}
            </span>
            <div
              className={
                activeBeat === 2
                  ? "h-[2px] w-16 overflow-hidden bg-[var(--jc-line-light)]"
                  : "h-[2px] w-16 overflow-hidden bg-[var(--jc-line-dark-strong)]"
              }
            >
              <div
                ref={progressBarRef}
                className={
                  activeBeat === 2
                    ? "h-full w-full origin-left bg-[var(--jc-teal)]"
                    : "h-full w-full origin-left bg-[var(--jc-gold)]"
                }
                style={{ transform: "scaleX(0.05)" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MOBILE & REDUCED-MOTION FALLBACK: Full-bleed cinema with zero overlap
  // =========================================================================
  return (
    <div>
      <section
        data-chapter="arrival"
        data-surface="dark"
        className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden bg-[var(--jc-teal-deep)] pt-24 pb-24 text-[var(--jc-ivory)]"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <img
            src={skyPlate.path}
            alt=""
            width={skyPlate.width}
            height={skyPlate.height}
            fetchPriority="high"
            className="h-full w-full object-cover object-bottom"
          />
        </div>
        <div
          aria-hidden="true"
          className="jc-hero-cinema-scrim pointer-events-none absolute inset-0"
        />

        <div className="jc-container relative z-10 flex flex-1 flex-col justify-between gap-8">
          <div className="max-w-[560px]">
            <h1 className="jc-display-hero m-0 text-[var(--jc-ivory)]">
              Private charter for your itinerary.
            </h1>
            <p className="mt-5 max-w-[44ch] text-[17px] leading-[1.6] text-[var(--jc-ivory-soft)]">
              Private jets, group charters, and helicopters arranged around your schedule, with Jayant as your first point of contact.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-6">
              <a
                href="#inquire"
                className="text-[15px] font-semibold text-[var(--jc-gold)] underline underline-offset-8"
              >
                Request a callback
              </a>
              <a
                href="#inspect-aircraft"
                className="text-[15px] font-medium text-[var(--jc-ivory)] underline decoration-[var(--jc-line-dark-strong)] underline-offset-8"
              >
                Explore aircraft
              </a>
            </div>
          </div>

          <div data-plane="hero-jet" className="relative flex flex-col items-center">
            <img
              src={heroPoster.path}
              alt={heroPoster.alt}
              width={heroPoster.width}
              height={heroPoster.height}
              fetchPriority="high"
              className="jc-aircraft-shadow w-full max-w-[780px] object-contain"
            />
            <p className="mt-4 mb-0 max-w-[44ch] text-center text-[13px] leading-snug text-[var(--jc-ivory-soft)]">
              {heroPoster.caption}
            </p>
          </div>
        </div>
      </section>

      <section
        data-chapter="approach"
        className="jc-planform-stone border-b border-[var(--jc-line-light)] py-20 text-[var(--jc-ink)] md:py-24"
      >
        <div className="jc-container grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div>
            <h2 className="jc-display-section m-0 text-[var(--jc-ink)]">
              Built around the flight you actually need.
            </h2>
            <p className="mt-5 max-w-[50ch] text-[17px] leading-relaxed text-[var(--jc-muted)]">
              Executive roadshows, family departures, and wedding movements begin with one calm conversation with Jayant before feasibility checks start.
            </p>
            <dl className="mt-8 grid grid-cols-1 gap-5 border-t border-[var(--jc-line-light)] pt-6 sm:grid-cols-2">
              {PHILOSOPHY_PILLARS.map((pillar) => (
                <div key={pillar.title}>
                  <dt className="font-serif text-[20px] text-[var(--jc-ink)]">
                    {pillar.title}
                  </dt>
                  <dd className="mt-1.5 m-0 text-[14px] leading-relaxed text-[var(--jc-muted)]">
                    {pillar.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <img
              src={approachPoster.path}
              alt={approachPoster.alt}
              width={approachPoster.width}
              height={approachPoster.height}
              loading="lazy"
              className="jc-aircraft-shadow-light w-full object-contain"
            />
            <p className="mt-4 mb-0 text-[13px] text-[var(--jc-muted)]">
              Hawker 4000 exterior study. Aircraft class is matched to route, luggage, and party size during feasibility review.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
