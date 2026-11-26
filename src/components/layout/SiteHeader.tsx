"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCallbackDrawer } from "@/components/layout/CallbackDrawerProvider";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/content/schemas";

interface SiteHeaderProps {
  settings: SiteSettings;
  showCaseStudies: boolean;
  showInsights: boolean;
}

const SERVICE_LINKS = [
  {
    href: "/services/private-jets",
    label: "Private jets",
    detail: "Executive, family, and multi-stop journeys",
  },
  {
    href: "/services/group-charter",
    label: "Group charter",
    detail: "Corporate teams and 22+ guest movements",
  },
  {
    href: "/services/helicopters",
    label: "Helicopters",
    detail: "Wedding arrivals and airport-to-venue transfers",
  },
];

function RollLink({
  href,
  label,
  active,
  lightTheme,
}: {
  href: string;
  label: string;
  active: boolean;
  lightTheme: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-11 items-center text-[14px] font-medium whitespace-nowrap transition-colors duration-200",
        lightTheme
          ? active
            ? "text-[var(--jc-ink)]"
            : "text-[var(--jc-muted)] hover:text-[var(--jc-ink)]"
          : active
            ? "text-[var(--jc-ivory)]"
            : "text-[var(--jc-ivory-soft)] hover:text-[var(--jc-ivory)]"
      )}
    >
      <span className="relative inline-flex h-[1.25em] overflow-hidden leading-[1.25]">
        <span className="inline-block transition-transform duration-300 ease-out group-hover:-translate-y-full">
          {label}
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 inline-block translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0"
        >
          {label}
        </span>
      </span>
    </Link>
  );
}

/**
 * Jesko-inspired floating edge-to-edge navigation with dynamic dark/light section
 * theme switching, live Dubai clock, dual-layer roll-up links, and direct callback drawer trigger.
 */
export function SiteHeader({
  settings,
  showCaseStudies,
  showInsights,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { openDrawer } = useCallbackDrawer();

  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lightTheme, setLightTheme] = useState(false);
  const [dubaiTime, setDubaiTime] = useState<string>("");
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync live Dubai (GST) time every second (Jesko initCurrentTime parity)
  useEffect(() => {
    const updateClock = () => {
      try {
        const formatted = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Dubai",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date());
        setDubaiTime(formatted);
      } catch {
        setDubaiTime("");
      }
    };
    updateClock();
    const id = window.setInterval(updateClock, 15_000);
    return () => window.clearInterval(id);
  }, []);

  // Track scroll & active light/dark section beneath the header midpoint (Jesko initThemeChange parity)
  useEffect(() => {
    const evaluateHeaderTheme = () => {
      setScrolled(window.scrollY > 40);
      const midY = 34;
      const sections = document.querySelectorAll<HTMLElement>(
        "#main-content [data-nav-theme], #main-content [data-surface], #main-content section.surface-ivory, #main-content section.surface-stone, #main-content section.surface-dark"
      );
      let nextLight = false;
      for (const sec of sections) {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= midY && rect.bottom >= midY) {
          const explicit =
            sec.getAttribute("data-nav-theme") ||
            sec.getAttribute("data-surface");
          if (explicit) {
            nextLight = explicit === "light";
          } else {
            nextLight =
              sec.classList.contains("surface-ivory") ||
              sec.classList.contains("surface-stone");
          }
          break;
        }
      }
      setLightTheme(nextLight);
    };

    evaluateHeaderTheme();
    window.addEventListener("scroll", evaluateHeaderTheme, { passive: true });
    window.addEventListener("resize", evaluateHeaderTheme, { passive: true });
    return () => {
      window.removeEventListener("scroll", evaluateHeaderTheme);
      window.removeEventListener("resize", evaluateHeaderTheme);
    };
  }, [pathname]);

  useEffect(() => {
    setServicesOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!servicesOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setServicesOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, [servicesOpen]);

  const isServiceActive = pathname.startsWith("/services");

  return (
    <header
      ref={headerRef}
      data-surface={lightTheme ? "light" : "dark"}
      className={cn(
        "z-[var(--z-sticky-nav)] w-full border-b transition-[background-color,border-color,color] duration-300",
        isHome ? "fixed inset-x-0 top-0" : "sticky top-0",
        isHome && !scrolled
          ? "border-transparent bg-transparent"
          : lightTheme
            ? "border-[var(--jc-line-light)] bg-[var(--jc-nav-scrolled-light)] backdrop-blur-md"
            : "border-[var(--jc-line-dark)] bg-[var(--jc-nav-scrolled-dark)] backdrop-blur-md"
      )}
    >
      <div className="mx-auto grid h-[var(--header-height)] w-full max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-[var(--gutter)]">
        {/* Left: Compact Jesko-proportioned navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 lg:flex"
        >
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-expanded={servicesOpen}
              aria-controls="services-desktop-menu"
              onClick={() => setServicesOpen((prev) => !prev)}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 text-[14px] font-medium whitespace-nowrap transition-colors duration-200 cursor-pointer",
                lightTheme
                  ? isServiceActive || servicesOpen
                    ? "text-[var(--jc-ink)]"
                    : "text-[var(--jc-muted)] hover:text-[var(--jc-ink)]"
                  : isServiceActive || servicesOpen
                    ? "text-[var(--jc-ivory)]"
                    : "text-[var(--jc-ivory-soft)] hover:text-[var(--jc-ivory)]"
              )}
            >
              Services
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-3.5 transition-transform duration-150",
                  servicesOpen && "rotate-180"
                )}
              />
            </button>

            {servicesOpen && (
              <div
                id="services-desktop-menu"
                data-surface="dark"
                className="absolute left-0 top-full mt-2 w-[330px] rounded-[8px] border border-[var(--jc-line-dark-strong)] bg-[var(--jc-teal-deep)] p-2 text-[var(--jc-ivory)]"
              >
                <ul className="m-0 list-none p-0">
                  {SERVICE_LINKS.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "block rounded-[6px] px-4 py-3 transition-colors duration-150",
                          pathname === item.href
                            ? "bg-[var(--jc-teal-elevated)] text-[var(--jc-ivory)]"
                            : "text-[var(--jc-ivory)] hover:bg-[var(--jc-teal)]"
                        )}
                      >
                        <span className="block text-[14px] font-medium">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-[var(--jc-ivory-soft)]">
                          {item.detail}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <RollLink
            href="/aircraft"
            label="Aircraft"
            active={pathname.startsWith("/aircraft")}
            lightTheme={lightTheme}
          />
          <RollLink
            href="/how-it-works"
            label="How it works"
            active={pathname === "/how-it-works"}
            lightTheme={lightTheme}
          />
          <RollLink
            href="/about"
            label="About"
            active={pathname === "/about"}
            lightTheme={lightTheme}
          />

          {showCaseStudies && (
            <RollLink
              href="/case-studies"
              label="Case studies"
              active={pathname.startsWith("/case-studies")}
              lightTheme={lightTheme}
            />
          )}
          {showInsights && (
            <RollLink
              href="/insights"
              label="Insights"
              active={pathname.startsWith("/insights")}
              lightTheme={lightTheme}
            />
          )}
        </nav>

        <div className="lg:hidden" />

        {/* Center: Sculpted luxury Cinzel Jayant Charter wordmark */}
        <Link
          href="/"
          data-header-logo="true"
          className={cn(
            "jc-brand-mark justify-self-center text-[19px] leading-none whitespace-nowrap transition-colors duration-300 sm:text-[21px]",
            lightTheme ? "text-[var(--jc-ink)]" : "text-[var(--jc-ivory)]"
          )}
        >
          {settings.brandMarkFirst} {settings.brandMarkSecond}
        </Link>

        {/* Right: Dubai clock + Direct callback trigger + mobile menu */}
        <div className="flex items-center justify-end gap-6">
          {dubaiTime && (
            <span
              className={cn(
                "hidden text-[13px] tabular-nums whitespace-nowrap transition-colors duration-300 lg:inline-block",
                lightTheme
                  ? "text-[var(--jc-muted)]"
                  : "text-[var(--jc-ivory-soft)]"
              )}
            >
              Dubai {dubaiTime}
            </span>
          )}

          <button
            type="button"
            onClick={() => openDrawer()}
            className={cn(
              "hidden min-h-11 items-center text-[14px] font-medium underline underline-offset-8 whitespace-nowrap transition-colors duration-200 cursor-pointer lg:inline-flex",
              lightTheme
                ? "text-[var(--jc-ink)] decoration-[var(--jc-line-strong)] hover:decoration-[var(--jc-ink)]"
                : "text-[var(--jc-ivory)] decoration-[var(--jc-line-dark-strong)] hover:decoration-[var(--jc-ivory)]"
            )}
          >
            Request a callback
          </button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              aria-label="Open navigation menu"
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-full border transition-colors lg:hidden cursor-pointer",
                lightTheme
                  ? "border-[var(--jc-line-strong)] text-[var(--jc-ink)]"
                  : "border-[var(--jc-line-dark-strong)] text-[var(--jc-ivory)]"
              )}
            >
              <Menu aria-hidden="true" className="size-4" />
            </SheetTrigger>
            <SheetContent
              side="right"
              data-surface="dark"
              className="w-[min(88vw,360px)] border-l border-[var(--jc-line-dark)] bg-[var(--jc-teal-deep)] text-[var(--jc-ivory)]"
            >
              <SheetHeader className="border-b border-[var(--jc-line-dark)] px-6 py-5 text-left">
                <SheetTitle className="jc-brand-mark text-[20px] font-semibold text-[var(--jc-ivory)]">
                  {settings.brandMarkFirst} {settings.brandMarkSecond}
                </SheetTitle>
              </SheetHeader>

              <nav
                aria-label="Mobile navigation"
                className="flex flex-1 flex-col gap-1 px-4 py-5"
              >
                <p className="px-3 pb-1 text-[13px] text-[var(--jc-ivory-muted)]">
                  Services
                </p>
                {SERVICE_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-12 flex-col justify-center rounded-[6px] px-3 py-2 text-[var(--jc-ivory)] transition-colors hover:bg-[var(--jc-teal)]"
                  >
                    <span className="text-[16px] font-medium">{item.label}</span>
                    <span className="text-[13px] text-[var(--jc-ivory-soft)]">
                      {item.detail}
                    </span>
                  </Link>
                ))}

                <div className="my-3 h-px bg-[var(--jc-line-dark)]" />

                <Link
                  href="/aircraft"
                  className="flex min-h-12 items-center rounded-[6px] px-3 text-[16px] text-[var(--jc-ivory)] hover:bg-[var(--jc-teal)]"
                >
                  Explore aircraft
                </Link>
                <Link
                  href="/how-it-works"
                  className="flex min-h-12 items-center rounded-[6px] px-3 text-[16px] text-[var(--jc-ivory)] hover:bg-[var(--jc-teal)]"
                >
                  How it works
                </Link>
                <Link
                  href="/about"
                  className="flex min-h-12 items-center rounded-[6px] px-3 text-[16px] text-[var(--jc-ivory)] hover:bg-[var(--jc-teal)]"
                >
                  About
                </Link>

                <div className="mt-auto pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      openDrawer();
                    }}
                    className="jc-btn-gold w-full"
                  >
                    Request a callback
                  </button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
