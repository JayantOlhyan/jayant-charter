"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AircraftRecord, MediaAsset, SceneRecord } from "@/content/schemas";
import type { ModelViewerElement } from "@/types/model-viewer";
import {
  detectViewerCapability,
  ensureModelViewerLoaded,
} from "@/features/aircraft/model-viewer-loader";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

interface JeskoPlanformBlueprintProps {
  scene: SceneRecord;
  aircraft: AircraftRecord;
  heroPoster: MediaAsset;
  blueprintMedia: MediaAsset;
  enableLive3D: boolean;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Jesko step_16 -> step_18 -> step_20 centerpiece elevated with real-time 3D WebGL:
 * - Warm stone -> cream studio atmosphere (#8A817D -> #FFF8ED)
 * - Giant split typography ("Fly on" / "Your Terms") framing our live 3D Hawker 4000
 *   vertical overhead planform (90deg 14deg) descending at monumental scale
 * - Mid-scroll scales down gracefully into left-margin hairline specs (21.08 m / 18.82 m / 6.02 m)
 * - Final scroll beat performs the iconic X-Ray Blueprint Mask Wipe: seamlessly revealing
 *   our Swiss CAD technical blueprint right beneath the overhead 3D aircraft.
 */
export function JeskoPlanformBlueprint({
  scene,
  aircraft,
  heroPoster,
  blueprintMedia,
  enableLive3D,
}: JeskoPlanformBlueprintProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const mvRef = useRef<ModelViewerElement | null>(null);
  const jetContainerRef = useRef<HTMLDivElement>(null);
  const exteriorLayerRef = useRef<HTMLDivElement>(null);
  const blueprintLayerRef = useRef<HTMLDivElement>(null);
  const scanBeamRef = useRef<HTMLDivElement>(null);
  const beat1CopyRef = useRef<HTMLDivElement>(null);
  const beat2SpecsRef = useRef<HTMLDivElement>(null);

  const [usePinned, setUsePinned] = useState(false);
  const [stageInView, setStageInView] = useState(false);
  const [shouldMount3D, setShouldMount3D] = useState(false);
  const [live3DReady, setLive3DReady] = useState(false);
  const [manualView, setManualView] = useState<"auto" | "exterior" | "blueprint">("auto");

  const flightConfig =
    aircraft.configurations.find((c) => c.id === "flight") ||
    aircraft.configurations[0];

  // Decide desktop pinned cinema vs clean mobile/reduced-motion layout
  useEffect(() => {
    const cap = detectViewerCapability();
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const allowPin = isDesktop && !cap.prefersReducedMotion;
    setUsePinned(allowPin);

    if (
      allowPin &&
      enableLive3D &&
      cap.shouldAutoLoad &&
      scene.qualityPolicy.desktopAutoUpgrade
    ) {
      let cancelled = false;
      ensureModelViewerLoaded()
        .then(() => {
          if (!cancelled) setShouldMount3D(true);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [enableLive3D, scene.qualityPolicy.desktopAutoUpgrade]);

  // Pre-warm live 3D overhead planform cleanly well before entering view (single model-viewer on /)
  useEffect(() => {
    if (!usePinned) return;
    const el = trackRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = Boolean(entries[0]?.isIntersecting);
        setStageInView(visible);
        if (!visible) setLive3DReady(false);
      },
      { rootMargin: "900px 0px", threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [usePinned]);

  // Lock camera immediately into overhead vertical planform when loaded
  useEffect(() => {
    if (!shouldMount3D || !stageInView) return;
    const mv = mvRef.current;
    if (!mv) return;

    const onLoad = () => {
      mv.cameraOrbit = "90deg 14deg 86%";
      mv.fieldOfView = "29deg";
      mv.jumpCameraToGoal?.();
      setLive3DReady(true);
    };

    if (mv.loaded) onLoad();
    else mv.addEventListener("load", onLoad);

    return () => {
      mv.removeEventListener("load", onLoad);
    };
  }, [shouldMount3D, stageInView]);

  // Apply manual Exterior / Blueprint override cleanly when toggled
  useEffect(() => {
    if (manualView === "auto") return;
    const ext = exteriorLayerRef.current;
    const bp = blueprintLayerRef.current;
    if (!ext || !bp) return;
    if (manualView === "blueprint") {
      ext.style.clipPath = "inset(0 0 100% 0)";
      bp.style.clipPath = "inset(0% 0 0 0)";
      if (scanBeamRef.current) scanBeamRef.current.style.opacity = "0";
    } else {
      ext.style.clipPath = "inset(0 0 0% 0)";
      bp.style.clipPath = "inset(100% 0 0 0)";
      if (scanBeamRef.current) scanBeamRef.current.style.opacity = "0";
    }
  }, [manualView]);

  // Jesko .jet_scroll-area choreography: Giant Overhead Fly-Through -> Spec Scale-Down -> X-Ray Blueprint Wipe
  useEffect(() => {
    if (!usePinned) return;
    const track = trackRef.current;
    if (!track) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        onUpdate: (self) => {
          const p = clamp01(self.progress);

          // 1. Overhead aircraft scales from monumental nose entry (1.15) -> poised inspection (0.86)
          if (jetContainerRef.current) {
            const entryY = lerp(18, 0, smoothstep(0, 0.25, p));
            const settleScale = lerp(1.12, 0.86, smoothstep(0.22, 0.65, p));
            jetContainerRef.current.style.transform = `translate3d(0, ${entryY.toFixed(2)}vh, 0) scale(${settleScale.toFixed(3)})`;
          }

          // Subtle live 3D camera poise shift (slight nose-up sweep -> strict vertical orthographic planform matched to blueprint)
          const mv = mvRef.current;
          if (mv && mv.loaded) {
            const phi = lerp(20, 8, smoothstep(0, 0.55, p));
            const radius = lerp(78, 86, smoothstep(0.15, 0.65, p));
            mv.cameraOrbit = `90deg ${phi.toFixed(2)}deg ${radius.toFixed(1)}%`;
          }

          // 2. Beat 1 ("Fly on" / "Your Terms") crossfades cleanly into Beat 2 (Specs + Blueprint)
          const b1Out = 1 - smoothstep(0.24, 0.42, p);
          if (beat1CopyRef.current) {
            beat1CopyRef.current.style.opacity = b1Out.toFixed(3);
            beat1CopyRef.current.style.transform = `translate3d(0, ${lerp(0, -32, 1 - b1Out).toFixed(1)}px, 0)`;
            beat1CopyRef.current.style.pointerEvents = b1Out > 0.25 ? "auto" : "none";
          }

          const b2In = smoothstep(0.4, 0.56, p);
          if (beat2SpecsRef.current) {
            beat2SpecsRef.current.style.opacity = b2In.toFixed(3);
            beat2SpecsRef.current.style.transform = `translate3d(0, ${lerp(28, 0, b2In).toFixed(1)}px, 0)`;
            beat2SpecsRef.current.style.pointerEvents = b2In > 0.25 ? "auto" : "none";
          }

          // 3. X-Ray Blueprint Wipe (0.66 -> 0.94): morphs live exterior top-to-bottom into CAD blueprint with traveling scan hairline!
          if (manualView === "auto" && exteriorLayerRef.current && blueprintLayerRef.current) {
            const wipeRatio = smoothstep(0.66, 0.94, p);
            const wipePct = wipeRatio * 100;
            exteriorLayerRef.current.style.clipPath = `inset(0 0 ${wipePct.toFixed(1)}% 0)`;
            blueprintLayerRef.current.style.clipPath = `inset(${(100 - wipePct).toFixed(1)}% 0 0 0)`;
            if (scanBeamRef.current) {
              const beamActive = wipeRatio > 0.02 && wipeRatio < 0.98;
              scanBeamRef.current.style.opacity = beamActive ? "1" : "0";
              scanBeamRef.current.style.top = `${(100 - wipePct).toFixed(1)}%`;
            }
          }
        },
      });
    }, track);

    return () => ctx.revert();
  }, [manualView, usePinned]);

  // =========================================================================
  // DESKTOP PINNED OVERHEAD FLY-THROUGH & X-RAY BLUEPRINT WIPE
  // =========================================================================
  if (usePinned) {
    return (
      <section
        id="flight"
        ref={trackRef}
        data-chapter="planform"
        data-nav-theme="light"
        data-surface="light"
        className="jc-light-stone relative h-[320svh] text-[var(--jc-ink)]"
      >
        <div className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden">
          {/* Center Visual Stack: Live 3D Overhead Hawker 4000 <-> Architectural CAD Blueprint */}
          <div
            ref={jetContainerRef}
            data-plane="planform-jet"
            className="pointer-events-none relative z-10 flex h-[min(86vh,760px)] w-[min(46vw,560px)] items-center justify-center will-change-transform"
          >
            {/* Exterior Layer (Live 3D Overhead Planform with WebP fallback) */}
            <div
              ref={exteriorLayerRef}
              className="absolute inset-0 flex items-center justify-center transition-[clip-path] duration-150"
              style={{ clipPath: "inset(0 0 0% 0)" }}
            >
              {!live3DReady && (
                <img
                  src={blueprintMedia.path}
                  alt={blueprintMedia.alt}
                  width={blueprintMedia.width}
                  height={blueprintMedia.height}
                  className="h-[92%] w-full object-contain opacity-45"
                />
              )}

              {shouldMount3D && stageInView && (
                <div
                  className={cn(
                    "h-full w-full transition-opacity duration-500",
                    live3DReady ? "opacity-100" : "opacity-0"
                  )}
                >
                  <model-viewer
                    ref={mvRef}
                    src={flightConfig.desktopUrl}
                    alt={`Overhead 3D exterior planform of ${aircraft.displayTitle}`}
                    camera-orbit="90deg 14deg 86%"
                    camera-target="auto auto auto"
                    field-of-view="29deg"
                    environment-image={scene.environmentUrl}
                    exposure="1.26"
                    shadow-intensity="0.58"
                    shadow-softness="0.92"
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

            {/* Technical CAD Blueprint Layer directly aligned underneath (X-ray wipe reveal!) */}
            <div
              ref={blueprintLayerRef}
              className="absolute inset-0 flex items-center justify-center transition-[clip-path] duration-150"
              style={{ clipPath: "inset(100% 0 0 0)" }}
            >
              <img
                src={blueprintMedia.path}
                alt={blueprintMedia.alt}
                width={blueprintMedia.width}
                height={blueprintMedia.height}
                loading="lazy"
                className="h-[92%] w-full object-contain"
              />
            </div>

            {/* Precision hairline X-ray scanline tracking the wipe boundary */}
            <div
              ref={scanBeamRef}
              aria-hidden="true"
              className="jc-xray-beam pointer-events-none absolute inset-x-4 z-30 h-[2px] opacity-0 transition-opacity duration-200"
            />
          </div>

          {/* BEAT 1 OVERLAY: Giant Split Headline framing the wingspan ("Fly on" | "Your Terms") */}
          <div
            ref={beat1CopyRef}
            className="absolute inset-0 z-20 mx-auto flex h-full w-full max-w-[1600px] flex-col justify-between px-[var(--gutter)] pb-20 pt-24 will-change-transform"
          >
            <div className="mt-auto grid grid-cols-[minmax(0,1fr)_minmax(240px,34vw)_minmax(0,1fr)] items-center gap-6">
              <div>
                <h2 className="jc-display-wing m-0 whitespace-nowrap text-[var(--jc-ink)]">
                  Fly on
                </h2>
                <p className="jc-display-title mt-5 m-0 text-[var(--jc-ink)]">
                  Charter that moves
                  <br />
                  with you
                </p>
              </div>
              <div />
              <div className="pr-8 text-right xl:pr-14">
                <p
                  aria-hidden="true"
                  className="jc-display-wing m-0 text-[var(--jc-ink)]"
                >
                  Your Terms
                </p>
              </div>
            </div>

            <div className="mt-auto grid grid-cols-[minmax(0,1fr)_minmax(240px,34vw)_minmax(0,1fr)] items-end gap-6">
              <div />
              <div />
              <div className="ml-auto max-w-[360px] border-t border-[var(--jc-line-light)] pr-6 pt-4 xl:pr-12">
                <div className="flex items-center justify-between text-[12px] font-semibold text-[var(--jc-ink)]">
                  <span>Hawker Beechcraft</span>
                  <span>Hawker 4000</span>
                </div>
                <p className="mt-3 m-0 text-[14px] leading-relaxed text-[var(--jc-muted)]">
                  Composite-fuselage super mid-size exterior study distinguished by its high T-tail, swept wings, and stand-up cabin class.
                </p>
              </div>
            </div>
          </div>

          {/* BEAT 2 OVERLAY: Jesko step_18 Hairline Spec Sheet + Blueprint X-Ray Controls */}
          <div
            ref={beat2SpecsRef}
            className="pointer-events-none absolute inset-0 z-20 mx-auto grid h-full w-full max-w-[1600px] grid-cols-[minmax(0,1fr)_minmax(260px,36vw)_minmax(0,1fr)] items-center gap-6 px-[var(--gutter)] pb-20 pt-24 opacity-0 will-change-transform"
          >
            {/* Left margin: Model title + exact hairline 2-col specification grid */}
            <div className="flex h-full flex-col justify-between py-6">
              <div>
                <p className="m-0 text-[14px] font-medium text-[var(--jc-muted)]">
                  Super mid-size business jet
                </p>
                <p className="jc-display-wing mt-2 m-0 text-[var(--jc-ink)]">
                  4000
                </p>
              </div>

              <div className="max-w-[380px] border-t border-[var(--jc-line-light)] pt-5">
                <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-5 text-[13px]">
                  {aircraft.specifications.map((spec) => (
                    <div key={spec.label}>
                      <dt className="text-[11px] font-medium text-[var(--jc-muted)]">
                        {spec.label.replace(" (model reference)", "")}
                      </dt>
                      <dd className="mt-1 m-0 text-[15px] font-semibold text-[var(--jc-ink)] tabular-nums">
                        {spec.value} {spec.unit}
                      </dd>
                    </div>
                  ))}
                  <div>
                    <dt className="text-[11px] font-medium text-[var(--jc-muted)]">
                      3D Configurations
                    </dt>
                    <dd className="mt-1 m-0 text-[15px] font-semibold text-[var(--jc-ink)]">
                      Flight, Parked, Boarding
                    </dd>
                  </div>
                </dl>
                <p className="mt-5 mb-0 border-t border-[var(--jc-line-light)] pt-3 text-[12px] leading-snug text-[var(--jc-muted)]">
                  Illustrative exterior envelope and schematic study. Seating layout, range under load, and availability are confirmed per itinerary by the licensed operating carrier.
                </p>
              </div>
            </div>

            <div />

            {/* Right margin: Architectural narrative + manual Exterior / Blueprint toggle + 3D Showroom link */}
            <div className="flex h-full flex-col justify-between py-6 pr-6 text-left xl:pr-12">
              <div className="ml-auto max-w-[340px] border-t border-[var(--jc-line-light)] pt-4">
                <p className="m-0 text-[12px] font-semibold text-[var(--jc-ink)]">
                  Direct feasibility verification
                </p>
                <p className="mt-3 m-0 text-[15px] leading-relaxed text-[var(--jc-muted)]">
                  Keep scrolling to wipe from exterior 3D planform into our architectural schematic, or open the interactive 3D aircraft hub to orbit both the Hawker 4000 and Falcon 2000 Classic.
                </p>
              </div>

              <div className="ml-auto flex max-w-[340px] flex-col items-start gap-4">
                <div
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--jc-line-strong)] bg-[var(--jc-paper)] p-1"
                  role="group"
                  aria-label="Inspect planform view mode"
                >
                  {(
                    [
                      { id: "auto", label: "Scroll wipe" },
                      { id: "exterior", label: "3D Exterior" },
                      { id: "blueprint", label: "Blueprint" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setManualView(opt.id)}
                      className={cn(
                        "min-h-9 rounded-full px-3.5 text-[12px] font-medium transition-colors cursor-pointer",
                        manualView === opt.id
                          ? "bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                          : "text-[var(--jc-muted)] hover:text-[var(--jc-ink)]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <Link
                  href="/aircraft"
                  className="text-[14px] font-semibold text-[var(--jc-ink)] underline underline-offset-8 hover:opacity-75"
                >
                  Explore full 3D aircraft showroom
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // MOBILE & TABLET & REDUCED-MOTION: Jesko-style vertical nose-up architectural spread
  // =========================================================================
  const showMobileExterior = manualView === "exterior";

  return (
    <section
      id="flight"
      data-chapter="planform"
      data-nav-theme="light"
      data-surface="light"
      className="jc-light-stone jc-planform-mobile-section border-b border-[var(--jc-line-light)] pb-28 pt-20 text-[var(--jc-ink)] md:py-24"
    >
      <div className="jc-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="m-0 text-[13px] font-medium text-[var(--jc-muted)]">
              Hawker Beechcraft / Super mid-size jet
            </p>
            <h2 className="jc-display-wing mt-2 m-0 text-[var(--jc-ink)]">
              Fly on Your Terms
            </h2>
          </div>

          <div
            className="inline-flex rounded-full border border-[var(--jc-line-strong)] bg-[var(--jc-paper)] p-1"
            role="group"
            aria-label="Inspect planform view mode"
          >
            <button
              type="button"
              onClick={() => setManualView("blueprint")}
              className={cn(
                "min-h-9 rounded-full px-4 text-[12px] font-medium transition-colors cursor-pointer",
                !showMobileExterior
                  ? "bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                  : "text-[var(--jc-muted)] hover:text-[var(--jc-ink)]"
              )}
            >
              Blueprint
            </button>
            <button
              type="button"
              onClick={() => setManualView("exterior")}
              className={cn(
                "min-h-9 rounded-full px-4 text-[12px] font-medium transition-colors cursor-pointer",
                showMobileExterior
                  ? "bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                  : "text-[var(--jc-muted)] hover:text-[var(--jc-ink)]"
              )}
            >
              Exterior
            </button>
          </div>
        </div>

        {/* Dramatic Jesko-proportioned vertical nose-up showcase (with exterior toggle) */}
        <div className="jc-planform-mobile-stage mt-8 flex min-h-[380px] items-center justify-center py-4 sm:min-h-[460px]">
          {showMobileExterior ? (
            <img
              src={heroPoster.path}
              alt={heroPoster.alt}
              width={heroPoster.width}
              height={heroPoster.height}
              loading="lazy"
              className="jc-aircraft-shadow-light max-h-[340px] w-full object-contain sm:max-h-[400px]"
            />
          ) : (
            <img
              src={blueprintMedia.path}
              alt={blueprintMedia.alt}
              width={blueprintMedia.width}
              height={blueprintMedia.height}
              loading="lazy"
              className="max-h-[440px] w-full max-w-[360px] object-contain sm:max-h-[540px] sm:max-w-[440px]"
            />
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-t border-[var(--jc-line-light)] pt-5">
          <p className="jc-display-title m-0 text-[var(--jc-ink)]">
            Hawker 4000
          </p>
          <p className="m-0 text-[13px] text-[var(--jc-muted)]">
            Illustrative exterior &amp; schematic study
          </p>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[var(--jc-line-light)] pt-5 text-[13px] sm:grid-cols-4">
          {aircraft.specifications.map((spec) => (
            <div key={spec.label}>
              <dt className="text-[11px] font-medium text-[var(--jc-muted)]">
                {spec.label.replace(" (model reference)", "")}
              </dt>
              <dd className="mt-1 m-0 text-[16px] font-semibold text-[var(--jc-ink)] tabular-nums">
                {spec.value} {spec.unit}
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-[11px] font-medium text-[var(--jc-muted)]">
              3D Configurations
            </dt>
            <dd className="mt-1 m-0 text-[15px] font-semibold text-[var(--jc-ink)]">
              Flight, Parked, Boarding
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--jc-line-light)] pt-5">
          <p className="m-0 max-w-[48ch] text-[12px] leading-relaxed text-[var(--jc-muted)]">
            Seating layout, operating range under load, and availability are confirmed per itinerary by the licensed operating carrier.
          </p>
          <Link
            href="/aircraft"
            className="text-[14px] font-semibold text-[var(--jc-ink)] underline underline-offset-8"
          >
            Open interactive 3D showroom
          </Link>
        </div>
      </div>
    </section>
  );
}
