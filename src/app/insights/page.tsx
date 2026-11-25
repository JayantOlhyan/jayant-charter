import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedInsights } from "@/content/repository";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Insights",
  description: "Practical private aviation planning notes from Jayant Charter.",
  alternates: { canonical: "/insights" },
};

export default function InsightsPage() {
  const entries = getPublishedInsights();
  if (entries.length === 0) notFound();

  return (
    <div className="surface-ivory py-16 md:py-24">
      <div className="jc-container">
        <Breadcrumbs
          surface="light"
          items={[{ label: "Home", href: "/" }, { label: "Insights" }]}
        />
        <h1 className="jc-display-hero text-[var(--jc-ink)]">Insights.</h1>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)] p-8"
            >
              <h2 className="font-serif text-[28px] text-[var(--jc-ink)]">{entry.title}</h2>
              <p className="mt-3 text-[15px] text-[var(--jc-muted)]">{entry.intro}</p>
              <Link
                href={`/insights/${entry.slug}`}
                className="mt-5 inline-block font-medium text-[var(--jc-teal)] underline underline-offset-4"
              >
                Read note
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
