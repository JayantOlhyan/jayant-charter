"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Plane } from "lucide-react";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import countriesAtlas from "world-atlas/countries-110m.json";
import { useCallbackDrawer } from "@/components/layout/CallbackDrawerProvider";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const CORRIDOR_CITIES = [
  { name: "Delhi NCR", lat: 28.6139, lng: 77.209 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Rajasthan", lat: 24.5854, lng: 73.7125 },
  { name: "Goa", lat: 15.2993, lng: 74.124 },
  { name: "London", lat: 51.5072, lng: -0.1276 },
  { name: "Geneva", lat: 46.2044, lng: 6.1432 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Zurich", lat: 47.3769, lng: 8.5417 },
  { name: "New York", lat: 40.7128, lng: -74.006 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
];

const FLIGHT_ARCS = [
  { startLat: 28.6139, startLng: 77.209, endLat: 19.076, endLng: 72.8777 },
  { startLat: 28.6139, startLng: 77.209, endLat: 24.5854, endLng: 73.7125 },
  { startLat: 19.076, startLng: 72.8777, endLat: 15.2993, endLng: 74.124 },
  { startLat: 28.6139, startLng: 77.209, endLat: 51.5072, endLng: -0.1276 },
  { startLat: 19.076, startLng: 72.8777, endLat: 46.2044, endLng: 6.1432 },
  { startLat: 19.076, startLng: 72.8777, endLat: 1.3521, endLng: 103.8198 },
  { startLat: 28.6139, startLng: 77.209, endLat: 1.3521, endLng: 103.8198 },
  { startLat: 51.5072, startLng: -0.1276, endLat: 40.7128, endLng: -74.006 },
  { startLat: 46.2044, startLng: 6.1432, endLat: 47.3769, endLng: 8.5417 },
  { startLat: 1.3521, startLng: 103.8198, endLat: 35.6762, endLng: 139.6503 },
];

/**
 * Jesko step_22 -> step_28 Global finale rebuilt 100% originally for Jayant Charter:
 * - Top band: Feathered vertical looping city wheel ("Custom routes" --- plane --- Delhi NCR / Mumbai / London...)
 * - Bottom band: Giant rising "Global" display wordmark behind a live rotating 3D WebGL Globe.gl Earth
 *   rendered with self-hosted Natural Earth country polygons + animated flight arcs + cursor-following spotlight mask.
 */
export function JeskoGlobalGlobe() {
  const { openDrawer } = useCallbackDrawer();
  const sectionRef = useRef<HTMLElement>(null);
  const globeHostRef = useRef<HTMLDivElement>(null);
  const globeMaskRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const planeIconRef = useRef<HTMLSpanElement>(null);
  const globeInstanceRef = useRef<{
    pointOfView: (
      pov: { lat?: number; lng?: number; altitude?: number },
      transitionMs?: number
    ) => unknown;
  } | null>(null);

  const [activeCityIdx, setActiveCityIdx] = useState(0);
  const [wheelPaused, setWheelPaused] = useState(false);
  const [globeInView, setGlobeInView] = useState(false);
  const [globeReady, setGlobeReady] = useState(false);

  const activeCity = CORRIDOR_CITIES[activeCityIdx];

  const formatCoord = (lat: number, lng: number) => {
    const ns = lat >= 0 ? "N" : "S";
    const ew = lng >= 0 ? "E" : "W";
    return `${Math.abs(lat).toFixed(2)}° ${ns}  ${Math.abs(lng).toFixed(2)}° ${ew}`;
  };

  // Subtle airplane tick motion on city cycle
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced || !planeIconRef.current) return;
    gsap.fromTo(
      planeIconRef.current,
      { x: -5, opacity: 0.55 },
      { x: 0, opacity: 1, duration: 0.45, ease: "power2.out" }
    );
  }, [activeCityIdx]);

  // Smoothly fly the live 3D WebGL Globe to the selected city when user clicks a corridor
  const handleSelectCity = (idx: number) => {
    setWheelPaused(true);
    setActiveCityIdx(idx);
    const target = CORRIDOR_CITIES[idx];
    if (target && globeInstanceRef.current) {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      globeInstanceRef.current.pointOfView(
        { lat: target.lat, lng: target.lng, altitude: 1.95 },
        prefersReduced ? 0 : 950
      );
    }
  };

  // Smooth looping city wheel (exact Jesko initLoopingWords rhythm: ~1.5s cycle, pauses on hover/reduced motion)
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced || wheelPaused) return;

    const timer = window.setInterval(() => {
      setActiveCityIdx((prev) => (prev + 1) % CORRIDOR_CITIES.length);
    }, 1700);
    return () => window.clearInterval(timer);
  }, [wheelPaused]);

  // Lazy-mount WebGL Globe ONLY when approaching the closing chapter so single-active-WebGL policy holds
  useEffect(() => {
    const el = globeMaskRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setGlobeInView(true);
        }
      },
      { rootMargin: "420px 0px", threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Initialize live 3D Globe.gl with self-hosted Natural Earth polygons & curved flight arcs
  useEffect(() => {
    if (!globeInView || !globeHostRef.current) return;
    const container = globeHostRef.current;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let disposed = false;
    let resizeHandler: (() => void) | null = null;
    let rendererCleanup: (() => void) | null = null;

    (async () => {
      try {
        const mod = await import("globe.gl");
        if (disposed || !container) return;
        const GlobeCtor = mod.default;

        const topology = countriesAtlas as unknown as Topology<{
          countries: GeometryCollection;
        }>;
        const geo = feature(topology, topology.objects.countries);

        container.replaceChildren();
        const size = Math.min(container.clientWidth || 560, 620);
        const globe = new GlobeCtor(container, { animateIn: false })
          .width(size)
          .height(size)
          .backgroundColor("rgba(0,0,0,0)")
          .showGlobe(true)
          .showAtmosphere(false)
          .polygonsData(geo.features)
          .polygonCapColor(() => "#5b524e")
          .polygonSideColor(() => "#1d1716")
          .polygonStrokeColor(() => "#26201f")
          .polygonAltitude(0.008)
          .arcsData(FLIGHT_ARCS)
          .arcColor(() => ["#8d817b", "#e8c184"])
          .arcStroke(0.55)
          .arcDashLength(0.58)
          .arcDashGap(0.24)
          .arcDashAnimateTime(prefersReduced ? 0 : 7500)
          .arcsTransitionDuration(0)
          .pointsData(CORRIDOR_CITIES)
          .pointColor(() => "#e8c184")
          .pointAltitude(0.015)
          .pointRadius(0.55)
          .pointsTransitionDuration(0);

        // Matte obsidian ocean globe material matching Jesko step_28
        const mat = globe.globeMaterial() as {
          color?: { set: (hex: string) => void };
          shininess?: number;
          needsUpdate?: boolean;
        };
        if (mat) {
          mat.color?.set("#0b0909");
          mat.shininess = 0;
          mat.needsUpdate = true;
        }

        // Center initial camera over India / Eurasia / International corridors & retain handle for city fly-to
        globe.pointOfView({ lat: 24, lng: 76, altitude: 2.15 }, 0);
        globeInstanceRef.current = globe;

        const controls = globe.controls() as {
          enableZoom: boolean;
          enablePan: boolean;
          autoRotate: boolean;
          autoRotateSpeed: number;
          minPolarAngle: number;
          maxPolarAngle: number;
        };
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.autoRotate = !prefersReduced;
        controls.autoRotateSpeed = 1.6;
        controls.minPolarAngle = Math.PI * 0.36;
        controls.maxPolarAngle = Math.PI * 0.64;

        resizeHandler = () => {
          const next = Math.min(container.clientWidth || 560, 620);
          globe.width(next).height(next);
        };
        window.addEventListener("resize", resizeHandler);

        rendererCleanup = () => {
          globeInstanceRef.current = null;
          try {
            globe.pauseAnimation?.();
            globe._destructor?.();
          } catch {
            // ignore disposal race on unmount
          }
          container.replaceChildren();
        };

        if (!disposed) setGlobeReady(true);
      } catch {
        if (!disposed) setGlobeReady(false);
      }
    })();

    return () => {
      disposed = true;
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      if (rendererCleanup) rendererCleanup();
    };
  }, [globeInView]);

  // Jesko initGlobeMaskFollow + rising "Global" background typography parallax
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (prefersReduced || !isDesktop) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!globeMaskRef.current) return;
      const offset = 35 * (0.5 - e.clientX / window.innerWidth);
      gsap.to(globeMaskRef.current, {
        "--mask-x": `${(50 + offset).toFixed(1)}%`,
        duration: 2.0,
        ease: "power3.out",
        overwrite: "auto",
      });
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const ctx = gsap.context(() => {
      if (titleRef.current && sectionRef.current) {
        gsap.fromTo(
          titleRef.current,
          { yPercent: 32 },
          {
            yPercent: -6,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "center bottom",
              end: "bottom bottom",
              scrub: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      ctx.revert();
    };
  }, []);

  // Build visible 7-city window centered on activeCityIdx so the wheel loops seamlessly
  const visibleWheel = [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const idx =
      (activeCityIdx + offset + CORRIDOR_CITIES.length) % CORRIDOR_CITIES.length;
    return { ...CORRIDOR_CITIES[idx], offset, idx };
  });

  return (
    <section
      id="global"
      ref={sectionRef}
      data-nav-theme="dark"
      data-surface="dark"
      className="jc-dark-espresso relative overflow-hidden text-[var(--jc-ivory)]"
    >
      {/* =====================================================================
          UPPER BAND: Jesko step_22 Feathered Looping City Wheel
      ===================================================================== */}
      <div
        onMouseEnter={() => setWheelPaused(true)}
        onMouseLeave={() => setWheelPaused(false)}
        className="jc-container flex min-h-[68svh] flex-col justify-center py-20 md:min-h-[76svh] md:py-32"
      >
        <div className="grid grid-cols-1 items-center gap-6 text-center lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-12 lg:text-left">
          <div className="lg:text-right">
            <h2 className="jc-display-section m-0 text-[var(--jc-ivory)]">
              Custom routes
            </h2>
            <p className="mt-2 m-0 text-[14px] text-[var(--jc-ivory-muted)]">
              Select a corridor to orient the globe below
            </p>
            <p className="mt-2.5 m-0 text-[12px] font-medium text-[var(--jc-gold)] tabular-nums">
              {activeCity.name} / {formatCoord(activeCity.lat, activeCity.lng)}
            </p>
          </div>

          <div
            aria-hidden="true"
            className="mx-auto flex flex-col items-center gap-2 lg:flex-row lg:gap-4"
          >
            <span className="h-5 w-px bg-[var(--jc-line-dark-strong)] lg:h-px lg:w-16" />
            <span ref={planeIconRef} className="inline-flex will-change-transform">
              <Plane className="size-4 text-[var(--jc-ivory)]" />
            </span>
            <span className="h-5 w-px bg-[var(--jc-line-dark-strong)] lg:h-px lg:w-16" />
          </div>

          <div
            className="jc-city-mask mx-auto flex flex-col items-center gap-1 py-4 lg:mx-0 lg:items-start lg:gap-1.5 lg:py-6"
            role="tablist"
            aria-label="Active charter focus corridors"
          >
            {visibleWheel.map((item) => {
              const isCenter = item.offset === 0;
              const abs = Math.abs(item.offset);
              return (
                <button
                  key={`${item.name}-${item.offset}`}
                  type="button"
                  role="tab"
                  aria-selected={isCenter}
                  onClick={() => handleSelectCity(item.idx)}
                  className={cn(
                    "jc-wordmark w-fit text-center leading-[1.14] transition-[opacity,color] duration-300 cursor-pointer lg:text-left",
                    isCenter
                      ? "text-[32px] text-[var(--jc-ivory)] opacity-100 sm:text-[42px]"
                      : abs === 1
                        ? "text-[23px] text-[var(--jc-ivory-soft)] opacity-55 hover:opacity-85 sm:text-[30px]"
                        : "text-[19px] text-[var(--jc-ivory-muted)] opacity-25 hover:opacity-65 sm:text-[24px]"
                  )}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-8 mb-0 text-center text-[13px] text-[var(--jc-ivory-muted)]">
          Custom charters worldwide, tailored around every departure window. Not a fixed scheduled route network.
        </p>
      </div>

      {/* =====================================================================
          LOWER BAND: Jesko step_28 Giant "Global" Wordmark + Live 3D Globe.gl
      ===================================================================== */}
      <div className="relative flex min-h-[84svh] flex-col justify-end pb-16 pt-10 md:min-h-[92svh] md:pb-24 md:pt-12">
        {/* Giant background display title rising behind the globe */}
        <p
          ref={titleRef}
          aria-hidden="true"
          className="jc-wordmark pointer-events-none absolute inset-x-0 top-6 z-0 select-none text-center text-[clamp(4.8rem,23vw,20rem)] leading-[0.86] tracking-[-0.06em] text-[var(--jc-ghost-wordmark)] whitespace-nowrap"
        >
          Global
        </p>

        {/* Centered Live 3D WebGL Globe with cursor-following radial spotlight */}
        <div
          ref={globeMaskRef}
          className="jc-globe-spotlight relative z-10 mx-auto flex w-full max-w-[360px] items-center justify-center px-4 sm:max-w-[460px] lg:max-w-[620px]"
        >
          <div className="relative flex aspect-square w-full max-w-[580px] items-center justify-center">
            {/* Dedicated child-free WebGL host div so Globe.gl DOM mutations never collide with React */}
            <div
              ref={globeHostRef}
              role="img"
              aria-label="Interactive 3D globe illustrating custom international aviation corridors"
              className="absolute inset-0 flex items-center justify-center"
            />
            {!globeReady && (
              <div className="pointer-events-none relative z-10 flex size-[min(78vw,320px)] items-center justify-center rounded-full border border-[var(--jc-line-dark)] bg-[var(--jc-panel-dark)] sm:size-[440px]">
                <span className="text-[13px] text-[var(--jc-ivory-muted)]">
                  Custom worldwide itineraries
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Left & Right closing editorial anchors framing the sphere */}
        <div className="jc-container relative z-20 mt-6 grid grid-cols-1 items-end gap-10 sm:-mt-8 lg:-mt-44 lg:grid-cols-[minmax(0,1fr)_minmax(240px,1.1fr)_minmax(0,1fr)]">
          <div>
            <h3 className="jc-display-title m-0 max-w-[20ch] text-[var(--jc-ivory)]">
              Fly on your terms with total clarity and control
            </h3>
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => openDrawer()}
                className="jc-btn-gold w-full sm:w-auto"
              >
                Request a callback
              </button>
              <Link href="/aircraft" className="jc-btn-outline-light w-full sm:w-auto">
                Explore aircraft
              </Link>
            </div>
          </div>

          <div className="hidden lg:block" />

          <div className="lg:text-right">
            <p className="m-0 text-[12px] font-medium text-[var(--jc-ivory-muted)]">
              For custom inquiries
            </p>
            <p className="jc-display-title mt-2 m-0 text-[var(--jc-ivory)]">
              Direct with Jayant
            </p>
            <div className="mt-5 flex flex-wrap gap-5 border-t border-[var(--jc-line-dark)] pt-4 text-[14px] text-[var(--jc-ivory-soft)] lg:justify-end">
              <Link
                href="/services/private-jets"
                className="transition-colors hover:text-[var(--jc-ivory)]"
              >
                Private jets
              </Link>
              <Link
                href="/services/group-charter"
                className="transition-colors hover:text-[var(--jc-ivory)]"
              >
                Group charter
              </Link>
              <Link
                href="/services/helicopters"
                className="transition-colors hover:text-[var(--jc-ivory)]"
              >
                Helicopters
              </Link>
              <Link
                href="/inquire"
                className="text-[var(--jc-gold)] underline underline-offset-4 hover:text-[var(--jc-gold-hover)]"
              >
                Full inquiry form
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
