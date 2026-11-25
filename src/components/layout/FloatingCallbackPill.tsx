"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Jesko-inspired persistent bottom-center floating inquiry action.
 * Auto-hides smoothly when the visitor reaches the inquiry form or footer so it never obstructs inputs.
 */
export function FloatingCallbackPill() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isInquirePage = pathname === "/inquire";
  const [hiddenNearForm, setHiddenNearForm] = useState(false);

  useEffect(() => {
    if (isInquirePage) {
      setHiddenNearForm(true);
      return;
    }

    const targets = [
      document.getElementById("inspect-aircraft"),
      document.getElementById("inquire"),
      document.querySelector("footer"),
    ].filter((el): el is HTMLElement => Boolean(el));

    if (targets.length === 0) {
      setHiddenNearForm(false);
      return;
    }

    const visibleSet = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibleSet.add(entry.target);
          else visibleSet.delete(entry.target);
        }
        setHiddenNearForm(visibleSet.size > 0);
      },
      { threshold: 0.08 }
    );

    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, [isInquirePage, pathname]);

  if (isInquirePage) return null;

  const href = isHome ? "#inquire" : "/inquire";

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-5 z-[var(--z-sticky)] flex justify-center px-4 transition-[opacity,transform] duration-300",
        hiddenNearForm ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
      )}
    >
      <Link
        href={href}
        aria-hidden={hiddenNearForm}
        tabIndex={hiddenNearForm ? -1 : 0}
        className={cn(
          "jc-pill-shadow pointer-events-auto inline-flex min-h-12 items-center gap-2.5 rounded-full border border-[var(--jc-line-light)] bg-[var(--jc-ivory)] py-1.5 pl-5 pr-1.5 text-[14px] font-semibold text-[var(--jc-teal)] whitespace-nowrap transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[var(--jc-paper)]",
          hiddenNearForm && "pointer-events-none"
        )}
      >
        <span>Request a callback</span>
        <span
          aria-hidden="true"
          className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--jc-teal)] text-[var(--jc-gold)]"
        >
          <Plane className="size-4" />
        </span>
      </Link>
    </div>
  );
}
