import Link from "next/link";

export default function NotFound() {
  return (
    <section className="surface-ivory py-28 md:py-36">
      <div className="jc-container max-w-[680px]">
        <p className="m-0 font-serif text-[20px] text-[var(--jc-muted)] tabular-nums">
          404
        </p>
        <h1 className="mt-3 jc-display-hero text-[var(--jc-ink)]">
          That page is not published.
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-[var(--jc-muted)]">
          The link may have moved, or the record is not available publicly. You can return to the homepage, explore aircraft examples, or start a callback request directly.
        </p>
        <div className="mt-8 flex flex-wrap gap-3.5">
          <Link href="/" className="jc-btn-teal">
            Back to homepage
          </Link>
          <Link href="/aircraft" className="jc-btn-outline-dark">
            Explore aircraft
          </Link>
          <Link href="/inquire" className="jc-btn-outline-dark">
            Request a callback
          </Link>
        </div>
      </div>
    </section>
  );
}
