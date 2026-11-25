import Link from "next/link";
import type { CaseStudyRecord, TestimonialRecord } from "@/content/schemas";

interface ConditionalProofSectionProps {
  caseStudies: CaseStudyRecord[];
  testimonials: TestimonialRecord[];
}

/**
 * PRD Section 6.5 & AC17/AC18:
 * Case studies and testimonials render ONLY when approved published records exist.
 * Adding a valid published record in content/ automatically populates this section
 * without touching layout code.
 */
export function ConditionalProofSection({
  caseStudies,
  testimonials,
}: ConditionalProofSectionProps) {
  if (caseStudies.length === 0 && testimonials.length === 0) {
    return null;
  }

  return (
    <section className="surface-ivory border-t border-[var(--jc-line-light)] py-24 md:py-32">
      <div className="jc-container">
        {caseStudies.length > 0 && (
          <div>
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h2 className="jc-display-section text-[var(--jc-ink)]">
                  Completed arrangements
                </h2>
                <p className="mt-4 max-w-[54ch] text-[17px] text-[var(--jc-muted)]">
                  Approved, anonymized itineraries shared with permission.
                </p>
              </div>
              <Link href="/case-studies" className="jc-btn-outline-dark">
                View all case studies
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
              {caseStudies.slice(0, 4).map((study) => (
                <article
                  key={study.id}
                  className="flex flex-col justify-between rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)] p-8"
                >
                  <div>
                    <p className="m-0 text-[13px] text-[var(--jc-muted)]">
                      {study.anonymizedRoute}
                    </p>
                    <h3 className="mt-2 jc-display-title text-[var(--jc-ink)]">
                      {study.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-[var(--jc-muted)]">
                      {study.summary}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[var(--jc-line-light)]">
                    <Link
                      href={`/case-studies/${study.slug}`}
                      className="text-[14px] font-semibold text-[var(--jc-teal)] underline underline-offset-4"
                    >
                      Read case study
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {testimonials.length > 0 && (
          <div className={caseStudies.length > 0 ? "mt-20" : ""}>
            <h2 className="jc-display-section text-[var(--jc-ink)]">
              From travellers and arrangers
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
              {testimonials.map((item) => (
                <blockquote
                  key={item.id}
                  className="m-0 rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)] p-8"
                >
                  <p className="m-0 font-serif text-[22px] leading-snug text-[var(--jc-ink)]">
                    “{item.quote}”
                  </p>
                  <footer className="mt-5 text-[14px] text-[var(--jc-muted)]">
                    {item.attribution}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
