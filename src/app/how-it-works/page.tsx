import type { Metadata } from "next";
import Link from "next/link";
import { getFaqsByScope, getSiteSettings } from "@/content/repository";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { FaqBlock } from "@/components/blocks/FaqBlock";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Step-by-step overview of how a charter inquiry moves from your first callback request with Jayant to feasibility review, quotation, and confirmation with a licensed operator.",
  alternates: { canonical: "/how-it-works" },
};

const STAGES = [
  {
    step: "01",
    title: "Inquiry and initial callback",
    body: "Submit your name, reachable phone number, and permission to contact. Include route, dates, passengers, venue, or aircraft preference if known. Jayant follows up directly to clarify the brief.",
  },
  {
    step: "02",
    title: "Permissioned handoff and feasibility check",
    body: "Only after you confirm permission for your trip are the relevant itinerary details shared with the aviation sourcing team. They evaluate airport suitability, runway length, helicopter landing permissions, crew duty limits, and aircraft positioning.",
  },
  {
    step: "03",
    title: "Aircraft options and written quotation",
    body: "You receive suitable aircraft options for your exact route and dates along with transparent pricing and operational notes. No aircraft is assumed available until confirmed in writing.",
  },
  {
    step: "04",
    title: "Booking-party and carrier identification",
    body: "Before you confirm anything, the contracting party and the licensed operating air carrier responsible for the flight are clearly identified.",
  },
  {
    step: "05",
    title: "Confirmation and trip coordination",
    body: "Once you approve an option and execute the charter agreement with the booking party, flight servicing, crew briefing, and handling proceed under the operating carrier.",
  },
];

export default function HowItWorksPage() {
  const settings = getSiteSettings();
  const faqs = getFaqsByScope("how-it-works");

  return (
    <div>
      <section data-surface="dark" className="surface-dark py-16 md:py-24">
        <div className="jc-container">
          <Breadcrumbs
            surface="dark"
            items={[{ label: "Home", href: "/" }, { label: "How it works" }]}
          />
          <h1 className="jc-display-hero max-w-[18ch] text-[var(--jc-ivory)]">
            How every charter inquiry is handled.
          </h1>
          <p className="mt-6 max-w-[54ch] text-[18px] leading-relaxed text-[var(--jc-ivory-soft)]">
            Submitting an inquiry on this website begins a real human feasibility check. It does not reserve an aircraft or imply instant automated confirmation.
          </p>
        </div>
      </section>

      <section className="surface-ivory border-b border-[var(--jc-line-light)] py-20 md:py-28">
        <div className="jc-container">
          <ol className="m-0 list-none divide-y divide-[var(--jc-line-light)] border-y border-[var(--jc-line-light)] p-0">
            {STAGES.map((stage) => (
              <li
                key={stage.step}
                className="grid grid-cols-1 gap-4 py-10 md:grid-cols-[100px_minmax(0,0.9fr)_minmax(0,1.2fr)] md:items-baseline md:gap-8"
              >
                <span className="font-serif text-[38px] leading-none text-[var(--jc-gold-muted)] tabular-nums">
                  {stage.step}
                </span>
                <h2 className="font-serif text-[28px] leading-snug text-[var(--jc-ink)]">
                  {stage.title}
                </h2>
                <p className="m-0 max-w-[58ch] text-[16px] leading-relaxed text-[var(--jc-muted)]">
                  {stage.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-14 rounded-[4px] border-l-2 border-[var(--jc-teal)] bg-[var(--jc-stone)] px-6 py-5 text-[15px] leading-relaxed text-[var(--jc-ink)]">
            {settings.roleDisclosure}
          </div>
        </div>
      </section>

      <section className="surface-ivory py-20 md:py-28">
        <div className="jc-container">
          <FaqBlock
            items={faqs}
            heading="Process questions."
            intro="Clear expectations on timing, privacy, and confirmation."
          />

          <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-[var(--jc-line-light)] pt-12">
            <h2 className="font-serif text-[30px] text-[var(--jc-ink)]">
              Ready to share an itinerary?
            </h2>
            <Link href="/inquire" className="jc-btn-teal">
              Request a callback
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
