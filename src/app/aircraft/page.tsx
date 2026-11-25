import type { Metadata } from "next";
import Link from "next/link";
import { getMediaAsset, getPublishedAircraft } from "@/content/repository";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Explore Aircraft Examples",
  description:
    "Inspect our illustrative 3D exterior models of the Hawker 4000 and Dassault Falcon 2000 Classic. Availability and aircraft suitability are confirmed per itinerary.",
  alternates: { canonical: "/aircraft" },
};

export default function AircraftCollectionPage() {
  const aircraftList = getPublishedAircraft();

  return (
    <div>
      <section data-surface="dark" className="surface-dark py-16 md:py-24">
        <div className="jc-container">
          <Breadcrumbs
            surface="dark"
            items={[{ label: "Home", href: "/" }, { label: "Aircraft examples" }]}
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
            <h1 className="jc-display-hero text-[var(--jc-ivory)]">
              Aircraft examples.
            </h1>
            <p className="m-0 max-w-[48ch] text-[17px] leading-relaxed text-[var(--jc-ivory-soft)] lg:justify-self-end">
              Representative exterior studies built from photographic reference. Select either aircraft to open its interactive 3D studio, inspect configurations, and review reference documentation.
            </p>
          </div>
        </div>
      </section>

      <section className="surface-ivory py-20 md:py-28">
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {aircraftList.map((ac) => {
              const poster = getMediaAsset(ac.posterId);
              return (
                <article
                  key={ac.id}
                  className="flex flex-col overflow-hidden rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)]"
                >
                  <Link
                    href={`/aircraft/${ac.slug}`}
                    className="jc-stage-daylight group relative flex min-h-[280px] items-center justify-center p-8 sm:min-h-[340px] sm:p-12"
                  >
                    <img
                      src={poster.path}
                      alt={poster.alt}
                      width={poster.width}
                      height={poster.height}
                      className="jc-aircraft-shadow-light max-h-[260px] w-full object-contain"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col justify-between p-7 sm:p-9">
                    <div>
                      <p className="m-0 text-[13px] text-[var(--jc-muted)]">
                        {ac.category}
                      </p>
                      <h2 className="mt-2 font-serif text-[34px] leading-tight text-[var(--jc-ink)]">
                        {ac.displayTitle}
                      </h2>
                      <p className="mt-1 text-[14px] text-[var(--jc-muted)]">
                        {ac.variant}
                      </p>
                      <p className="mt-4 text-[15px] leading-relaxed text-[var(--jc-muted)]">
                        {ac.summary}
                      </p>

                      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--jc-line-light)] pt-5 text-[14px]">
                        <div>
                          <dt className="text-[var(--jc-muted)]">3D views available</dt>
                          <dd className="mt-1 m-0 font-medium text-[var(--jc-ink)]">
                            {ac.configurations.map((c) => c.label).join(", ")}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[var(--jc-muted)]">Model scope</dt>
                          <dd className="mt-1 m-0 font-medium text-[var(--jc-ink)]">
                            Illustrative exterior
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--jc-line-light)] pt-6">
                      <Link href={`/aircraft/${ac.slug}`} className="jc-btn-teal flex-1">
                        Inspect in 3D
                      </Link>
                      <Link
                        href={`/inquire?service=private-jet&aircraft=${ac.id}`}
                        className="jc-btn-outline-dark"
                      >
                        Request a callback
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-16 rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-stone)] p-7 sm:p-9">
            <h2 className="font-serif text-[26px] text-[var(--jc-ink)]">
              Planning a larger group or helicopter transfer?
            </h2>
            <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-[var(--jc-muted)]">
              The Hawker 4000 and Dassault Falcon 2000 Classic are illustrative executive jet examples, not a fleet we own and not presented as 22-passenger group aircraft. For group movements or helicopter transfers, start directly from the matching service path or request a callback.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-[15px]">
              <Link
                href="/services/group-charter"
                className="font-medium text-[var(--jc-teal)] underline underline-offset-4"
              >
                Group charter inquiries
              </Link>
              <Link
                href="/services/helicopters"
                className="font-medium text-[var(--jc-teal)] underline underline-offset-4"
              >
                Helicopter inquiries
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
