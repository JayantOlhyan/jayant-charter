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
 * Multi-aspect-ratio photographic cabin-window opening experience tuned for phones (360-430px),
 * tablets (768x1024), laptops (1280x720 / 1440x900), and ultrawide (2560x1080):
 * 1. Snappy symmetric aviation altimeter intro climb (0 -> FL410, ~0.6s once per session, non-blocking).
 * 2. Real photographed espresso-suede cabin bulkhead + sculpted 2-step bezel seamlessly extended via
 *    matching #17120d suede surround so the full oval bezel frames cleanly on every aspect ratio.
 * 3. Real photographed woven pleated cabin blind with interactive handle tug + mouse-parallax depth.
 * 4. Smooth scroll-scrubbed zoom-through on mobile, tablet, AND desktop (auto-disabled under reduced motion).
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
  const [isDesktop, setIsDesktop] = useState(false);
  const [showAltimeter, setShowAltimeter] = useState(false);
  const [shadePeeking, setShadePeeking] = useState(false);

  // Enable smooth scroll zoom-through across ALL viewports (mobile, tablet, desktop) unless reduced motion is requested
  useEffect(() => {
    const syncViewport = () => {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      setUsePinnedZoom(!prefersReduced);
      setIsDesktop(window.matchMedia("(min-width: 1024px)").matches);
    };
    syncViewport();
    window.addEventListener("resize", syncViewport, { passive: true });
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  // Deterministic Altimeter Climb (0.58s) -> Photographic Pleated Shade Pull-Up (finishes cleanly by ~1.4s on all devices)
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

    const startShadeTimeline = (delaySec: number) => {
      const tl = gsap.timeline({ delay: delaySec });
      if (shadeEl) {
        tl.fromTo(
          shadeEl,
          { yPercent: 0 },
          { yPercent: -73, duration: 0.92, ease: "power3.inOut" },
          0
        );
      }
      if (dimEl) {
        tl.fromTo(
          dimEl,
          { opacity: 0.42 },
          { opacity: 0, duration: 0.85, ease: "power2.out" },
          0.04
        );
      }
      if (glassSheenRef.current) {
        tl.fromTo(
          glassSheenRef.current,
          { xPercent: -90, opacity: 0 },
          {
            xPercent: 110,
            opacity: 0.34,
            duration: 1.05,
            ease: "power2.inOut",
          },
          0.25
        ).to(glassSheenRef.current, { opacity: 0, duration: 0.3 }, 1.0);
      }
      return tl;
    };

    if (alreadySeen) {
      const tl = startShadeTimeline(0.12);
      return () => {
        tl.kill();
      };
    }

    setShowAltimeter(true);
    try {
      window.sessionStorage.setItem("jc_altimeter_seen", "1");
    } catch {
      // ignore private-mode storage errors
    }

    let preTl: gsap.core.Timeline | null = null;
    const shadeTl = startShadeTimeline(0.46);

    const rafId = window.requestAnimationFrame(() => {
      const altimeterObj = { fl: 0 };
      preTl = gsap.timeline({
        onComplete: () => {
          setShowAltimeter(false);
        },
      });

      if (leftScaleRef.current && rightScaleRef.current) {
        preTl.fromTo(
          [leftScaleRef.current, rightScaleRef.current],
          { yPercent: -52 },
          { yPercent: 0, duration: 0.62, ease: "power3.inOut" },
          0
        );
      }
      preTl.to(
        altimeterObj,
        {
          fl: 410,
          duration: 0.62,
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
          { opacity: 0, duration: 0.32, ease: "power2.out" },
          0.54
        );
      }
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      preTl?.kill();
      shadeTl.kill();
    };
  }, []);

  // Interactive pleated shade pull handle toggle
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

  // Subtle 3D desktop mouse-parallax depth (fine pointer desktop only)
  useEffect(() => {
    if (!usePinnedZoom || !isDesktop) return;
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
  }, [usePinnedZoom, isDesktop]);

  // Jesko Scroll-Through-the-Cabin-Window Scrub Choreography (Mobile, Tablet & Desktop!)
  useEffect(() => {
    if (!usePinnedZoom) return;
    const track = trackRef.current;
    if (!track) return;

    const targetScale = isDesktop ? 6.8 : 5.4;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.55,
        },
      });

      if (windowZoomRef.current) {
        tl.fromTo(
          windowZoomRef.current,
          { scale: 1, opacity: 1 },
          { scale: targetScale, ease: "power2.in", duration: 0.9 },
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
          { scale: 1.12 },
          { scale: 1.0, ease: "none", duration: 1 },
          0
        );
      }

      if (leftCopyRef.current) {
        tl.to(
          leftCopyRef.current,
          { xPercent: -26, opacity: 0, duration: 0.4, ease: "power2.in" },
          0.02
        );
      }
      if (rightCopyRef.current) {
        tl.to(
          rightCopyRef.current,
          { xPercent: 26, opacity: 0, duration: 0.4, ease: "power2.in" },
          0.02
        );
      }
      if (bottomLeftRef.current) {
        tl.to(
          bottomLeftRef.current,
          { yPercent: 28, opacity: 0, duration: 0.36, ease: "power2.in" },
          0.04
        );
      }
      if (bottomRightRef.current) {
        tl.to(
          bottomRightRef.current,
          { yPercent: 28, opacity: 0, duration: 0.36, ease: "power2.in" },
          0.04
        );
      }
      if (centerWordmarkRef.current) {
        tl.to(
          centerWordmarkRef.current,
          { y: -180, opacity: 0, scale: 0.85, duration: 0.48, ease: "power2.in" },
          0.06
        );
      }
    }, track);

    return () => ctx.revert();
  }, [usePinnedZoom, isDesktop]);

  return (
    <section
      id="hero"
      ref={trackRef}
      data-chapter="arrival"
      data-nav-theme="dark"
      data-surface="dark"
      className={
        usePinnedZoom
          ? "relative h-[175svh] bg-[var(--jc-sky-deep)] text-[var(--jc-ivory)] lg:h-[225svh]"
          : "relative min-h-[100svh] overflow-hidden bg-[var(--jc-cabin-wall)] text-[var(--jc-ivory)]"
      }
    >
      {/* Symmetric Aviation Altimeter Preloader (~0.6s once per session, non-blocking) */}
      {showAltimeter && (
        <div
          ref={preloaderRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[var(--z-modal)] flex items-center justify-between bg-[var(--jc-teal-deep)] px-6 text-[var(--jc-ivory)] sm:px-10 md:px-16"
        >
          <div className="jc-altimeter-mask relative hidden h-[60vh] w-20 overflow-hidden sm:block md:w-24">
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

          <div className="mx-auto text-center">
            <p className="jc-brand-mark m-0 text-[22px] text-[var(--jc-ivory)] sm:text-[28px]">
              {brandName}
            </p>
            <p className="mt-2 mb-0 text-[12px] text-[var(--jc-ivory-muted)]">
              Private charter arranged around your itinerary
            </p>
            <span
              ref={flReadoutRef}
              className="mt-4 inline-block text-[13px] font-semibold text-[var(--jc-gold)] tabular-nums"
            >
              FL000
            </span>
          </div>

          <div className="jc-altimeter-mask relative hidden h-[60vh] w-20 overflow-hidden sm:block md:w-24">
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

          <div className="jc-sky-hero-over absolute inset-x-0 bottom-0 h-[42%]" />
        </div>

        {/* LAYER 1: UNIVERSAL MULTI-ASPECT-RATIO PHOTOGRAPHIC CABIN WINDOW + PLEATED BLIND */}
        <div
          ref={windowZoomRef}
          data-plane="hero-window"
          style={{ transformOrigin: "50% 49.5%" }}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden will-change-transform"
        >
          <div
            ref={windowParallaxRef}
            className="jc-window-cover-stage relative shrink-0 will-change-transform"
          >
            {/* Exact oval glass aperture slot (x: 38.6%..61.4%, y: 21.3%..77.7%) holding the pleated blind */}
            <div
              style={{
                left: "38.6%",
                top: "21.3%",
                width: "22.8%",
                height: "56.4%",
              }}
              className="absolute overflow-hidden"
            >
              <div
                ref={glassSheenRef}
                aria-hidden="true"
                className="jc-glass-sheen pointer-events-none absolute inset-0 z-20 opacity-0 will-change-transform"
              />

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

            {/* Real photographed espresso suede bulkhead & sculpted 2-step bezel with feathered transparent oval glass */}
            <img
              src={cabinWindowPhoto.path}
              alt=""
              width={cabinWindowPhoto.width}
              height={cabinWindowPhoto.height}
              fetchPriority="high"
              className="relative z-20 h-full w-full object-fill select-none"
            />

            {/* Soft inset perimeter blend sealing the photograph invisibly into the #17120d surround on tall phones & ultrawides */}
            <div
              aria-hidden="true"
              className="jc-cabin-edge-blend pointer-events-none absolute inset-0 z-30"
            />
          </div>
        </div>

        {/* Initial dark cabin interior wash that lifts as the blind opens */}
        <div
          ref={cabinDimRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-15 bg-[var(--jc-teal-deep)] opacity-0"
        />

        {/* Interactive invisible hit target over the upper window shade pull handle (desktop) */}
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

        {/* Window-centered sculpted Jayant Charter crest (fluidly scaled to both viewport width & height so it stays inside the oval glass on every ratio including 844x390 landscape) */}
        <div
          ref={centerWordmarkRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[52%] z-20 flex -translate-y-1/2 items-center justify-center sm:top-[53%] will-change-transform"
        >
          <div className="inline-flex items-center gap-1.5 px-2 py-1 sm:gap-2.5 sm:px-3">
            <span className="h-[1.5px] w-2 bg-[var(--jc-gold-muted)] sm:w-4" />
            <span className="jc-window-brand jc-window-brand-fluid leading-none whitespace-nowrap">
              {brandName}
            </span>
            <span className="h-[1.5px] w-2 bg-[var(--jc-gold-muted)] sm:w-4" />
          </div>
        </div>

        {/* LAYER 2: Jesko Monumental Split-Corner Editorial Typography tuned for every aspect ratio */}
        <div className="jc-hero-shell relative z-20 mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col justify-between px-[var(--gutter)]">
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

          {/* Lower-right on portrait phones/tablets/square (clear of oval bezel!) -> middle-right on landscape & desktop */}
          <div
            ref={rightCopyRef}
            className="jc-hero-right-copy ml-auto max-w-[600px] text-right will-change-transform"
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

          {/* Bottom split architectural strip (clean & uncluttered on phones, full descriptor on lg+) */}
          <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[minmax(0,300px)_1fr_minmax(0,340px)] xl:grid-cols-[minmax(0,360px)_1fr_minmax(0,380px)] lg:gap-8">
            <div ref={bottomLeftRef} className="will-change-transform">
              <p className="jc-display-title jc-hero-outline m-0 text-[16px] text-[var(--jc-ivory)] sm:text-[20px] lg:text-[clamp(1.2rem,1.65vw,1.6rem)]">
                Your trip arranged
                <br />
                around your time
              </p>
              <div className="my-3.5 hidden h-px w-8 bg-[var(--jc-line-dark-strong)] lg:block" />
              <p className="m-0 hidden max-w-[30ch] text-[13.5px] leading-relaxed text-[var(--jc-ivory-soft)] lg:block xl:max-w-[36ch] xl:text-[14px]">
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
