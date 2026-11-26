import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/content/repository";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "About",
  description:
    "How Jayant Charter works as a founder-led private aviation inquiry desk for private jets, group charters, and helicopters.",
  alternates: { canonical: "/about" },
};

const AUDIENCE_NOTES = [
  {
    title: "Executive assistants and corporate coordinators",
    body: "Fixed meeting times, roadshows, and changing agendas require a reachable person who returns clear options without pushing unrelated aircraft.",
  },
  {
    title: "Luxury travel advisors and family offices",
    body: "Discretion, consistent follow-up, and explicit permission before client details ever leave the initial conversation.",
  },
  {
    title: "Wedding planners and event teams",
    body: "Group airlift and helicopter arrivals checked around venue permissions, baggage volume, and real operating windows.",
  },
  {
    title: "Private travellers and families",
    body: "Straightforward aircraft explanations and clarity on who checks feasibility, who quotes, and which licensed carrier operates the flight.",
  },
];

export default function AboutPage() {
  const settings = getSiteSettings();

  return (
    <div>
      <section data-surface="dark" className="surface-dark py-16 md:py-24">
        <div className="jc-container">
          <Breadcrumbs
            surface="dark"
            items={[{ label: "Home", href: "/" }, { label: "About" }]}
          />
          <h1 className="jc-display-hero max-w-[18ch] text-[var(--jc-ivory)]">
            A founder-led desk for private aviation inquiries.
          </h1>
          <p className="mt-6 max-w-[54ch] text-[18px] leading-relaxed text-[var(--jc-ivory-soft)]">
            {settings.brandName} gives travellers, executive assistants, advisors, and event planners one calm point of contact to start a private jet, group charter, or helicopter request.
          </p>
        </div>
      </section>

      <section className="surface-ivory border-b border-[var(--jc-line-light)] py-20 md:py-28">
        <div className="jc-container grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          <div className="space-y-6 text-[17px] leading-relaxed text-[var(--jc-muted)]">
            <h2 className="jc-display-section text-[var(--jc-ink)]">
              Why the desk starts with Jayant
            </h2>
            <p className="m-0 max-w-[60ch]">
              Arranging a private aircraft often breaks down before a quote even arrives: generic web forms disappear into call queues, online estimates assume aircraft that are not positioned where you need them, and travellers are rarely told who will actually operate the flight.
            </p>
            <p className="m-0 max-w-[60ch]">
              Here, every inquiry comes to Jayant first. We clarify the essentials of your itinerary, confirm permission before sharing your details with an aviation sourcing team, and keep follow-up accountable until you review real options and a written quote.
            </p>
            <p className="m-0 max-w-[60ch]">
              {settings.corridorsNote}
            </p>
          </div>

          <aside className="jc-editorial-card p-7 sm:p-9">
            <h3 className="font-serif text-[26px] text-[var(--jc-ink)]">
              Clear service role
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--jc-muted)]">
              {settings.roleDisclosure}
            </p>
            <dl className="mt-6 space-y-4 border-t border-[var(--jc-line-light)] pt-6 text-[14px]">
              <div>
                <dt className="font-semibold text-[var(--jc-ink)]">First contact</dt>
                <dd className="mt-1 m-0 text-[var(--jc-muted)]">
                  Jayant personally reviews your brief and contacts you before onward sharing.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--jc-ink)]">Flight operations</dt>
                <dd className="mt-1 m-0 text-[var(--jc-muted)]">
                  Controlled exclusively by the licensed air carrier named in your quote and charter contract.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--jc-ink)]">Aircraft models on site</dt>
                <dd className="mt-1 m-0 text-[var(--jc-muted)]">
                  Illustrative exterior studies to help discuss category and scale, not a claim of owned fleet inventory.
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="surface-stone py-20 md:py-28">
        <div className="jc-container">
          <h2 className="jc-display-section text-[var(--jc-ink)]">
            Who we work with
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {AUDIENCE_NOTES.map((item) => (
              <article
                key={item.title}
                className="jc-editorial-card p-7 sm:p-8"
              >
                <h3 className="font-serif text-[24px] text-[var(--jc-ink)]">
                  {item.title}
                </h3>
                <p className="mt-3 m-0 text-[15px] leading-relaxed text-[var(--jc-muted)]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-[var(--jc-line-light)] pt-12">
            <div>
              <h2 className="font-serif text-[30px] text-[var(--jc-ink)]">
                Have an upcoming itinerary to discuss?
              </h2>
              <p className="mt-2 m-0 text-[16px] text-[var(--jc-muted)]">
                Start with a short callback request or read the step-by-step booking process.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/inquire" className="jc-btn-teal">
                Request a callback
              </Link>
              <Link href="/how-it-works" className="jc-btn-outline-dark">
                How it works
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
