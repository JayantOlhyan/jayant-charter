import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCaseStudyBySlug,
  getMediaAsset,
  getPublishedCaseStudies,
} from "@/content/repository";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

interface CaseStudyDetailProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getPublishedCaseStudies().map((cs) => ({ slug: cs.slug }));
}

export async function generateMetadata({
  params,
}: CaseStudyDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) return {};
  const og = getMediaAsset(study.seo.ogImageId);
  return {
    title: study.seo.title,
    description: study.seo.description,
    alternates: { canonical: `/case-studies/${study.slug}` },
    openGraph: {
      title: study.seo.title,
      description: study.seo.description,
      images: [{ url: og.path, width: og.width, height: og.height, alt: og.alt }],
    },
  };
}

export default async function CaseStudyDetailPage({ params }: CaseStudyDetailProps) {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) notFound();

  return (
    <div className="surface-ivory py-16 md:py-24">
      <div className="jc-container max-w-[860px]">
        <Breadcrumbs
          surface="light"
          items={[
            { label: "Home", href: "/" },
            { label: "Case studies", href: "/case-studies" },
            { label: study.title },
          ]}
        />
        <p className="m-0 text-[14px] text-[var(--jc-muted)]">{study.anonymizedRoute}</p>
        <h1 className="mt-2 jc-display-hero text-[var(--jc-ink)]">{study.title}</h1>
        <p className="mt-5 text-[18px] leading-relaxed text-[var(--jc-muted)]">
          {study.summary}
        </p>

        <dl className="mt-8 grid grid-cols-1 gap-4 rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)] p-6 text-[14px] sm:grid-cols-3">
          <div>
            <dt className="text-[var(--jc-muted)]">Traveller profile</dt>
            <dd className="mt-1 m-0 font-medium text-[var(--jc-ink)]">{study.audience}</dd>
          </div>
          <div>
            <dt className="text-[var(--jc-muted)]">Timing</dt>
            <dd className="mt-1 m-0 font-medium text-[var(--jc-ink)]">
              {study.timingGranularity}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--jc-muted)]">Party context</dt>
            <dd className="mt-1 m-0 font-medium text-[var(--jc-ink)]">
              {study.passengerContext}
            </dd>
          </div>
        </dl>

        <div className="mt-10 space-y-8 text-[16px] leading-relaxed text-[var(--jc-muted)]">
          <section>
            <h2 className="font-serif text-[28px] text-[var(--jc-ink)]">Requirement</h2>
            <p className="mt-3">{study.challenge}</p>
          </section>
          <section>
            <h2 className="font-serif text-[28px] text-[var(--jc-ink)]">Coordination</h2>
            <p className="mt-3">{study.approach}</p>
          </section>
          <section>
            <h2 className="font-serif text-[28px] text-[var(--jc-ink)]">Outcome</h2>
            <p className="mt-3">{study.outcome}</p>
          </section>
        </div>

        <div className="mt-12 border-t border-[var(--jc-line-light)] pt-8">
          <Link href="/inquire" className="jc-btn-teal">
            Request a callback for a similar trip
          </Link>
        </div>
      </div>
    </div>
  );
}
