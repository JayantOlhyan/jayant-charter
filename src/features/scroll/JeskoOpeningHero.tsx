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
  brandName: string;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Jesko-inspired opening cabin window sequence rebuilt 100% originally for Jayant Charter:
 * - Animated oval cabin window shade + recessed brushed thumb knob glide upward on load
 * - Seamless 48s horizontal cloud marquee framed through the sculpted espresso bulkhead aperture
 * - On scroll, the cabin wall scales 1 -> 6.8x as left/right monumental headlines sweep clear,
 *   flying the visitor smoothly through the oval window directly into open daylight sky.
 */
export function JeskoOpeningHero({
  skyDaylight,
  cloudsMarquee,
  brandName,
}: JeskoOpeningHeroProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const windowWallRef = useRef<HTMLDivElement>(null);
  const skyLayerRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<SVGGElement>(null);
  const knobRef = useRef<SVGGElement>(null);
  const cabinDimRef = useRef<HTMLDivElement>(null);
  const leftCopyRef = useRef<HTMLDivElement>(null);
  const rightCopyRef = useRef<HTMLDivElement>(null);
  const bottomLeftRef = useRef<HTMLDivElement>(null);
  const bottomRightRef = useRef<HTMLDivElement>(null);
  const centerWordmarkRef = useRef<HTMLDivElement>(null);

  const [usePinnedZoom, setUsePinnedZoom] = useState(false);

  // 1. Opening cabin shade pull-up + gentle blur reveal (fast, non-blocking, honors reduced motion)
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    setUsePinnedZoom(isDesktop && !prefersReduced);

    let visited = false;
    try {
      visited = sessionStorage.getItem("jc_window_opened") === "1";
      sessionStorage.setItem("jc_window_opened", "1");
    } catch {
      // ignore private mode
    }

    if (prefersReduced) {
      if (shadeRef.current) {
        shadeRef.current.style.transform = "translateY(-92%) scaleY(0.45)";
      }
      if (knobRef.current) {
        knobRef.current.style.transform = "translateY(-520px)";
      }
      if (cabinDimRef.current) {
        cabinDimRef.current.style.opacity = "0";
      }
      return;
    }

    const delay = visited ? 0.12 : 0.35;
    const ctx = gsap.context(() => {
      if (shadeRef.current) {
        gsap.fromTo(
          shadeRef.current,
          { yPercent: 0, scaleY: 1, transformOrigin: "50% 0%" },
          {
            yPercent: -92,
            scaleY: 0.48,
            duration: 1.2,
            delay,
            ease: "power4.inOut",
          }
        );
      }
      if (knobRef.current) {
        gsap.fromTo(
          knobRef.current,
          { y: 0 },
          {
            y: -520,
            duration: 1.2,
            delay,
            ease: "power4.inOut",
          }
        );
      }
      if (cabinDimRef.current) {
        gsap.fromTo(
          cabinDimRef.current,
          { opacity: 0.72 },
          {
            opacity: 0,
            duration: 1.15,
            delay: delay + 0.15,
            ease: "power3.out",
          }
        );
      }
      const revealEls = [
        leftCopyRef.current,
        rightCopyRef.current,
        bottomLeftRef.current,
        bottomRightRef.current,
      ].filter(Boolean);
      if (revealEls.length > 0) {
        gsap.fromTo(
          revealEls,
          { opacity: 0, filter: "blur(22px)", y: 12 },
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            duration: 1.0,
            delay: delay + 0.28,
            stagger: 0.08,
            ease: "power3.out",
            clearProps: "filter",
          }
        );
      }
    }, trackRef);

    return () => ctx.revert();
  }, []);

  // 2. Scroll-through-the-cabin-window zoom choreography (Jesko initAllParallax parity)
  useEffect(() => {
    if (!usePinnedZoom) return;
    const track = trackRef.current;
    if (!track) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const p = clamp01(self.progress);

          // Scale sculpted cabin window wall 1 -> 6.8x right past the viewport edges
          if (windowWallRef.current) {
            const wallScale = lerp(1, 6.8, p * p * 0.7 + p * 0.3);
            const wallX = lerp(0, -1.5, p);
            const wallOpacity = p > 0.76 ? clamp01(1 - (p - 0.76) / 0.18) : 1;
            windowWallRef.current.style.transform = `translate3d(${wallX.toFixed(2)}%, 0, 0) scale(${wallScale.toFixed(3)})`;
            windowWallRef.current.style.opacity = wallOpacity.toFixed(3);
          }

          // Sky deck behind the window expands gently into full-horizon vista
          if (skyLayerRef.current) {
            const skyScale = lerp(1.02, 1.14, p);
            const skyY = lerp(0, -6, p);
            skyLayerRef.current.style.transform = `translate3d(0, ${skyY.toFixed(2)}%, 0) scale(${skyScale.toFixed(3)})`;
          }

          // Monumental split headlines sweep cleanly left & right out of the flight path
          const copyFade = clamp01(1 - p / 0.44);
          if (leftCopyRef.current) {
            leftCopyRef.current.style.transform = `translate3d(${lerp(0, -44, p).toFixed(2)}vw, 0, 0) scale(${lerp(1, 1.35, p).toFixed(3)})`;
            leftCopyRef.current.style.opacity = copyFade.toFixed(3);
          }
          if (rightCopyRef.current) {
            rightCopyRef.current.style.transform = `translate3d(${lerp(0, 44, p).toFixed(2)}vw, 0, 0) scale(${lerp(1, 1.35, p).toFixed(3)})`;
            rightCopyRef.current.style.opacity = copyFade.toFixed(3);
          }
          if (bottomLeftRef.current) {
            bottomLeftRef.current.style.transform = `translate3d(${lerp(0, -32, p).toFixed(2)}vw, 0, 0)`;
            bottomLeftRef.current.style.opacity = copyFade.toFixed(3);
          }
          if (bottomRightRef.current) {
            bottomRightRef.current.style.transform = `translate3d(${lerp(0, 32, p).toFixed(2)}vw, 0, 0)`;
            bottomRightRef.current.style.opacity = copyFade.toFixed(3);
          }

          // Window-centered wordmark glides upward toward top-center nav
          if (centerWordmarkRef.current) {
            const wmFade = clamp01(1 - p / 0.55);
            centerWordmarkRef.current.style.transform = `translate3d(0, ${lerp(0, -38, p).toFixed(2)}vh, 0) scale(${lerp(1.18, 0.85, p).toFixed(3)})`;
            centerWordmarkRef.current.style.opacity = wmFade.toFixed(3);
          }
        },
      });
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
      <div
        className={
          usePinnedZoom
            ? "sticky top-0 h-[100svh] w-full overflow-hidden"
            : "relative flex min-h-[100svh] w-full flex-col justify-between overflow-hidden"
        }
      >
        {/* LAYER 0: Luminous daylight high-altitude sky + infinite 48s cloud marquee */}
        <div
          ref={skyLayerRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 origin-center will-change-transform"
        >
          <img
            src={skyDaylight.path}
            alt=""
            width={skyDaylight.width}
            height={skyDaylight.height}
            fetchPriority="high"
            className="h-full w-full object-cover object-center"
          />

          {/* Seamless 48-second horizontal cloud drift (mirror-tiled to eliminate seams) */}
          <div className="jc-cloud-marquee absolute inset-0 flex w-[400%] opacity-60 mix-blend-screen">
            <img
              src={cloudsMarquee.path}
              alt=""
              width={cloudsMarquee.width}
              height={cloudsMarquee.height}
              className="h-full w-1/4 object-cover"
            />
            <img
              src={cloudsMarquee.path}
              alt=""
              width={cloudsMarquee.width}
              height={cloudsMarquee.height}
              className="h-full w-1/4 -scale-x-100 object-cover"
            />
            <img
              src={cloudsMarquee.path}
              alt=""
              width={cloudsMarquee.width}
              height={cloudsMarquee.height}
              className="h-full w-1/4 object-cover"
            />
            <img
              src={cloudsMarquee.path}
              alt=""
              width={cloudsMarquee.width}
              height={cloudsMarquee.height}
              className="h-full w-1/4 -scale-x-100 object-cover"
            />
          </div>

          {/* Multi-stop eased azure sky bottom handoff into Cloud Philosophy section */}
          <div className="jc-sky-hero-over absolute inset-x-0 bottom-0 h-[42%]" />
        </div>

        {/* LAYER 1: Sculpted Private-Jet Espresso Bulkhead + Oval Cabin Window + Animated Pull-Up Shade */}
        <div
          ref={windowWallRef}
          data-plane="hero-window"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 origin-center will-change-transform"
        >
          <svg
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMid slice"
            className="h-full w-full"
          >
            <defs>
              {/* Warm espresso sculpted cabin bulkhead radial bounce lighting */}
              <radialGradient id="jcBulkheadLight" cx="50%" cy="49%" r="64%">
                <stop offset="0%" stopColor="#655952" />
                <stop offset="32%" stopColor="#4c413c" />
                <stop offset="68%" stopColor="#2c2321" />
                <stop offset="100%" stopColor="#161110" />
              </radialGradient>

              {/* Sculpted satin outer window surround bezel */}
              <linearGradient id="jcBezelOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#cbc4bc" />
                <stop offset="35%" stopColor="#948c84" />
                <stop offset="70%" stopColor="#6e6660" />
                <stop offset="100%" stopColor="#b9b0a6" />
              </linearGradient>

              {/* Recessed inner reveal bevel catching daylight from the clouds */}
              <linearGradient id="jcBezelInner" x1="15%" y1="0%" x2="85%" y2="100%">
                <stop offset="0%" stopColor="#726c68" />
                <stop offset="48%" stopColor="#e8e3dc" />
                <stop offset="100%" stopColor="#b7c3cc" />
              </linearGradient>

              {/* Pleated recessed cabin window blind */}
              <linearGradient id="jcShadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#cbc3b9" />
                <stop offset="65%" stopColor="#a79e95" />
                <stop offset="100%" stopColor="#7f766e" />
              </linearGradient>

              {/* Clip path strictly inside the oval glass aperture */}
              <clipPath id="jcWindowApertureClip">
                <rect x="526" y="132" width="388" height="632" rx="194" ry="194" />
              </clipPath>
            </defs>

            {/* Recessed glass inner shadow vignette + animated pull-up cabin blind clipped inside aperture */}
            <g clipPath="url(#jcWindowApertureClip)">
              <rect
                x="526"
                y="132"
                width="388"
                height="632"
                fill="none"
                stroke="rgba(20,16,16,0.34)"
                strokeWidth="26"
              />
              {/* Animated pull-up cabin window blind */}
              <g ref={shadeRef}>
                <rect x="520" y="128" width="400" height="642" fill="url(#jcShadeGrad)" />
                {/* Subtle horizontal architectural shade pleats */}
                {Array.from({ length: 18 }).map((_, i) => (
                  <line
                    key={i}
                    x1="520"
                    x2="920"
                    y1={152 + i * 34}
                    y2={152 + i * 34}
                    stroke="rgba(49,39,38,0.16)"
                    strokeWidth="1.5"
                  />
                ))}
                {/* Bottom weighted shade rail */}
                <rect x="520" y="738" width="400" height="32" fill="#6f665f" />
              </g>
              {/* Sculpted recessed shade thumb knob */}
              <g ref={knobRef}>
                <rect
                  x="676"
                  y="732"
                  width="88"
                  height="26"
                  rx="13"
                  fill="#d5cec6"
                  stroke="#5d554f"
                  strokeWidth="2"
                />
                <rect x="694" y="741" width="52" height="8" rx="4" fill="#8b827b" />
              </g>
            </g>

            {/* Sculpted outer frame shadow ring */}
            <rect
              x="448"
              y="56"
              width="544"
              height="784"
              rx="272"
              ry="272"
              fill="none"
              stroke="rgba(12,9,8,0.52)"
              strokeWidth="44"
            />

            {/* Main espresso bulkhead wall with true evenodd oval cutout */}
            <path
              fillRule="evenodd"
              fill="url(#jcBulkheadLight)"
              d="M0 0 H1440 V900 H0 Z M720 120 C834 120 924 210 924 324 V572 C924 686 834 776 720 776 C606 776 516 686 516 572 V324 C516 210 606 120 720 120 Z"
            />

            {/* Sculpted satin outer window surround molding */}
            <rect
              x="472"
              y="78"
              width="496"
              height="740"
              rx="248"
              ry="248"
              fill="none"
              stroke="url(#jcBezelOuter)"
              strokeWidth="52"
            />

            {/* Inner crisp glass reveal trim */}
            <rect
              x="512"
              y="118"
              width="416"
              height="660"
              rx="208"
              ry="208"
              fill="none"
              stroke="url(#jcBezelInner)"
              strokeWidth="22"
            />
            <rect
              x="524"
              y="130"
              width="392"
              height="636"
              rx="196"
              ry="196"
              fill="none"
              stroke="rgba(49,39,38,0.28)"
              strokeWidth="3"
            />
          </svg>
        </div>

        {/* Initial dark cabin interior wash that lifts as the blind opens */}
        <div
          ref={cabinDimRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-15 bg-[var(--jc-teal-deep)] opacity-0"
        />

        {/* Mobile-only contrast scrim so foreground typography stays razor-sharp over sunlit clouds on small screens */}
        <div
          aria-hidden="true"
          className="jc-mobile-hero-scrim pointer-events-none absolute inset-0 z-15 lg:hidden"
        />

        {/* Window-centered subtle Jayant Charter mark (glides up toward nav on scroll) */}
        <div
          ref={centerWordmarkRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 hidden items-center justify-center lg:flex will-change-transform"
        >
          <span className="jc-wordmark text-[26px] tracking-[-0.02em] text-[var(--jc-ivory)] opacity-90 drop-shadow-sm">
            {brandName}
          </span>
        </div>

        {/* LAYER 2: Jesko Monumental Split-Corner Editorial Typography */}
        <div className="relative z-20 mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col justify-between px-[var(--gutter)] pb-20 pt-[100px] lg:pb-14 lg:pt-[118px]">
          {/* Upper-left primary display half */}
          <div
            ref={leftCopyRef}
            className="max-w-[540px] will-change-transform"
          >
            <h1 className="jc-display-monumental m-0 text-[var(--jc-ivory)]">
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
              className="jc-display-monumental m-0 text-[var(--jc-ivory)]"
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
                  className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
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
