import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAircraftById,
  getFaqsByIds,
  getMediaAsset,
  getPublishedServices,
  getServiceBySlug,
} from "@/content/repository";
import type { AircraftRecord } from "@/content/schemas";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { FaqBlock } from "@/components/blocks/FaqBlock";

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getPublishedServices().map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  const og = getMediaAsset(service.seo.ogImageId);
  return {
    title: service.seo.title,
    description: service.seo.description,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: service.seo.title,
      description: service.seo.description,
      images: [{ url: og.path, width: og.width, height: og.height, alt: og.alt }],
    },
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const heroMedia = getMediaAsset(service.heroMediaId);
  const relatedAircraft = service.relatedAircraftIds
    .map((id) => getAircraftById(id))
    .filter((item): item is AircraftRecord => Boolean(item));
  const faqs = getFaqsByIds(service.faqIds);
  const otherServices = getPublishedServices().filter((s) => s.slug !== service.slug);

  const isTransparentRender = heroMedia.type === "render";

  return (
    <div>
      {/* Hero */}
      <section data-surface="dark" className="surface-dark py-16 md:py-24">
        <div className="jc-container">
          <Breadcrumbs
            surface="dark"
            items={[
              { label: "Home", href: "/" },
              { label: "Services", href: "/#services" },
              { label: service.title },
            ]}
          />

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
            <div>
              <h1 className="jc-display-hero text-[var(--jc-ivory)]">
                {service.headline}
              </h1>
              <p className="mt-6 max-w-[50ch] text-[18px] leading-relaxed text-[var(--jc-ivory-soft)]">
                {service.summary}
              </p>
              <div className="mt-8 flex flex-wrap gap-3.5">
                <Link
                  href={`/inquire?service=${service.inquiryServiceKey}`}
                  className="jc-btn-gold"
                >
                  {service.ctaLabel}
                </Link>
                <Link href="/how-it-works" className="jc-btn-outline-light">
                  How inquiries work
                </Link>
              </div>
            </div>

            <figure
              className={
                isTransparentRender
                  ? "jc-stage-twilight m-0 flex flex-col items-center rounded-[4px] border border-[var(--jc-line-dark)] p-6 sm:p-10"
                  : "m-0 overflow-hidden rounded-[4px] border border-[var(--jc-line-dark)] bg-[var(--jc-teal-deep)]"
              }
            >
              <img
                src={heroMedia.path}
                alt={heroMedia.alt}
                width={heroMedia.width}
                height={heroMedia.height}
                fetchPriority="high"
                className={
                  isTransparentRender
                    ? "jc-aircraft-shadow w-full object-contain"
                    : "aspect-[16/10] w-full object-cover"
                }
              />
              <figcaption
                className={
                  isTransparentRender
                    ? "mt-5 text-[13px] text-[var(--jc-ivory-muted)]"
                    : "border-t border-[var(--jc-line-dark)] bg-[var(--jc-teal-deep)] px-5 py-3.5 text-[13px] text-[var(--jc-ivory-muted)]"
                }
              >
                {heroMedia.caption}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Editorial overview & inquiry checklist */}
      <section className="surface-ivory border-b border-[var(--jc-line-light)] py-20 md:py-28">
        <div className="jc-container grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          <div>
            <h2 className="jc-display-section text-[var(--jc-ink)]">
              How {service.title.toLowerCase()} are arranged
            </h2>
            <div className="mt-6 space-y-5 text-[17px] leading-relaxed text-[var(--jc-muted)]">
              {service.editorialIntro.map((paragraph) => (
                <p key={paragraph} className="m-0 max-w-[60ch]">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <aside className="jc-editorial-card p-7 sm:p-9">
            <h3 className="font-serif text-[26px] text-[var(--jc-ink)]">
              Helpful details to share
            </h3>
            <p className="mt-2.5 text-[14px] text-[var(--jc-muted)]">
              Name and phone number are enough to begin. Include any of the points below if you already have them:
            </p>
            <ul className="mt-5 space-y-3 border-t border-[var(--jc-line-light)] pt-5 text-[15px] text-[var(--jc-ink)]">
              {service.inquiryChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-7">
              <Link
                href={`/inquire?service=${service.inquiryServiceKey}`}
                className="jc-btn-teal w-full"
              >
                Request a callback
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Use cases */}
      <section className="surface-stone border-b border-[var(--jc-line-light)] py-20 md:py-24">
        <div className="jc-container">
          <h2 className="jc-display-section text-[var(--jc-ink)]">
            Common trip requirements
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {service.useCases.map((useCase, idx) => (
              <article
                key={useCase.title}
                className="border-t border-[var(--jc-line-strong)] pt-6"
              >
                <span className="font-serif text-[18px] text-[var(--jc-muted)] tabular-nums">
                  0{idx + 1}
                </span>
                <h3 className="mt-3 font-serif text-[24px] leading-snug text-[var(--jc-ink)]">
                  {useCase.title}
                </h3>
                <p className="mt-3 m-0 text-[15px] leading-relaxed text-[var(--jc-muted)]">
                  {useCase.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Relevant aircraft examples (poster cards only; omitted for group & helicopter per PRD) */}
      {relatedAircraft.length > 0 && (
        <section className="surface-ivory border-b border-[var(--jc-line-light)] py-20 md:py-28">
          <div className="jc-container">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h2 className="jc-display-section text-[var(--jc-ink)]">
                  Illustrative aircraft examples
                </h2>
                <p className="mt-3 max-w-[54ch] text-[16px] text-[var(--jc-muted)]">
                  Open an aircraft profile to inspect the interactive 3D exterior and close-up renders.
                </p>
              </div>
              <Link href="/aircraft" className="jc-btn-outline-dark">
                All aircraft examples
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
              {relatedAircraft.map((ac) => {
                const poster = getMediaAsset(ac.posterId);
                return (
                  <article
                    key={ac.id}
                    className="flex flex-col overflow-hidden rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)]"
                  >
                    <div className="flex items-center justify-center bg-[var(--jc-stone)] p-8">
                      <img
                        src={poster.path}
                        alt={poster.alt}
                        width={poster.width}
                        height={poster.height}
                        loading="lazy"
                        className="jc-aircraft-shadow-light max-h-[240px] w-full object-contain"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-7">
                      <div>
                        <p className="m-0 text-[13px] text-[var(--jc-muted)]">{ac.variant}</p>
                        <h3 className="mt-1.5 font-serif text-[28px] text-[var(--jc-ink)]">
                          {ac.displayTitle}
                        </h3>
                        <p className="mt-3 text-[15px] leading-relaxed text-[var(--jc-muted)]">
                          {ac.summary}
                        </p>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t border-[var(--jc-line-light)]">
                        <Link href={`/aircraft/${ac.slug}`} className="jc-btn-teal !min-h-[44px]">
                          Explore in 3D
                        </Link>
                        <Link
                          href={`/inquire?service=private-jet&aircraft=${ac.id}`}
                          className="jc-btn-outline-dark !min-h-[44px]"
                        >
                          Ask about this model
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Availability qualifier + Service FAQs */}
      <section className="surface-ivory py-20 md:py-28">
        <div className="jc-container">
          <div className="mb-16 rounded-[4px] border-l-2 border-[var(--jc-teal)] bg-[var(--jc-stone)] px-6 py-5 text-[15px] leading-relaxed text-[var(--jc-ink)]">
            <strong className="font-semibold">Availability and operational review: </strong>
            {service.availabilityQualifier}
          </div>

          <FaqBlock
            items={faqs}
            heading={`${service.title} questions.`}
            intro="Key operational details before requesting a callback."
          />

          <div className="mt-20 flex flex-col justify-between gap-6 border-t border-[var(--jc-line-light)] pt-12 md:flex-row md:items-center">
            <div>
              <h2 className="font-serif text-[30px] text-[var(--jc-ink)]">
                Explore other charter services
              </h2>
              <div className="mt-3 flex flex-wrap gap-6 text-[15px]">
                {otherServices.map((other) => (
                  <Link
                    key={other.slug}
                    href={`/services/${other.slug}`}
                    className="font-medium text-[var(--jc-teal)] underline underline-offset-4"
                  >
                    {other.title}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href={`/inquire?service=${service.inquiryServiceKey}`}
              className="jc-btn-teal"
            >
              {service.ctaLabel}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
