import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAircraftById,
  getAircraftBySlug,
  getMediaAsset,
  getPublishedAircraft,
  getSceneById,
  getSiteSettings,
} from "@/content/repository";
import type { AircraftRecord, MediaAsset } from "@/content/schemas";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AircraftStudioViewer } from "@/features/aircraft/AircraftStudioViewer";
import { ConfigurationCompareSlider } from "@/features/aircraft/ConfigurationCompareSlider";

interface AircraftDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getPublishedAircraft().map((ac) => ({ slug: ac.slug }));
}

export async function generateMetadata({
  params,
}: AircraftDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const aircraft = getAircraftBySlug(slug);
  if (!aircraft) return {};
  const og = getMediaAsset(aircraft.seo.ogImageId);
  return {
    title: aircraft.seo.title,
    description: aircraft.seo.description,
    alternates: { canonical: `/aircraft/${aircraft.slug}` },
    openGraph: {
      title: aircraft.seo.title,
      description: aircraft.seo.description,
      images: [{ url: og.path, width: og.width, height: og.height, alt: og.alt }],
    },
  };
}

export default async function AircraftDetailPage({
  params,
}: AircraftDetailPageProps) {
  const { slug } = await params;
  const aircraft = getAircraftBySlug(slug);
  if (!aircraft) notFound();

  const settings = getSiteSettings();
  const hangarScene = getSceneById("hangar-studio-explorer");
  const hasRampCompare =
    aircraft.id === "hawker-4000" &&
    aircraft.configurations.some((c) => c.id === "parked") &&
    aircraft.configurations.some((c) => c.id === "boarding");
  const mediaIds = new Set<string>([
    aircraft.posterId,
    ...aircraft.configurations.map((c) => c.posterId),
    ...aircraft.detailMediaIds,
  ]);

  const mediaById: Record<string, MediaAsset> = {};
  for (const id of mediaIds) {
    mediaById[id] = getMediaAsset(id);
  }

  const detailMedia = aircraft.detailMediaIds.map((id) => getMediaAsset(id));
  const related = aircraft.relatedAircraftIds
    .map((id) => getAircraftById(id))
    .filter((item): item is AircraftRecord => Boolean(item));

  return (
    <div>
      {/* Top 3D Studio Section */}
      <section data-surface="dark" className="surface-dark py-12 md:py-16">
        <div className="jc-container">
          <Breadcrumbs
            surface="dark"
            items={[
              { label: "Home", href: "/" },
              { label: "Aircraft examples", href: "/aircraft" },
              { label: aircraft.displayTitle },
            ]}
          />

          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="m-0 text-[14px] text-[var(--jc-gold)]">
                {aircraft.manufacturer}
              </p>
              <h1 className="mt-1.5 jc-display-hero text-[var(--jc-ivory)]">
                {aircraft.displayTitle}
              </h1>
              <p className="mt-2 m-0 text-[16px] text-[var(--jc-ivory-soft)]">
                {aircraft.variant}
              </p>
            </div>
            <Link
              href={`/inquire?service=private-jet&aircraft=${aircraft.id}`}
              className="jc-btn-gold w-full sm:w-auto"
            >
              <span className="sm:hidden">Request a callback</span>
              <span className="hidden sm:inline">Request a callback with this preference</span>
            </Link>
          </div>

          <AircraftStudioViewer
            aircraftList={[aircraft]}
            mediaById={mediaById}
            lightingModes={hangarScene.lightingModes}
            initialAircraftId={aircraft.id}
            enableLive3D={settings.featureFlags.enableLive3D}
            mode="detail"
          />
        </div>
      </section>

      {/* Plain-language overview & trip considerations */}
      <section className="surface-ivory border-b border-[var(--jc-line-light)] py-20 md:py-28">
        <div className="jc-container grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          <div>
            <h2 className="jc-display-section text-[var(--jc-ink)]">
              Aircraft overview
            </h2>
            <div className="mt-6 space-y-5 text-[17px] leading-relaxed text-[var(--jc-muted)]">
              {aircraft.overview.map((p) => (
                <p key={p} className="m-0 max-w-[60ch]">
                  {p}
                </p>
              ))}
            </div>
          </div>

          <aside className="jc-editorial-card p-7 sm:p-9">
            <h3 className="font-serif text-[26px] text-[var(--jc-ink)]">
              Trip planning considerations
            </h3>
            <ul className="mt-5 space-y-3.5 border-t border-[var(--jc-line-light)] pt-5 text-[15px] leading-relaxed text-[var(--jc-ink)]">
              {aircraft.tripConsiderations.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <p className="mt-6 mb-0 border-t border-[var(--jc-line-light)] pt-4 text-[13px] text-[var(--jc-muted)]">
              {aircraft.identityNote}
            </p>
          </aside>
        </div>
      </section>

      {/* Reviewed Reference Specifications (PRD Section 8.2 item 5) */}
      <section className="surface-stone border-b border-[var(--jc-line-light)] py-20 md:py-24">
        <div className="jc-container">
          <div className="max-w-[64ch]">
            <h2 className="jc-display-section text-[var(--jc-ink)]">
              Reviewed model reference dimensions
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[var(--jc-muted)]">
              Values below reflect reviewed public airframe envelope references used to build this exterior study. Actual operating range, passenger seating, and baggage capacity vary by specific tail and are confirmed in your written quote.
            </p>
          </div>

          {aircraft.specifications.length > 0 ? (
            <>
              {/* Mobile-first stacked editorial specification cards (zero horizontal table scrolling on phones!) */}
              <div className="mt-8 space-y-4 md:hidden">
                {aircraft.specifications.map((spec) => (
                  <article
                    key={spec.label}
                    className="jc-editorial-card p-5"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--jc-line-light)] pb-3">
                      <h3 className="m-0 font-sans text-[14px] font-semibold text-[var(--jc-ink)]">
                        {spec.label}
                      </h3>
                      <span className="font-serif text-[22px] text-[var(--jc-teal)] tabular-nums whitespace-nowrap">
                        {spec.value}
                        {spec.unit ? ` ${spec.unit}` : ""}
                      </span>
                    </div>
                    <p className="mt-3 mb-0 text-[14px] leading-relaxed text-[var(--jc-muted)]">
                      {spec.qualification}
                    </p>
                    <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-[var(--jc-line-light)] pt-3 text-[12.5px] text-[var(--jc-muted)]">
                      <a
                        href={spec.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--jc-teal)] underline underline-offset-4"
                      >
                        {spec.sourceLabel}
                      </a>
                      <span className="tabular-nums">Reviewed {spec.reviewedAt}</span>
                    </div>
                  </article>
                ))}
              </div>

              {/* Tablet & desktop structured 4-column reference table */}
              <div className="jc-editorial-card mt-10 hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left text-[15px]">
                  <thead>
                    <tr className="border-b border-[var(--jc-line-light)] bg-[var(--jc-ivory)] text-[13px] font-semibold text-[var(--jc-ink)]">
                      <th className="px-5 py-4">Reference item</th>
                      <th className="px-5 py-4">Value</th>
                      <th className="px-5 py-4">Qualification</th>
                      <th className="px-5 py-4">Source and review date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--jc-line-light)]">
                    {aircraft.specifications.map((spec) => (
                      <tr key={spec.label}>
                        <td className="px-5 py-4 font-medium text-[var(--jc-ink)]">
                          {spec.label}
                        </td>
                        <td className="px-5 py-4 font-serif text-[22px] text-[var(--jc-teal)] tabular-nums whitespace-nowrap">
                          {spec.value}
                          {spec.unit ? ` ${spec.unit}` : ""}
                        </td>
                        <td className="px-5 py-4 text-[14px] text-[var(--jc-muted)]">
                          {spec.qualification}
                        </td>
                        <td className="px-5 py-4 text-[13px] text-[var(--jc-muted)]">
                          <a
                            href={spec.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--jc-teal)] underline underline-offset-4"
                          >
                            {spec.sourceLabel}
                          </a>
                          <span className="mt-1 block tabular-nums">
                            Reviewed {spec.reviewedAt}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="mt-6 text-[15px] text-[var(--jc-muted)]">
              Specific tail specifications are confirmed directly by the operating carrier for each itinerary.
            </p>
          )}
        </div>
      </section>

      {/* Studio Detail Renders Gallery + Optional Ramp Comparison Slider */}
      <section className="surface-ivory border-b border-[var(--jc-line-light)] py-20 md:py-28">
        <div className="jc-container">
          {hasRampCompare && (
            <div className="mb-16">
              <ConfigurationCompareSlider
                closedMedia={mediaById["hawker-parked"]}
                openMedia={mediaById["hawker-boarding"]}
              />
            </div>
          )}

          <h2 className="jc-display-section text-[var(--jc-ink)]">
            Studio close-ups
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {detailMedia.map((media) => (
              <figure
                key={media.id}
                className="m-0 overflow-hidden rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)]"
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-[var(--jc-stone)] p-5">
                  <img
                    src={media.path}
                    alt={media.alt}
                    width={media.width}
                    height={media.height}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </div>
                <figcaption className="border-t border-[var(--jc-line-light)] px-5 py-3.5 text-[14px] text-[var(--jc-muted)]">
                  {media.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Contextual CTA, Related Aircraft & Provenance Disclosure */}
      <section className="surface-stone py-20 md:py-24">
        <div className="jc-container">
          <div className="flex flex-col justify-between gap-6 rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-teal)] p-8 text-[var(--jc-ivory)] md:flex-row md:items-center md:p-12">
            <div className="max-w-[54ch]">
              <h2 className="font-serif text-[32px] leading-tight text-[var(--jc-ivory)]">
                Considering the {aircraft.model} class for an upcoming leg?
              </h2>
              <p className="mt-3 m-0 text-[15px] leading-relaxed text-[var(--jc-ivory-soft)]">
                Attach this model as a preference in your inquiry. Jayant and the aviation team will confirm what is available and feasible for your exact route and dates.
              </p>
            </div>
            <Link
              href={`/inquire?service=private-jet&aircraft=${aircraft.id}`}
              className="jc-btn-gold shrink-0"
            >
              Request a callback
            </Link>
          </div>

          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="font-serif text-[28px] text-[var(--jc-ink)]">
                Compare another aircraft example
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                {related.map((rel) => {
                  const relPoster = getMediaAsset(rel.posterId);
                  return (
                    <Link
                      key={rel.id}
                      href={`/aircraft/${rel.slug}`}
                      className="flex flex-col gap-5 rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)] p-6 transition-colors hover:border-[var(--jc-teal)] sm:flex-row sm:items-center"
                    >
                      <img
                        src={relPoster.path}
                        alt={relPoster.alt}
                        width={relPoster.width}
                        height={relPoster.height}
                        loading="lazy"
                        className="h-28 w-44 shrink-0 object-contain"
                      />
                      <div>
                        <p className="m-0 text-[13px] text-[var(--jc-muted)]">
                          {rel.variant}
                        </p>
                        <h3 className="mt-1 font-serif text-[24px] text-[var(--jc-ink)]">
                          {rel.displayTitle}
                        </h3>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-14 border-t border-[var(--jc-line-light)] pt-8 text-[13px] leading-relaxed text-[var(--jc-muted)]">
            <p className="m-0 font-medium text-[var(--jc-ink)]">
              Availability disclosure and asset provenance
            </p>
            <p className="mt-2 m-0 max-w-[78ch]">{aircraft.disclaimer}</p>
            <p className="mt-2 m-0">
              Bundled third-party components and CC0 studio assets: {aircraft.licenseRefs.join("; ")}.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
