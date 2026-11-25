import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/content/repository";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Terms and Role Disclosure",
  description:
    "Terms governing use of the Jayant Charter website, illustrative aircraft presentations, and intermediary charter inquiry disclosures.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const settings = getSiteSettings();

  return (
    <div className="surface-ivory py-16 md:py-24">
      <div className="jc-container max-w-[820px]">
        <Breadcrumbs
          surface="light"
          items={[{ label: "Home", href: "/" }, { label: "Terms and disclosure" }]}
        />
        <h1 className="jc-display-hero text-[var(--jc-ink)]">
          Terms and role disclosure
        </h1>

        <div className="mt-10 space-y-8 text-[16px] leading-relaxed text-[var(--jc-muted)]">
          <section>
            <h2 className="font-serif text-[26px] text-[var(--jc-ink)]">
              1. Service role
            </h2>
            <p className="mt-3">{settings.roleDisclosure}</p>
          </section>

          <section>
            <h2 className="font-serif text-[26px] text-[var(--jc-ink)]">
              2. Inquiries are not bookings
            </h2>
            <p className="mt-3">
              Submitting an inquiry on this website records a request for a callback and feasibility discussion only. It does not reserve an aircraft, confirm a flight slot, lock pricing, or form a contract of carriage. All charter quotations, operational terms, cancellation policies, and flight contracts are issued separately by the applicable booking party and licensed air carrier.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-[26px] text-[var(--jc-ink)]">
              3. Illustrative aircraft models and specifications
            </h2>
            <p className="mt-3">
              3D aircraft models, renders, editorial photographs, and example trip scenarios displayed on this site are illustrative references only. They do not imply ownership of aircraft, guaranteed availability of any specific tail, pre-approved helicopter landing sites, or certified operating performance for a particular itinerary.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-[26px] text-[var(--jc-ink)]">
              4. Third-party asset attributions
            </h2>
            <p className="mt-3">
              Interactive exterior viewing uses Google model-viewer (Apache-2.0) alongside generic CC0 surface maps from ambientCG and the CC0 Studio Small 09 lighting environment from Poly Haven. Original aircraft manufacturer trademarks belong to their respective owners; display models are illustrative references and do not indicate manufacturer affiliation or authorization.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-[var(--jc-line-light)] pt-8">
          <Link href="/" className="jc-btn-outline-dark">
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
