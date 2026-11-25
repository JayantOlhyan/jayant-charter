import Link from "next/link";
import type { SiteSettings } from "@/content/schemas";

interface SiteFooterProps {
  settings: SiteSettings;
  showCaseStudies: boolean;
  showInsights: boolean;
}

export function SiteFooter({
  settings,
  showCaseStudies,
  showInsights,
}: SiteFooterProps) {
  const hasAnyChannel = Boolean(
    settings.channels.email ||
      settings.channels.phone ||
      settings.channels.whatsappUrl ||
      settings.channels.linkedinUrl ||
      settings.channels.instagramUrl
  );

  return (
    <footer
      data-surface="dark"
      className="border-t border-[var(--jc-line-dark)] bg-[var(--jc-teal-deep)] text-[var(--jc-ivory-soft)]"
    >
      <div className="jc-container py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Link
              href="/"
              className="font-serif text-[28px] leading-none tracking-[-0.02em] text-[var(--jc-ivory)]"
            >
              {settings.brandMarkFirst}{" "}
              <span className="text-[var(--jc-gold)]">{settings.brandMarkSecond}</span>
            </Link>
            <p className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-[var(--jc-ivory-soft)]">
              {settings.roleDisclosure}
            </p>
            <p className="mt-4 max-w-[48ch] text-[14px] leading-relaxed text-[var(--jc-ivory-muted)]">
              {settings.corridorsNote}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="font-sans text-[14px] font-semibold text-[var(--jc-ivory)]">
                Charter
              </h2>
              <ul className="mt-4 space-y-2.5 text-[14px]">
                <li>
                  <Link
                    href="/services/private-jets"
                    className="inline-block py-1 transition-colors hover:text-[var(--jc-ivory)]"
                  >
                    Private jets
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services/group-charter"
                    className="inline-block py-1 transition-colors hover:text-[var(--jc-ivory)]"
                  >
                    Group charter
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services/helicopters"
                    className="inline-block py-1 transition-colors hover:text-[var(--jc-ivory)]"
                  >
                    Helicopters
                  </Link>
                </li>
                <li>
                  <Link
                    href="/aircraft"
                    className="inline-block py-1 transition-colors hover:text-[var(--jc-ivory)]"
                  >
                    Aircraft examples
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-sans text-[14px] font-semibold text-[var(--jc-ivory)]">
                Desk
              </h2>
              <ul className="mt-4 space-y-2.5 text-[14px]">
                <li>
                  <Link
                    href="/how-it-works"
                    className="inline-block py-1 transition-colors hover:text-[var(--jc-ivory)]"
                  >
                    How it works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="inline-block py-1 transition-colors hover:text-[var(--jc-ivory)]"
                  >
                    About Jayant
                  </Link>
                </li>
                <li>
                  <Link
                    href="/inquire"
                    className="inline-block py-1 transition-colors hover:text-[var(--jc-ivory)]"
                  >
                    Request a callback
                  </Link>
                </li>
                {showCaseStudies && (
                  <li>
                    <Link
                      href="/case-studies"
                      className="inline-block py-1 transition-colors hover:text-[var(--jc-ivory)]"
                    >
                      Case studies
                    </Link>
                  </li>
                )}
                {showInsights && (
                  <li>
                    <Link
                      href="/insights"
                      className="inline-block py-1 transition-colors hover:text-[var(--jc-ivory)]"
                    >
                      Insights
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div>
            <h2 className="font-sans text-[14px] font-semibold text-[var(--jc-ivory)]">
              Direct inquiries
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-[var(--jc-ivory-soft)]">
              Every inquiry begins through our online callback form so your trip details and contact permission stay recorded cleanly.
            </p>
            <div className="mt-5">
              <Link href="/inquire" className="jc-btn-outline-light !min-h-[44px] !text-[14px]">
                Start an inquiry
              </Link>
            </div>

            {hasAnyChannel ? (
              <ul className="mt-5 space-y-2 text-[14px]">
                {settings.channels.email && (
                  <li>
                    <a
                      href={`mailto:${settings.channels.email}`}
                      className="underline underline-offset-4 hover:text-[var(--jc-ivory)]"
                    >
                      {settings.channels.email}
                    </a>
                  </li>
                )}
                {settings.channels.phone && (
                  <li>
                    <a
                      href={`tel:${settings.channels.phone}`}
                      className="tabular-nums underline underline-offset-4 hover:text-[var(--jc-ivory)]"
                    >
                      {settings.channels.phone}
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <p
                role="status"
                className="mt-5 rounded-[3px] border border-[var(--jc-line-dark)] bg-[var(--jc-panel-dark)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--jc-ivory-soft)]"
              >
                {settings.featureFlags.showPreviewBanner
                  ? "Preview environment: inquiries are recorded locally while direct email and WhatsApp channels remain paused."
                  : "Direct email and WhatsApp channels will appear here once public routing is activated."}
              </p>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-[var(--jc-line-dark)] pt-6 text-[13px] text-[var(--jc-ivory-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0">
            2026 {settings.brandName}. Working public identity; flights operated by licensed carriers.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="py-1 transition-colors hover:text-[var(--jc-ivory)]">
              Privacy
            </Link>
            <Link href="/terms" className="py-1 transition-colors hover:text-[var(--jc-ivory)]">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
