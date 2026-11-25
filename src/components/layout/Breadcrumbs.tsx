import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  surface?: "dark" | "light";
}

export function Breadcrumbs({ items, surface = "dark" }: BreadcrumbsProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.label,
      ...(item.href ? { item: `${siteUrl}${item.href}` } : {}),
    })),
  };

  const mutedClass =
    surface === "dark" ? "text-[var(--jc-ivory-muted)]" : "text-[var(--jc-muted)]";
  const currentClass =
    surface === "dark" ? "text-[var(--jc-ivory)]" : "text-[var(--jc-ink)]";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className={`m-0 flex flex-wrap items-center gap-2 list-none p-0 text-[13px] ${mutedClass}`}>
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <li key={item.label} className="flex items-center gap-2">
                {idx > 0 && <span aria-hidden="true">/</span>}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="py-1 underline-offset-4 hover:underline"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page" className={currentClass}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
