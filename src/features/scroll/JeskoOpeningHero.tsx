"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";
import type { MediaAsset } from "@/content/schemas";

gsap.registerPlugin(ScrollTrigger);

interface JeskoOpeningHeroProps {
  skyDaylight: MediaAsset;
  cloudsMarquee: MediaAsset;
  cabinWindowPhoto: MediaAsset;
  windowShadePhoto: MediaAsset;
  brandName: string;
}

const ALTIMETER_TICKS = [
  4500, 4000, 3500, 3000, 2500, 2000, 1500, 1000, 500, 0,
];

/**
 * Awwwards-faithful photographic opening cabin-window experience rebuilt 100% originally:
 * 1. Fast symmetric left/right aviation altimeter preloader (0 -> FL410, ~0.9s once per session, non-blocking).
 * 2. Real photographed espresso-suede cabin bulkhead + sculpted 2-step satin bezel (feathered transparent glass cutout)
 *    paired with a real photographed woven pleated cabin blind & brushed titanium pull handle.
 * 3. Interactive handle click/tug + subtle desktop mouse-parallax depth (cabin wall vs. sunlit clouds outside).
 * 4. Scroll-scrubbed zoom-through (scale 1 -> 6.8 anchored dead-center on the oval glass at 50% 49.5%) flying
 *    straight out into the continuous azure cloud sea.
 */
export function JeskoOpeningHero({
  skyDaylight,
  cloudsMarquee,
  cabinWindowPhoto,
  windowShadePhoto,
  brandName,
}: JeskoOpeningHeroProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const preloaderRef = useRef<HTMLDivElement>(null);
  const leftScaleRef = useRef<HTMLDivElement>(null);
  const rightScaleRef = useRef<HTMLDivElement>(null);
  const flReadoutRef = useRef<HTMLSpanElement>(null);

  const windowZoomRef = useRef<HTMLDivElement>(null);
  const windowParallaxRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLImageElement>(null);
  const glassSheenRef = useRef<HTMLDivElement>(null);
  const skyParallaxRef = useRef<HTMLDivElement>(null);
  const skyLayerRef = useRef<HTMLDivElement>(null);
  const cabinDimRef = useRef<HTMLDivElement>(null);
  const leftCopyRef = useRef<HTMLDivElement>(null);
  const rightCopyRef = useRef<HTMLDivElement>(null);
  const bottomLeftRef = useRef<HTMLDivElement>(null);
  const bottomRightRef = useRef<HTMLDivElement>(null);
  const centerWordmarkRef = useRef<HTMLDivElement>(null);

  const [usePinnedZoom, setUsePinnedZoom] = useState(false);
  const [showAltimeter, setShowAltimeter] = useState(false);
  const [shadePeeking, setShadePeeking] = useState(false);

  // Desktop fine-pointer gets full pinned zoom-through; mobile & reduced motion stay clean & instant
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    setUsePinnedZoom(isDesktop && !prefersReduced);
  }, []);

  // Awwwards Element #3 (Symmetric Altimeter Climb) -> Photographic Pleated Shade Pull-Up
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const shadeEl = shadeRef.current;
    const dimEl = cabinDimRef.current;

    if (prefersReduced) {
      if (shadeEl) gsap.set(shadeEl, { yPercent: -73 });
      if (dimEl) gsap.set(dimEl, { opacity: 0 });
      return;
    }

    let alreadySeen = false;
    try {
      alreadySeen = window.sessionStorage.getItem("jc_altimeter_seen") === "1";
    } catch {
      alreadySeen = false;
    }

    const runShadePull = (delaySec: number) => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ delay: delaySec });
        if (shadeEl) {
          tl.fromTo(
            shadeEl,
            { yPercent: 0 },
            { yPercent: -73, duration: 1.15, ease: "power3.inOut" },
            0
          );
        }
        if (dimEl) {
          tl.fromTo(
            dimEl,
            { opacity: 0.44 },
            { opacity: 0, duration: 1.05, ease: "power2.out" },
            0.05
          );
        }
        if (glassSheenRef.current) {
          tl.fromTo(
            glassSheenRef.current,
            { xPercent: -90, opacity: 0 },
            {
              xPercent: 110,
              opacity: 0.35,
              duration: 1.25,
              ease: "power2.inOut",
            },
            0.35
          ).to(glassSheenRef.current, { opacity: 0, duration: 0.35 }, 1.25);
        }
      }, trackRef);
      return ctx;
    };

    if (alreadySeen) {
      const ctx = runShadePull(0.18);
      return () => ctx.revert();
    }

    // Fresh arrival: quick 0.85s symmetric altimeter climb -> shade lift!
    setShowAltimeter(true);
    try {
      window.sessionStorage.setItem("jc_altimeter_seen", "1");
    } catch {
      // ignore private-mode storage errors
    }

    let shadeCtx: gsap.Context | null = null;
    const rafId = window.requestAnimationFrame(() => {
      const altimeterObj = { fl: 0 };
      const preTl = gsap.timeline({
        onComplete: () => {
          setShowAltimeter(false);
        },
      });

      if (leftScaleRef.current && rightScaleRef.current) {
        preTl.fromTo(
          [leftScaleRef.current, rightScaleRef.current],
          { yPercent: -52 },
          { yPercent: 0, duration: 0.82, ease: "power3.inOut" },
          0
        );
      }
      preTl.to(
        altimeterObj,
        {
          fl: 410,
          duration: 0.82,
          ease: "power2.inOut",
          onUpdate: () => {
            if (flReadoutRef.current) {
              const v = Math.round(altimeterObj.fl);
              flReadoutRef.current.textContent = `FL${String(v).padStart(3, "0")}`;
            }
          },
        },
        0
      );
      if (preloaderRef.current) {
        preTl.to(
          preloaderRef.current,
          { opacity: 0, duration: 0.38, ease: "power2.out" },
          0.76
        );
      }

      shadeCtx = runShadePull(0.68);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      shadeCtx?.revert();
    };
  }, []);

  // Interactive pleated shade pull handle toggle (fun tactile micro-gimmick!)
  const handleToggleShade = () => {
    const shadeEl = shadeRef.current;
    if (!shadeEl) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const nextPeek = !shadePeeking;
    setShadePeeking(nextPeek);
    const targetY = nextPeek ? -36 : -73;
    if (prefersReduced) {
      gsap.set(shadeEl, { yPercent: targetY });
      return;
    }
    gsap.to(shadeEl, {
      yPercent: targetY,
      duration: 0.65,
      ease: "power3.out",
    });
  };

  // Subtle 3D desktop mouse-parallax depth: foreground cabin bulkhead moves opposite to clouds outside
  useEffect(() => {
    if (!usePinnedZoom) return;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer) return;

    const winX = windowParallaxRef.current
      ? gsap.quickTo(windowParallaxRef.current, "x", {
          duration: 1.1,
          ease: "power3.out",
        })
      : null;
    const winY = windowParallaxRef.current
      ? gsap.quickTo(windowParallaxRef.current, "y", {
          duration: 1.1,
          ease: "power3.out",
        })
      : null;
    const skyX = skyParallaxRef.current
      ? gsap.quickTo(skyParallaxRef.current, "x", {
          duration: 1.2,
          ease: "power3.out",
        })
      : null;
    const skyY = skyParallaxRef.current
      ? gsap.quickTo(skyParallaxRef.current, "y", {
          duration: 1.2,
          ease: "power3.out",
        })
      : null;

    const onMove = (e: MouseEvent) => {
      if (window.scrollY > window.innerHeight * 0.45) {
        winX?.(0);
        winY?.(0);
        skyX?.(0);
        skyY?.(0);
        return;
      }
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      winX?.(nx * 14);
      winY?.(ny * 8);
      skyX?.(-nx * 24);
      skyY?.(-ny * 14);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [usePinnedZoom]);

  // Jesko Scroll-Through-the-Cabin-Window Scrub Choreography
  useEffect(() => {
    if (!usePinnedZoom) return;
    const track = trackRef.current;
    if (!track) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.65,
        },
      });

      // Zoom the real photographic cabin bulkhead cleanly out through the exact oval glass center (50% 49.5%)
      if (windowZoomRef.current) {
        tl.fromTo(
          windowZoomRef.current,
          { scale: 1, opacity: 1 },
          { scale: 6.8, ease: "power2.in", duration: 0.9 },
          0
        ).to(
          windowZoomRef.current,
          { opacity: 0, duration: 0.25, ease: "power1.out" },
          0.62
        );
      }

      if (skyLayerRef.current) {
        tl.fromTo(
          skyLayerRef.current,
          { scale: 1.14 },
          { scale: 1.0, ease: "none", duration: 1 },
          0
        );
      }

      if (leftCopyRef.current) {
        tl.to(
          leftCopyRef.current,
          { xPercent: -30, opacity: 0, duration: 0.42, ease: "power2.in" },
          0.02
        );
      }
      if (rightCopyRef.current) {
        tl.to(
          rightCopyRef.current,
          { xPercent: 30, opacity: 0, duration: 0.42, ease: "power2.in" },
          0.02
        );
      }
      if (bottomLeftRef.current) {
        tl.to(
          bottomLeftRef.current,
          { yPercent: 30, opacity: 0, duration: 0.36, ease: "power2.in" },
          0.04
        );
      }
      if (bottomRightRef.current) {
        tl.to(
          bottomRightRef.current,
          { yPercent: 30, opacity: 0, duration: 0.36, ease: "power2.in" },
          0.04
        );
      }
      if (centerWordmarkRef.current) {
        tl.to(
          centerWordmarkRef.current,
          { y: -220, opacity: 0, scale: 0.85, duration: 0.5, ease: "power2.in" },
          0.06
        );
      }
    }, track);

    return () => ctx.revert();
  }, [usePinnedZoom]);

  return (
    <section
      id="hero"
      ref={trackRef}
      data-chapter="arrival"
      data-nav-theme="dark"
      data-surface="dark"
      className={
        usePinnedZoom
          ? "relative h-[230svh] bg-[var(--jc-sky-deep)] text-[var(--jc-ivory)]"
          : "relative min-h-[100svh] overflow-hidden bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
      }
    >
      {/* =====================================================================
          AWWWARDS ELEMENT #3: SYMMETRIC AVIATION ALTIMETER INTRO VEIL
          Non-blocking progressive client veil (~0.9s once per session)
      ===================================================================== */}
      {showAltimeter && (
        <div
          ref={preloaderRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[var(--z-modal)] flex items-center justify-between bg-[var(--jc-teal-deep)] px-8 text-[var(--jc-ivory)] md:px-16"
        >
          {/* Left vertical altimeter ruler scale */}
          <div className="jc-altimeter-mask relative hidden h-[64vh] w-24 overflow-hidden sm:block">
            <div
              ref={leftScaleRef}
              className="flex flex-col gap-10 py-6 text-[11px] font-medium text-[var(--jc-ivory-muted)] tabular-nums"
            >
              {ALTIMETER_TICKS.map((alt) => (
                <div key={`l-${alt}`} className="flex items-center gap-3">
                  <span className="h-px w-5 bg-[var(--jc-line-dark-strong)]" />
                  <span>{alt}</span>
                </div>
              ))}
            </div>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 border-y-[4px] border-l-[6px] border-y-transparent border-l-[var(--jc-gold)]" />
          </div>

          {/* Center flight-level climb telemetry */}
          <div className="mx-auto text-center">
            <p className="jc-brand-mark m-0 text-[24px] text-[var(--jc-ivory)] sm:text-[30px]">
              {brandName}
            </p>
            <p className="mt-2 mb-0 text-[12px] text-[var(--jc-ivory-muted)]">
              Private charter arranged around your itinerary
            </p>
            <span
              ref={flReadoutRef}
              className="mt-5 inline-block text-[13px] font-semibold text-[var(--jc-gold)] tabular-nums"
            >
              FL000
            </span>
          </div>

          {/* Right symmetric altimeter ruler scale */}
          <div className="jc-altimeter-mask relative hidden h-[64vh] w-24 overflow-hidden sm:block">
            <div
              ref={rightScaleRef}
              className="flex flex-col items-end gap-10 py-6 text-[11px] font-medium text-[var(--jc-ivory-muted)] tabular-nums"
            >
              {ALTIMETER_TICKS.map((alt) => (
                <div key={`r-${alt}`} className="flex items-center gap-3">
                  <span>{alt}</span>
                  <span className="h-px w-5 bg-[var(--jc-line-dark-strong)]" />
                </div>
              ))}
            </div>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 border-y-[4px] border-r-[6px] border-y-transparent border-r-[var(--jc-gold)]" />
          </div>
        </div>
      )}

      <div
        className={
          usePinnedZoom
            ? "sticky top-0 h-[100svh] w-full overflow-hidden"
            : "relative flex min-h-[100svh] w-full flex-col justify-between overflow-hidden"
        }
      >
        {/* LAYER 0: Luminous daylight high-altitude sky + infinite mirror-tiled 48s cloud drift */}
        <div
          ref={skyLayerRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 origin-center will-change-transform"
        >
          <div
            ref={skyParallaxRef}
            className="absolute -inset-6 will-change-transform"
          >
            <img
              src={skyDaylight.path}
              alt=""
              width={skyDaylight.width}
              height={skyDaylight.height}
              fetchPriority="high"
              className="h-full w-full object-cover object-center"
            />

            {/* Seamless mirror-tiled 48-second horizontal cloud drift (2px tile overlap prevents subpixel seam) */}
            <div className="jc-cloud-marquee absolute inset-0 flex w-[400%] opacity-60 mix-blend-screen">
              <img
                src={cloudsMarquee.path}
                alt=""
                width={cloudsMarquee.width}
                height={cloudsMarquee.height}
                className="h-full w-[calc(25%+2px)] shrink-0 object-cover"
              />
              <img
                src={cloudsMarquee.path}
                alt=""
                width={cloudsMarquee.width}
                height={cloudsMarquee.height}
                className="-ml-[2px] h-full w-[calc(25%+2px)] shrink-0 -scale-x-100 object-cover"
              />
              <img
                src={cloudsMarquee.path}
                alt=""
                width={cloudsMarquee.width}
                height={cloudsMarquee.height}
                className="-ml-[2px] h-full w-[calc(25%+2px)] shrink-0 object-cover"
              />
              <img
                src={cloudsMarquee.path}
                alt=""
                width={cloudsMarquee.width}
                height={cloudsMarquee.height}
                className="-ml-[2px] h-full w-[calc(25%+2px)] shrink-0 -scale-x-100 object-cover"
              />
            </div>
          </div>

          {/* Multi-stop eased azure sky bottom handoff into Cloud Philosophy section */}
          <div className="jc-sky-hero-over absolute inset-x-0 bottom-0 h-[42%]" />
        </div>

        {/* LAYER 1: REAL PHOTOGRAPHED ESPRESSO-SUEDE CABIN WINDOW + REAL WOVEN PLEATED BLIND */}
        <div
          ref={windowZoomRef}
          data-plane="hero-window"
          style={{ transformOrigin: "50% 49.5%" }}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden will-change-transform"
        >
          <div
            ref={windowParallaxRef}
            className="jc-window-cover-stage relative shrink-0 scale-[1.03] will-change-transform"
          >
            {/* Exact aligned oval glass aperture slot (x: 38.6%..61.4%, y: 21.3%..77.7%) holding the pleated blind */}
            <div
              style={{
                left: "38.6%",
                top: "21.3%",
                width: "22.8%",
                height: "56.4%",
              }}
              className="absolute overflow-hidden"
            >
              {/* Subtle animated diagonal curved-glass reflection sheen */}
              <div
                ref={glassSheenRef}
                aria-hidden="true"
                className="jc-glass-sheen pointer-events-none absolute inset-0 z-20 opacity-0 will-change-transform"
              />

              {/* Real photographed accordion-pleated cabin blind with brushed titanium pull handle */}
              <img
                ref={shadeRef}
                src={windowShadePhoto.path}
                alt=""
                width={windowShadePhoto.width}
                height={windowShadePhoto.height}
                fetchPriority="high"
                className="relative z-10 h-full w-full object-cover object-bottom will-change-transform"
              />
            </div>

            {/* Real photographed espresso suede bulkhead & sculpted 2-step bezel with transparent alpha oval glass */}
            <img
              src={cabinWindowPhoto.path}
              alt=""
              width={cabinWindowPhoto.width}
              height={cabinWindowPhoto.height}
              fetchPriority="high"
              className="relative z-20 h-full w-full object-fill select-none"
            />
          </div>
        </div>

        {/* Initial dark cabin interior wash that lifts as the blind opens */}
        <div
          ref={cabinDimRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-15 bg-[var(--jc-teal-deep)] opacity-0"
        />

        {/* Mobile-only contrast scrim so foreground typography stays crisp over bright clouds */}
        <div
          aria-hidden="true"
          className="jc-mobile-hero-scrim pointer-events-none absolute inset-0 z-15 lg:hidden"
        />

        {/* Interactive invisible hit target over the upper window shade pull handle (desktop delight!) */}
        <button
          type="button"
          onClick={handleToggleShade}
          aria-label={
            shadePeeking
              ? "Raise cabin window shade"
              : "Lower cabin window shade partially"
          }
          title={
            shadePeeking ? "Raise window blind" : "Pull window blind down"
          }
          className="hidden lg:block absolute left-1/2 top-[22%] z-30 h-14 w-36 -translate-x-1/2 cursor-grab rounded-full active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-[var(--jc-gold)]"
        />

        {/* Window-centered sculpted Jayant Charter crest (high-contrast deep espresso + crisp ivory outline over sunlit clouds) */}
        <div
          ref={centerWordmarkRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[53%] z-20 hidden -translate-y-1/2 items-center justify-center lg:flex will-change-transform"
        >
          <div className="inline-flex items-center gap-3 px-4 py-1.5">
            <span className="h-[1.5px] w-5 bg-[var(--jc-gold-muted)]" />
            <span className="jc-window-brand text-[21px] leading-none whitespace-nowrap xl:text-[23px]">
              {brandName}
            </span>
            <span className="h-[1.5px] w-5 bg-[var(--jc-gold-muted)]" />
          </div>
        </div>

        {/* LAYER 2: Jesko Monumental Split-Corner Editorial Typography */}
        <div className="relative z-20 mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col justify-between px-[var(--gutter)] pb-20 pt-[100px] lg:pb-14 lg:pt-[118px]">
          {/* Upper-left primary display half */}
          <div
            ref={leftCopyRef}
            className="max-w-[540px] will-change-transform"
          >
            <h1 className="jc-display-monumental jc-hero-outline m-0 text-[var(--jc-ivory)]">
              Private
              <br />
              charter
              <span className="sr-only"> for your itinerary.</span>
            </h1>
          </div>

          {/* Middle-right monumental display half */}
          <div
            ref={rightCopyRef}
            className="ml-auto max-w-[600px] text-right will-change-transform"
          >
            <p
              aria-hidden="true"
              className="jc-display-monumental jc-hero-outline m-0 text-[var(--jc-ivory)]"
            >
              for your
              <br />
              itinerary.
            </p>
          </div>

          {/* Bottom split architectural strip: Quiet statement left | Scroll cue right */}
          <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-[minmax(0,360px)_1fr_minmax(0,380px)]">
            <div ref={bottomLeftRef} className="will-change-transform">
              <p className="jc-display-title m-0 text-[var(--jc-ivory)]">
                Your trip arranged
                <br />
                around your time
              </p>
              <div className="my-4 h-px w-8 bg-[var(--jc-line-dark-strong)]" />
              <p className="m-0 max-w-[36ch] text-[14px] leading-relaxed text-[var(--jc-ivory-soft)]">
                Private jets, group charters, and helicopters coordinated around your schedule, with Jayant as your first point of contact.
              </p>
            </div>

            <div className="hidden lg:block" />

            <div
              ref={bottomRightRef}
              className="hidden lg:block will-change-transform"
            >
              <div className="mb-3.5 h-px w-full bg-[var(--jc-line-dark-strong)]" />
              <div className="flex items-center justify-between gap-4 text-[12px] font-medium text-[var(--jc-ivory)]">
                <a
                  href="#about"
                  className="group inline-flex items-center gap-2 transition-opacity hover:opacity-80"
                >
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 text-[var(--jc-ivory-soft)] transition-transform duration-300 ease-out group-hover:translate-y-0.5"
                  />
                  <span>Scroll down</span>
                </a>
                <span className="text-[var(--jc-ivory-soft)]">
                  To begin the journey
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
