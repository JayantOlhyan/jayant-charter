import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedCaseStudies } from "@/content/repository";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "Approved, anonymized private charter case studies arranged through Jayant Charter.",
  alternates: { canonical: "/case-studies" },
};

export default function CaseStudiesPage() {
  const studies = getPublishedCaseStudies();
  // PRD §5 & AC17: Empty collections must not expose live placeholder pages
  if (studies.length === 0) {
    notFound();
  }

  return (
    <div>
      <section data-surface="dark" className="surface-dark py-16 md:py-24">
        <div className="jc-container">
          <Breadcrumbs
            surface="dark"
            items={[{ label: "Home", href: "/" }, { label: "Case studies" }]}
          />
          <h1 className="jc-display-hero text-[var(--jc-ivory)]">Case studies.</h1>
          <p className="mt-5 max-w-[54ch] text-[18px] text-[var(--jc-ivory-soft)]">
            Approved, anonymized charter itineraries published with permission.
          </p>
        </div>
      </section>

      <section className="surface-ivory py-20 md:py-28">
        <div className="jc-container grid grid-cols-1 gap-8 md:grid-cols-2">
          {studies.map((study) => (
            <article
              key={study.id}
              className="flex flex-col justify-between rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)] p-8"
            >
              <div>
                <p className="m-0 text-[13px] text-[var(--jc-muted)]">
                  {study.anonymizedRoute}
                </p>
                <h2 className="mt-2 font-serif text-[28px] text-[var(--jc-ink)]">
                  {study.title}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--jc-muted)]">
                  {study.summary}
                </p>
              </div>
              <div className="mt-6 border-t border-[var(--jc-line-light)] pt-4">
                <Link
                  href={`/case-studies/${study.slug}`}
                  className="font-medium text-[var(--jc-teal)] underline underline-offset-4"
                >
                  Read full arrangement
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
