import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublishedAircraft, getSiteSettings } from "@/content/repository";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { InquirePageClient } from "@/features/inquiry/InquirePageClient";

export const metadata: Metadata = {
  title: "Request a Callback",
  description:
    "Start a private jet, group charter, or helicopter inquiry with Jayant Charter. Only your name, reachable phone number, and contact permission are required.",
  alternates: { canonical: "/inquire" },
};

export default function InquirePage() {
  const settings = getSiteSettings();
  const aircraftList = getPublishedAircraft();

  return (
    <div>
      <section data-surface="dark" className="surface-dark py-14 md:py-20">
        <div className="jc-container">
          <Breadcrumbs
            surface="dark"
            items={[{ label: "Home", href: "/" }, { label: "Request a callback" }]}
          />
          <h1 className="jc-display-hero max-w-[18ch] text-[var(--jc-ivory)]">
            Tell us about your trip.
          </h1>
          <p className="mt-5 max-w-[54ch] text-[17px] leading-relaxed text-[var(--jc-ivory-soft)]">
            Share your name, reachable phone number, and permission to contact. Add route, travel dates, passenger count, or helicopter venue details if you have them ready.
          </p>
        </div>
      </section>

      <section className="surface-stone py-16 md:py-24">
        <div className="jc-container grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.75fr)] lg:gap-16">
          <Suspense
            fallback={
              <div className="rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)] p-10 text-[15px] text-[var(--jc-muted)]">
                Loading inquiry form...
              </div>
            }
          >
            <InquirePageClient settings={settings} aircraftList={aircraftList} />
          </Suspense>

          <aside className="space-y-6">
            <div className="rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)] p-7">
              <h2 className="font-serif text-[24px] text-[var(--jc-ink)]">
                What happens next
              </h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-[var(--jc-muted)]">
                <li>Your request is stored durably and assigned a unique reference ID.</li>
                <li>Jayant reaches out directly to clarify your schedule and requirements.</li>
                <li>With your explicit permission, trip details go to the aviation sourcing team for feasibility checks and written quotes.</li>
              </ol>
            </div>

            <div className="rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)] p-7">
              <h2 className="font-serif text-[24px] text-[var(--jc-ink)]">
                Privacy and sensitivity
              </h2>
              <p className="mt-3 m-0 text-[14px] leading-relaxed text-[var(--jc-muted)]">
                We collect only what is needed to start a conversation. Please do not include passport scans, payment card numbers, or passenger manifests in this initial request.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
