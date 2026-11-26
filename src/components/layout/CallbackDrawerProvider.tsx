"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { Plane, X } from "lucide-react";
import type { AircraftRecord, SiteSettings } from "@/content/schemas";
import { ProgressiveInquiryForm } from "@/features/inquiry/ProgressiveInquiryForm";
import { cn } from "@/lib/utils";

type ServicePref = "private-jet" | "group-charter" | "helicopter" | "decide";

interface DrawerContextValue {
  openDrawer: (opts?: {
    service?: ServicePref;
    aircraftId?: string | null;
  }) => void;
  closeDrawer: () => void;
  isOpen: boolean;
}

const CallbackDrawerContext = createContext<DrawerContextValue>({
  openDrawer: () => {},
  closeDrawer: () => {},
  isOpen: false,
});

export function useCallbackDrawer() {
  return useContext(CallbackDrawerContext);
}

interface CallbackDrawerProviderProps {
  settings: SiteSettings;
  aircraftOptions: AircraftRecord[];
  children: React.ReactNode;
}

/**
 * Jesko-inspired global Floating Magnetic Pill CTA + Slide-Up Callback Drawer:
 * - Magnetic cursor pull (power4.out follow, elastic.out(1, 0.3) return)
 * - Dual-layer character-stagger vertical roll & diagonal plane takeoff on hover
 * - Smooth slide-up bottom sheet drawer wired to the durable SQLite inquiry API
 * - Auto-hides on /inquire and over the interactive 3D showroom controls
 */
export function CallbackDrawerProvider({
  settings,
  aircraftOptions,
  children,
}: CallbackDrawerProviderProps) {
  const pathname = usePathname();
  const isInquirePage = pathname === "/inquire";

  const [isOpen, setIsOpen] = useState(false);
  const [defaultService, setDefaultService] = useState<ServicePref>("decide");
  const [defaultAircraftId, setDefaultAircraftId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [hiddenBySection, setHiddenBySection] = useState(false);
  const [hoverTick, setHoverTick] = useState(0);

  const magneticRef = useRef<HTMLButtonElement>(null);
  const drawerOverlayRef = useRef<HTMLDivElement>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const labelRow1Ref = useRef<HTMLSpanElement>(null);
  const labelRow2Ref = useRef<HTMLSpanElement>(null);
  const plane1Ref = useRef<HTMLSpanElement>(null);
  const plane2Ref = useRef<HTMLSpanElement>(null);
  const hoverAnimatingRef = useRef(false);

  const openDrawer = useCallback(
    (opts?: { service?: ServicePref; aircraftId?: string | null }) => {
      if (opts?.service) setDefaultService(opts.service);
      if (opts?.aircraftId !== undefined) setDefaultAircraftId(opts.aircraftId);
      setFormKey((k) => k + 1);
      setIsOpen(true);
    },
    []
  );

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close drawer on route navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Escape key & body scroll lock while slide-up drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-lenis-prevent", "");

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!prefersReduced && drawerOverlayRef.current && drawerPanelRef.current) {
      gsap.fromTo(
        drawerOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.45, ease: "power3.out" }
      );
      gsap.fromTo(
        drawerPanelRef.current,
        { yPercent: 100 },
        { yPercent: 0, duration: 0.72, ease: "power4.out" }
      );
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.removeAttribute("data-lenis-prevent");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  // Auto-hide pill over #inspect-aircraft or #inquire so it never blocks interactive controls
  useEffect(() => {
    if (isInquirePage) {
      setHiddenBySection(true);
      return;
    }

    const targets = [
      document.getElementById("inspect-aircraft"),
      document.getElementById("inquire"),
    ].filter((el): el is HTMLElement => Boolean(el));

    if (targets.length === 0) {
      setHiddenBySection(false);
      return;
    }

    const visibleSet = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibleSet.add(entry.target);
          else visibleSet.delete(entry.target);
        }
        setHiddenBySection(visibleSet.size > 0);
      },
      { threshold: 0.12 }
    );

    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, [isInquirePage, pathname]);

  // Jesko-style magnetic pointer pull on desktop fine pointers
  useEffect(() => {
    const btn = magneticRef.current;
    if (!btn) return;
    const finePointer = window.matchMedia(
      "(min-width: 1024px) and (pointer: fine)"
    ).matches;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!finePointer || prefersReduced) return;

    const onMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
      const dy = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
      gsap.to(btn, {
        x: dx,
        y: dy,
        duration: 0.9,
        ease: "power4.out",
        overwrite: "auto",
      });
    };

    const onLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 1.2,
        ease: "elastic.out(1, 0.35)",
        overwrite: "auto",
      });
    };

    btn.addEventListener("mousemove", onMove);
    btn.addEventListener("mouseleave", onLeave);
    return () => {
      btn.removeEventListener("mousemove", onMove);
      btn.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Jesko exact hover animation: vertical character roll + diagonal plane takeoff
  const handlePillEnter = () => {
    setHoverTick((n) => n + 1);
    if (hoverAnimatingRef.current || isOpen) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;
    if (
      !labelRow1Ref.current ||
      !labelRow2Ref.current ||
      !plane1Ref.current ||
      !plane2Ref.current
    ) {
      return;
    }

    const chars1 = labelRow1Ref.current.querySelectorAll("[data-ch]");
    const chars2 = labelRow2Ref.current.querySelectorAll("[data-ch]");
    hoverAnimatingRef.current = true;

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(chars1, { yPercent: 0, opacity: 1 });
        gsap.set(chars2, { yPercent: 100, opacity: 0 });
        gsap.set(plane1Ref.current, { xPercent: 0, yPercent: 0 });
        gsap.set(plane2Ref.current, { xPercent: -150, yPercent: 75 });
        hoverAnimatingRef.current = false;
      },
    });

    tl.fromTo(
      chars1,
      { yPercent: 0, opacity: 1 },
      { yPercent: -110, opacity: 0, duration: 0.65, ease: "power3.out", stagger: 0.01 },
      0
    )
      .fromTo(
        chars2,
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.65, ease: "power3.out", stagger: 0.01 },
        0
      )
      .fromTo(
        plane1Ref.current,
        { xPercent: 0, yPercent: 0 },
        { xPercent: 150, yPercent: -75, duration: 0.65, ease: "power3.inOut" },
        0
      )
      .fromTo(
        plane2Ref.current,
        { xPercent: -150, yPercent: 75 },
        { xPercent: 0, yPercent: 0, duration: 0.65, ease: "power3.inOut" },
        0
      );
  };

  const pillLabel = "Request a callback";
  const showPill = !isInquirePage && !hiddenBySection && !isOpen;

  return (
    <CallbackDrawerContext.Provider value={{ openDrawer, closeDrawer, isOpen }}>
      {children}

      {/* Persistent Jesko-style Magnetic Floating Pill CTA */}
      {!isInquirePage && (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 bottom-6 z-[var(--z-overlay)] flex justify-center px-4 transition-[opacity,transform] duration-300",
            showPill
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          )}
        >
          <button
            ref={magneticRef}
            type="button"
            data-hover-tick={hoverTick}
            onMouseEnter={handlePillEnter}
            onClick={() => (isOpen ? closeDrawer() : openDrawer())}
            aria-expanded={isOpen}
            aria-controls="jayant-callback-drawer"
            aria-hidden={!showPill}
            tabIndex={showPill ? 0 : -1}
            className={cn(
              "jc-pill-shadow pointer-events-auto inline-flex min-h-[52px] items-center gap-2 rounded-full border border-[var(--jc-line-light)] bg-[var(--jc-ivory)] py-1.5 pl-6 pr-1.5 text-[14px] font-semibold text-[var(--jc-teal)] whitespace-nowrap cursor-pointer",
              !showPill && "pointer-events-none"
            )}
          >
            {isOpen ? (
              <>
                <span className="pr-2">Close inquiry</span>
                <span
                  aria-hidden="true"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                >
                  <X className="size-4" />
                </span>
              </>
            ) : (
              <>
                <span className="relative inline-block overflow-hidden py-0.5 leading-none">
                  <span ref={labelRow1Ref} className="inline-flex">
                    {Array.from(pillLabel).map((ch, idx) => (
                      <span
                        key={`a-${idx}`}
                        data-ch="1"
                        className="inline-block will-change-transform"
                      >
                        {ch === " " ? "\u00A0" : ch}
                      </span>
                    ))}
                  </span>
                  <span
                    ref={labelRow2Ref}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 inline-flex py-0.5"
                  >
                    {Array.from(pillLabel).map((ch, idx) => (
                      <span
                        key={`b-${idx}`}
                        data-ch="2"
                        style={{ transform: "translateY(110%)", opacity: 0 }}
                        className="inline-block will-change-transform"
                      >
                        {ch === " " ? "\u00A0" : ch}
                      </span>
                    ))}
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className="relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                >
                  <span
                    ref={plane1Ref}
                    className="inline-flex items-center justify-center will-change-transform"
                  >
                    <Plane className="size-4" />
                  </span>
                  <span
                    ref={plane2Ref}
                    style={{ transform: "translate(-150%, 75%)" }}
                    className="pointer-events-none absolute inset-0 inline-flex items-center justify-center will-change-transform"
                  >
                    <Plane className="size-4" />
                  </span>
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Jesko-inspired Slide-Up In-Place Callback Drawer */}
      {isOpen && (
        <div
          id="jayant-callback-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="callback-drawer-title"
          className="fixed inset-0 z-[55] flex items-end justify-center p-0 sm:p-4 md:p-6"
        >
          <div
            ref={drawerOverlayRef}
            onClick={closeDrawer}
            aria-hidden="true"
            className="absolute inset-0 bg-[var(--jc-scrim-dark)] backdrop-blur-sm"
          />

          <div
            ref={drawerPanelRef}
            className="relative z-10 max-h-[86svh] w-full max-w-[920px] overflow-y-auto rounded-t-[16px] border border-[var(--jc-line-light)] bg-[var(--jc-ivory)] px-6 pb-24 pt-7 text-[var(--jc-ink)] sm:rounded-[16px] sm:px-10 sm:pb-24 sm:pt-9"
          >
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-[var(--jc-line-light)] pb-5">
              <div>
                <h2
                  id="callback-drawer-title"
                  className="jc-display-title m-0 text-[var(--jc-ink)]"
                >
                  Request a callback
                </h2>
                <p className="mt-1.5 m-0 text-[14px] text-[var(--jc-muted)]">
                  Start with your name, phone number, and contact permission. Jayant responds directly before onward feasibility checks begin.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close inquiry drawer"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--jc-line-strong)] text-[var(--jc-ink)] transition-colors hover:border-[var(--jc-teal)] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {settings.featureFlags.showPreviewBanner && (
              <p
                role="status"
                className="mb-6 rounded-[4px] border border-[var(--jc-line-strong)] bg-[var(--jc-paper)] px-4 py-3 text-[13px] text-[var(--jc-ink)]"
              >
                Preview environment: inquiries are recorded locally while direct email and WhatsApp channels remain paused.
              </p>
            )}

            <ProgressiveInquiryForm
              key={formKey}
              settings={settings}
              aircraftOptions={aircraftOptions}
              defaultService={defaultService}
              defaultAircraftId={defaultAircraftId}
              entryPage={pathname || "/"}
            />
          </div>
        </div>
      )}
    </CallbackDrawerContext.Provider>
  );
}
