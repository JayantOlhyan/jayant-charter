import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/content/repository";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description:
    "How Jayant Charter collects, stores, and protects contact and itinerary information submitted through charter inquiries.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const settings = getSiteSettings();

  return (
    <div className="surface-ivory py-16 md:py-24">
      <div className="jc-container max-w-[820px]">
        <Breadcrumbs
          surface="light"
          items={[{ label: "Home", href: "/" }, { label: "Privacy notice" }]}
        />
        <h1 className="jc-display-hero text-[var(--jc-ink)]">Privacy notice</h1>
        <p className="mt-4 text-[14px] text-[var(--jc-muted)] tabular-nums">
          Notice version: {settings.contactNoticeVersion}
        </p>

        <div className="mt-10 space-y-8 text-[16px] leading-relaxed text-[var(--jc-muted)]">
          <section>
            <h2 className="font-serif text-[26px] text-[var(--jc-ink)]">
              1. Who receives your inquiry
            </h2>
            <p className="mt-3">
              Inquiries submitted on this website are received directly by {settings.brandName} ({settings.legalEntity}). Your initial contact permission authorizes Jayant to reach out to you regarding the trip you submitted.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-[26px] text-[var(--jc-ink)]">
              2. Information we collect
            </h2>
            <p className="mt-3">
              We ask only for what is needed for an initial conversation: your name, a reachable international phone number, and your explicit permission to contact you. Optional itinerary fields (route, dates, passenger count, venue, aircraft preference, email, and notes) are collected only if you choose to provide them. Do not submit passport numbers, payment card details, or passenger manifests through this form.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-[26px] text-[var(--jc-ink)]">
              3. Staged permission before onward sharing
            </h2>
            <p className="mt-3">
              Your contact details are not automatically forwarded to external charter operators when you submit the form. Before sharing your information with an aviation sourcing partner or licensed carrier to obtain feasibility checks and written quotes, we identify the recipient and obtain your permission for that trip.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-[26px] text-[var(--jc-ink)]">
              4. Storage, analytics, and retention
            </h2>
            <p className="mt-3">
              Personal inquiry drafts are not stored in your browser&apos;s local storage. Non-essential advertising trackers are disabled by default. Phone numbers and itinerary notes are excluded from diagnostic analytics and application logs. {settings.jurisdictionNotice}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-[26px] text-[var(--jc-ink)]">
              5. Questions or deletion requests
            </h2>
            <p className="mt-3">
              To request correction or deletion of an inquiry record once live contact channels are published, contact Jayant directly using the verified details on this site or reference your inquiry ID during follow-up.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-[var(--jc-line-light)] pt-8">
          <Link href="/inquire" className="jc-btn-teal">
            Return to inquiry form
          </Link>
        </div>
      </div>
    </div>
  );
}
