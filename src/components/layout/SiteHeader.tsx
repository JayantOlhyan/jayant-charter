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

export function SiteHeader({
  settings,
  showCaseStudies,
  showInsights,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const syncChromeHeight = () => {
      document.documentElement.style.setProperty(
        "--chrome-height",
        `${Math.round(el.getBoundingClientRect().height)}px`
      );
    };
    syncChromeHeight();
    const ro = new ResizeObserver(syncChromeHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, [settings.featureFlags.showPreviewBanner]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      data-surface="dark"
      className={cn(
        "sticky top-0 z-[var(--z-sticky-nav)] w-full border-b transition-[background-color,border-color] duration-200",
        scrolled
          ? "border-[var(--jc-line-dark)] bg-[color-mix(in_srgb,var(--jc-teal)_95%,transparent)] backdrop-blur-md"
          : "border-transparent bg-[var(--jc-teal)]"
      )}
    >
      {settings.featureFlags.showPreviewBanner && (
        <div
          role="status"
          className="border-b border-[var(--jc-banner-line)] bg-[var(--jc-gold)] px-[var(--gutter)] py-2 text-center text-[13px] font-medium text-[var(--jc-teal)]"
        >
          Preview environment: inquiries are recorded locally while live email and WhatsApp channels remain paused.
        </div>
      )}

      <div className="jc-container flex h-[var(--header-height)] items-center justify-between gap-6">
        <Link
          href="/"
          className="font-serif text-[23px] leading-none tracking-[-0.015em] text-[var(--jc-ivory)] whitespace-nowrap"
        >
          {settings.brandMarkFirst}{" "}
          <span className="text-[var(--jc-gold)]">{settings.brandMarkSecond}</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-8 lg:flex">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-expanded={servicesOpen}
              aria-controls="services-desktop-menu"
              onClick={() => setServicesOpen((prev) => !prev)}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 text-[15px] font-normal whitespace-nowrap transition-colors duration-150 cursor-pointer",
                isServiceActive || servicesOpen
                  ? "text-[var(--jc-ivory)]"
                  : "text-[var(--jc-ivory-soft)] hover:text-[var(--jc-ivory)]"
              )}
            >
              Services
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-4 transition-transform duration-150",
                  servicesOpen && "rotate-180"
                )}
              />
            </button>

            {servicesOpen && (
              <div
                id="services-desktop-menu"
                className="absolute left-0 top-full mt-2 w-[340px] rounded-[4px] border border-[var(--jc-line-dark-strong)] bg-[var(--jc-teal-deep)] p-2"
              >
                <ul className="m-0 list-none p-0">
                  {SERVICE_LINKS.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "block rounded-[3px] px-4 py-3 transition-colors duration-150",
                          pathname === item.href
                            ? "bg-[var(--jc-teal-elevated)] text-[var(--jc-ivory)]"
                            : "text-[var(--jc-ivory)] hover:bg-[var(--jc-teal)]"
                        )}
                      >
                        <span className="block text-[15px] font-medium">{item.label}</span>
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

          <Link
            href="/aircraft"
            className={cn(
              "inline-flex min-h-11 items-center text-[15px] whitespace-nowrap transition-colors duration-150",
              pathname.startsWith("/aircraft")
                ? "text-[var(--jc-ivory)]"
                : "text-[var(--jc-ivory-soft)] hover:text-[var(--jc-ivory)]"
            )}
          >
            Aircraft
          </Link>

          <Link
            href="/how-it-works"
            className={cn(
              "inline-flex min-h-11 items-center text-[15px] whitespace-nowrap transition-colors duration-150",
              pathname === "/how-it-works"
                ? "text-[var(--jc-ivory)]"
                : "text-[var(--jc-ivory-soft)] hover:text-[var(--jc-ivory)]"
            )}
          >
            How it works
          </Link>

          <Link
            href="/about"
            className={cn(
              "inline-flex min-h-11 items-center text-[15px] whitespace-nowrap transition-colors duration-150",
              pathname === "/about"
                ? "text-[var(--jc-ivory)]"
                : "text-[var(--jc-ivory-soft)] hover:text-[var(--jc-ivory)]"
            )}
          >
            About
          </Link>

          {showCaseStudies && (
            <Link
              href="/case-studies"
              className={cn(
                "inline-flex min-h-11 items-center text-[15px] whitespace-nowrap transition-colors duration-150",
                pathname.startsWith("/case-studies")
                  ? "text-[var(--jc-ivory)]"
                  : "text-[var(--jc-ivory-soft)] hover:text-[var(--jc-ivory)]"
              )}
            >
              Case studies
            </Link>
          )}

          {showInsights && (
            <Link
              href="/insights"
              className={cn(
                "inline-flex min-h-11 items-center text-[15px] whitespace-nowrap transition-colors duration-150",
                pathname.startsWith("/insights")
                  ? "text-[var(--jc-ivory)]"
                  : "text-[var(--jc-ivory-soft)] hover:text-[var(--jc-ivory)]"
              )}
            >
              Insights
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/inquire"
            className="jc-btn-gold !min-h-[44px] !px-4 !text-[14px] sm:!px-5"
          >
            Request a callback
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              aria-label="Open navigation menu"
              className="inline-flex size-11 items-center justify-center rounded-[3px] border border-[var(--jc-line-dark-strong)] text-[var(--jc-ivory)] transition-colors hover:border-[var(--jc-ivory)] lg:hidden cursor-pointer"
            >
              <Menu aria-hidden="true" className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              data-surface="dark"
              className="w-[min(88vw,360px)] border-l border-[var(--jc-line-dark)] bg-[var(--jc-teal-deep)] text-[var(--jc-ivory)]"
            >
              <SheetHeader className="border-b border-[var(--jc-line-dark)] px-6 py-5 text-left">
                <SheetTitle className="font-serif text-[22px] font-normal text-[var(--jc-ivory)]">
                  {settings.brandMarkFirst}{" "}
                  <span className="text-[var(--jc-gold)]">{settings.brandMarkSecond}</span>
                </SheetTitle>
              </SheetHeader>

              <nav aria-label="Mobile navigation" className="flex flex-1 flex-col gap-1 px-4 py-5">
                <p className="px-3 pb-1 text-[13px] text-[var(--jc-ivory-muted)]">Services</p>
                {SERVICE_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-12 flex-col justify-center rounded-[3px] px-3 py-2 text-[var(--jc-ivory)] transition-colors hover:bg-[var(--jc-teal)]"
                  >
                    <span className="text-[16px] font-medium">{item.label}</span>
                    <span className="text-[13px] text-[var(--jc-ivory-soft)]">{item.detail}</span>
                  </Link>
                ))}

                <div className="my-3 h-px bg-[var(--jc-line-dark)]" />

                <Link
                  href="/aircraft"
                  className="flex min-h-12 items-center rounded-[3px] px-3 text-[16px] text-[var(--jc-ivory)] hover:bg-[var(--jc-teal)]"
                >
                  Explore aircraft
                </Link>
                <Link
                  href="/how-it-works"
                  className="flex min-h-12 items-center rounded-[3px] px-3 text-[16px] text-[var(--jc-ivory)] hover:bg-[var(--jc-teal)]"
                >
                  How it works
                </Link>
                <Link
                  href="/about"
                  className="flex min-h-12 items-center rounded-[3px] px-3 text-[16px] text-[var(--jc-ivory)] hover:bg-[var(--jc-teal)]"
                >
                  About
                </Link>
                {showCaseStudies && (
                  <Link
                    href="/case-studies"
                    className="flex min-h-12 items-center rounded-[3px] px-3 text-[16px] text-[var(--jc-ivory)] hover:bg-[var(--jc-teal)]"
                  >
                    Case studies
                  </Link>
                )}
                {showInsights && (
                  <Link
                    href="/insights"
                    className="flex min-h-12 items-center rounded-[3px] px-3 text-[16px] text-[var(--jc-ivory)] hover:bg-[var(--jc-teal)]"
                  >
                    Insights
                  </Link>
                )}

                <div className="mt-auto pt-6">
                  <Link href="/inquire" className="jc-btn-gold w-full">
                    Request a callback
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
