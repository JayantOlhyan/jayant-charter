import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInsightBySlug, getPublishedInsights } from "@/content/repository";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

interface InsightDetailProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getPublishedInsights().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: InsightDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getInsightBySlug(slug);
  if (!entry) return {};
  return {
    title: entry.seo.title,
    description: entry.seo.description,
    alternates: { canonical: `/insights/${entry.slug}` },
  };
}

export default async function InsightDetailPage({ params }: InsightDetailProps) {
  const { slug } = await params;
  const entry = getInsightBySlug(slug);
  if (!entry) notFound();

  return (
    <article className="surface-ivory py-16 md:py-24">
      <div className="jc-container max-w-[820px]">
        <Breadcrumbs
          surface="light"
          items={[
            { label: "Home", href: "/" },
            { label: "Insights", href: "/insights" },
            { label: entry.title },
          ]}
        />
        <h1 className="jc-display-hero text-[var(--jc-ink)]">{entry.title}</h1>
        <p className="mt-5 text-[18px] leading-relaxed text-[var(--jc-muted)]">
          {entry.intro}
        </p>
        <div className="mt-10 space-y-8 text-[16px] leading-relaxed text-[var(--jc-muted)]">
          {entry.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-[28px] text-[var(--jc-ink)]">
                {section.heading}
              </h2>
              {section.paragraphs.map((p) => (
                <p key={p} className="mt-3">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
        <div className="mt-12 border-t border-[var(--jc-line-light)] pt-8">
          <Link href="/inquire" className="jc-btn-teal">
            Request a callback
          </Link>
        </div>
      </div>
    </article>
  );
}
