"use client";

import { useEffect, useRef, useState } from "react";
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
  const mistRef = useRef<HTMLDivElement>(null);
  const arrivalCopyRef = useRef<HTMLDivElement>(null);
  const approachCopyRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const jetWrapRef = useRef<HTMLDivElement>(null);
  const approachActiveRef = useRef<boolean>(false);

  const [useInteractivePin, setUseInteractivePin] = useState<boolean>(false);
  const [stageInView, setStageInView] = useState<boolean>(true);
  const [shouldMount3D, setShouldMount3D] = useState<boolean>(false);
  const [live3DReady, setLive3DReady] = useState<boolean>(false);
  const [approachActive, setApproachActive] = useState<boolean>(false);

  const flightConfig =
    aircraft.configurations.find((c) => c.id === scene.configurationId) ||
    aircraft.configurations[0];
  const heroLighting = scene.lightingModes[0] || {
    exposure: 1.28,
    shadowIntensity: 0,
    shadowSoftness: 0.85,
  };

  // Decide desktop pinned 3D choreography vs clean unpinned static/mobile layout
  useEffect(() => {
    const cap = detectViewerCapability();
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const allowPin = isDesktop && !cap.prefersReducedMotion;
    setUseInteractivePin(allowPin);

    if (allowPin && enableLive3D && cap.shouldAutoLoad && scene.qualityPolicy.desktopAutoUpgrade) {
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

  // Pause & release hero WebGL context when scrolled well past Chapter 2 so Chapter 4 Hangar owns the sole WebGL renderer
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
      { rootMargin: "200px 0px", threshold: 0.01 }
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
        assetVersion: `${scene.id}-v1`,
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
  }, [scene.id, scene.keyframes.arrival, scene.qualityPolicy.timeoutMs, shouldMount3D, stageInView]);

  // Single authoritative ScrollTrigger controller driving camera keyframes + text beats in BOTH scroll directions
  useEffect(() => {
    if (!useInteractivePin) return;
    const track = trackRef.current;
    if (!track) return;

    const { arrival, approach } = scene.keyframes;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.35,
        onUpdate: (self) => {
          const p = clamp01(self.progress);

          // 1. Interpolate live 3D camera smoothly from 3/4 Arrival -> Profile Approach
          const mv = mvRef.current;
          if (mv && mv.loaded) {
            const theta = lerp(arrival.thetaDeg, approach.thetaDeg, p);
            const phi = lerp(arrival.phiDeg, approach.phiDeg, p);
            const radius = lerp(arrival.radiusPct, approach.radiusPct, p);
            const fov = lerp(arrival.fieldOfViewDeg, approach.fieldOfViewDeg, p);
            mv.cameraOrbit = `${theta.toFixed(2)}deg ${phi.toFixed(2)}deg ${radius.toFixed(1)}%`;
            mv.fieldOfView = `${fov.toFixed(2)}deg`;
          } else if (jetWrapRef.current) {
            // Smooth fallback parallax glide when poster is shown
            const x = lerp(0, -28, p);
            const y = lerp(0, -16, p);
            const s = lerp(1, 1.05, p);
            jetWrapRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
          }

          // 2. Atmospheric sky depth + subtle tonal horizon mist shift
          if (skyRef.current) {
            const sy = lerp(0, 12, p);
            const ss = lerp(1.02, 1.11, p);
            skyRef.current.style.transform = `translate3d(0, ${sy}%, 0) scale(${ss})`;
          }
          if (mistRef.current) {
            mistRef.current.style.opacity = String(lerp(0.08, 0.52, p));
          }

          // 3. Cross-transition Arrival copy -> Approach manifesto cleanly (never overlapping!)
          const arrivalOut = clamp01(1 - p / 0.42);
          const approachIn = clamp01((p - 0.44) / 0.34);

          if (arrivalCopyRef.current) {
            arrivalCopyRef.current.style.opacity = String(arrivalOut);
            arrivalCopyRef.current.style.transform = `translate3d(0, ${lerp(0, -32, 1 - arrivalOut)}px, 0)`;
            arrivalCopyRef.current.style.pointerEvents = arrivalOut > 0.25 ? "auto" : "none";
          }

          if (approachCopyRef.current) {
            approachCopyRef.current.style.opacity = String(approachIn);
            approachCopyRef.current.style.transform = `translate3d(0, ${lerp(28, 0, approachIn)}px, 0)`;
            approachCopyRef.current.style.pointerEvents = approachIn > 0.25 ? "auto" : "none";
          }

          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${Math.max(0.06, p)})`;
          }

          // Illuminate manifesto lines directly via DOM refs (zero per-frame React re-renders)
          for (let i = 0; i < lineRefs.current.length; i++) {
            const el = lineRefs.current[i];
            if (!el) continue;
            const threshold = i * 0.28;
            const alpha = clamp01(0.32 + (approachIn - threshold) * 1.45);
            el.style.opacity = alpha.toFixed(3);
          }

          const nextActive = p > 0.46;
          if (nextActive !== approachActiveRef.current) {
            approachActiveRef.current = nextActive;
            setApproachActive(nextActive);
          }
        },
      });
    }, track);

    return () => ctx.revert();
  }, [scene.keyframes, useInteractivePin]);

  const manifestoLines = [
    "Executive roadshows, family departures, and wedding movements.",
    "One calm conversation with Jayant before feasibility checks begin.",
    "Custom routes worldwide, with active focus across Dubai, Delhi NCR, Mumbai, Rajasthan, and Goa.",
  ];

  // =========================================================================
  // DESKTOP CONTINUOUS PINNED STAGE (Arrival -> Approach on one live aircraft)
  // =========================================================================
  if (useInteractivePin) {
    return (
      <div
        ref={trackRef}
        data-chapter="arrival"
        data-surface="dark"
        className="relative h-[205svh] bg-[var(--jc-teal-deep)] text-[var(--jc-ivory)]"
      >
        <div className="sticky top-[var(--chrome-height)] z-[var(--z-stage)] h-[calc(100svh-var(--chrome-height))] overflow-hidden">
          {/* Plane 0: High-altitude twilight sky plate */}
          <div
            ref={skyRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 origin-center will-change-transform"
            style={{ transform: "scale(1.02)" }}
          >
            <img
              src={skyPlate.path}
              alt=""
              width={skyPlate.width}
              height={skyPlate.height}
              fetchPriority="high"
              className="h-full w-full object-cover object-bottom opacity-95"
            />
          </div>

          {/* Plane 0.5: Subtle Jesko-inspired continuous ambient cloud drift (CSS composited, paused under reduced motion) */}
          <div
            aria-hidden="true"
            className="jc-cloud-drift pointer-events-none absolute inset-x-0 bottom-0 h-[36%] opacity-35"
          />

          {/* Plane 1: Targeted reading scrim + multi-stop eased approach atmosphere */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(102deg, rgba(10,29,28,0.9) 0%, rgba(16,43,42,0.58) 44%, rgba(16,43,42,0.12) 100%), linear-gradient(180deg, transparent 74%, rgba(10,29,28,0.68) 100%)",
            }}
          />
          <div
            ref={mistRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              background:
                "linear-gradient(180deg, rgba(16,43,42,0.18) 0%, rgba(22,56,54,0.42) 55%, rgba(247,245,237,0.22) 100%)",
            }}
          />

          {/* Main 2-column spatial stage: Left copy beats | Right live aircraft corridor */}
          <div className="jc-container relative z-10 grid h-full grid-cols-[minmax(0,0.96fr)_minmax(0,1.22fr)] items-center gap-8 py-10">
            {/* Left column holds Beat 1 (Arrival) and Beat 2 (Approach) cleanly crossfading */}
            <div className="relative flex min-h-[420px] items-center">
              {/* Beat 1: Arrival */}
              <div
                ref={arrivalCopyRef}
                className="w-full max-w-[540px] will-change-transform"
              >
                <h1 className="jc-display-hero text-[var(--jc-ivory)]">
                  Private charter for your itinerary.
                </h1>
                <p className="mt-6 max-w-[44ch] text-[18px] leading-[1.6] text-[var(--jc-ivory-soft)]">
                  Private jets, group charters, and helicopters arranged around your schedule, with Jayant as your first point of contact.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3.5">
                  <a href="#inquire" className="jc-btn-gold">
                    Request a callback
                  </a>
                  <a href="#inspect-aircraft" className="jc-btn-outline-light">
                    Explore aircraft
                  </a>
                </div>
              </div>

              {/* Beat 2: Approach (illuminates cleanly as the aircraft rotates to profile) */}
              <div
                ref={approachCopyRef}
                aria-hidden={!approachActive}
                className="pointer-events-none absolute inset-0 flex flex-col justify-center opacity-0 will-change-transform"
              >
                <h2 className="jc-display-section text-[var(--jc-ivory)]">
                  Built around the flight you actually need.
                </h2>

                <div className="mt-6 space-y-3.5">
                  {manifestoLines.map((line, i) => (
                    <p
                      key={line}
                      ref={(node) => {
                        lineRefs.current[i] = node;
                      }}
                      style={{ opacity: 0.34 }}
                      className="m-0 max-w-[46ch] text-[17px] leading-relaxed text-[var(--jc-ivory)]"
                    >
                      {line}
                    </p>
                  ))}
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <a href="#services" className="jc-btn-gold">
                    Choose your journey
                  </a>
                  <a href="#inspect-aircraft" className="jc-btn-outline-light">
                    Inspect in 3D hangar
                  </a>
                </div>
              </div>
            </div>

            {/* Right column: Single continuous aircraft visual (Poster -> Live 3D upgrade) */}
            <div className="relative flex h-full flex-col items-end justify-center">
              <div
                ref={jetWrapRef}
                data-plane="hero-jet"
                className="relative flex h-[min(64vh,560px)] w-full items-center justify-center will-change-transform"
              >
                {/* Immediate sharp poster (crossfades smoothly out once live WebGL model matches) */}
                <img
                  src={heroPoster.path}
                  alt={heroPoster.alt}
                  width={heroPoster.width}
                  height={heroPoster.height}
                  fetchPriority="high"
                  className={`jc-aircraft-shadow pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
                    live3DReady ? "opacity-0" : "opacity-100"
                  }`}
                />

                {/* Live WebGL model-viewer taking authoritative scroll-driven orbit when in view */}
                {shouldMount3D && stageInView && (
                  <div
                    className={`h-full w-full transition-opacity duration-300 ${
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
                      interpolation-decay="90"
                      loading="eager"
                      reveal="auto"
                    >
                      <div slot="progress-bar" aria-hidden="true" hidden />
                    </model-viewer>
                  </div>
                )}
              </div>

              <div className="mt-2 flex w-full items-end justify-between gap-6">
                <div className="flex items-center gap-3 text-[12px] text-[var(--jc-ivory-soft)]">
                  <span className={approachActive ? "text-[var(--jc-ivory-muted)]" : "text-[var(--jc-gold)]"}>
                    Arrival
                  </span>
                  <div className="h-[2px] w-20 overflow-hidden bg-[var(--jc-line-dark-strong)]">
                    <div
                      ref={progressBarRef}
                      className="h-full w-full origin-left bg-[var(--jc-gold)]"
                      style={{ transform: "scaleX(0.06)" }}
                    />
                  </div>
                  <span className={approachActive ? "text-[var(--jc-gold)]" : "text-[var(--jc-ivory-muted)]"}>
                    Approach
                  </span>
                </div>

                <p className="m-0 max-w-[40ch] text-right text-[13px] leading-snug text-[var(--jc-ivory-soft)]">
                  {heroPoster.caption}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MOBILE / REDUCED-MOTION / NON-JS FALLBACK: Clean intentional 2-chapter flow
  // =========================================================================
  return (
    <div>
      <section
        data-chapter="arrival"
        data-surface="dark"
        className="relative overflow-hidden bg-[var(--jc-teal-deep)] text-[var(--jc-ivory)]"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <img
            src={skyPlate.path}
            alt=""
            width={skyPlate.width}
            height={skyPlate.height}
            fetchPriority="high"
            className="h-full w-full object-cover object-bottom opacity-95"
          />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(102deg, rgba(10,29,28,0.9) 0%, rgba(16,43,42,0.58) 48%, rgba(16,43,42,0.16) 100%), linear-gradient(180deg, transparent 70%, rgba(10,29,28,0.72) 100%)",
          }}
        />

        <div className="jc-container relative z-10 grid min-h-[calc(100svh-var(--chrome-height))] grid-cols-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.18fr)] lg:gap-8 lg:py-14">
          <div className="max-w-[560px]">
            <h1 className="jc-display-hero text-[var(--jc-ivory)]">
              Private charter for your itinerary.
            </h1>
            <p className="mt-6 max-w-[46ch] text-[18px] leading-[1.6] text-[var(--jc-ivory-soft)]">
              Private jets, group charters, and helicopters arranged around your schedule, with Jayant as your first point of contact.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <a href="#inquire" className="jc-btn-gold">
                Request a callback
              </a>
              <a href="#inspect-aircraft" className="jc-btn-outline-light">
                Explore aircraft
              </a>
            </div>
          </div>

          <div data-plane="hero-jet" className="relative flex flex-col items-end">
            <img
              src={heroPoster.path}
              alt={heroPoster.alt}
              width={heroPoster.width}
              height={heroPoster.height}
              fetchPriority="high"
              className="jc-aircraft-shadow w-full max-w-[780px] object-contain"
            />
            <p className="mt-4 max-w-[44ch] text-right text-[13px] leading-snug text-[var(--jc-ivory-soft)]">
              {heroPoster.caption}
            </p>
          </div>
        </div>
      </section>

      <section
        data-chapter="approach"
        className="surface-ivory border-b border-[var(--jc-line-light)] py-20 md:py-24"
      >
        <div className="jc-container grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
          <div>
            <h2 className="jc-display-section text-[var(--jc-ink)]">
              Built around the flight you actually need.
            </h2>
            <p className="mt-5 max-w-[50ch] text-[17px] leading-relaxed text-[var(--jc-muted)]">
              Executive roadshows, family departures, and wedding movements begin with one calm conversation with Jayant before feasibility checks start. Custom routes worldwide, with active focus across Dubai, Delhi NCR, Mumbai, Rajasthan, and Goa.
            </p>
          </div>
          <div className="rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-stone)] p-6 sm:p-8">
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
