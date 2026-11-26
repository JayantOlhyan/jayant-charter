"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Plus } from "lucide-react";
import type { MediaAsset } from "@/content/schemas";
import { useLocalClock } from "@/lib/use-local-clock";
import { cn } from "@/lib/utils";

interface TrustEditorialSplitProps {
  mediaById: Record<string, MediaAsset>;
}

const EXPERIENCE_ROWS = [
  {
    id: "first-contact",
    number: "01",
    title: "Tell Jayant about the trip",
    summary:
      "Your inquiry comes directly to Jayant. Only your name, international phone number, and contact permission are required to start a calm, direct conversation around your schedule.",
    detail:
      "No call queues, no automated instant-booking screens pretending to hold live aircraft availability.",
    mediaId: "cabin-editorial",
    mediaNote: "Illustrative sunlit cabin mood. Direct first contact from your very first message.",
  },
  {
    id: "feasibility",
    number: "02",
    title: "Feasibility checked first",
    summary:
      "Once route, dates, luggage, and venue details are clear and you confirm permission for onward sharing, aviation partners verify runway suitability, positioning, and helipad clearances.",
    detail:
      "Non-stop range under actual payload and helicopter landing permissions are checked leg by leg.",
    mediaId: "falcon-hero",
    mediaNote: "Illustrative Dassault Falcon 2000 Classic. Range and runway margins verified per leg.",
  },
  {
    id: "carrier-clarity",
    number: "03",
    title: "Clear operating authority",
    summary:
      "Before anything is confirmed or paid, you review written aircraft options clearly naming the contracting party and the licensed air carrier operating the flight.",
    detail:
      "Jayant Charter is a founder-led inquiry desk, not an aircraft owner or airline.",
    mediaId: "group-charter-editorial",
    mediaNote: "Written quotes name the confirmed aircraft class and licensed operating carrier.",
  },
  {
    id: "discretion",
    number: "04",
    title: "Discretion & staged consent",
    summary:
      "Initial permission covers Jayant's callback only. Contact details are never automatically forwarded onward on form submission, and sensitive documents are never collected online.",
    detail:
      "Built for principals, family offices, executive assistants, and private event planners.",
    mediaId: "helicopter-editorial",
    mediaNote: "Illustrative arrival terrace. Built for private families, advisors, and wedding teams.",
  },
];

/**
 * Jesko step_20 synced Benefits/Advantages split:
 * - Spacious horizontal-rule expandable rows with rotating + icon
 * - Right-hand flush architectural frame with counter-parallax slide-up & de-zoom reveal (initBenefitsAccordion parity)
 * - Lower 3-column honest status strip with visitor local time (IP-aware / browser timezone)
 */
export function TrustEditorialSplit({ mediaById }: TrustEditorialSplitProps) {
  const [activeId, setActiveId] = useState<string>(EXPERIENCE_ROWS[0].id);
  const localClock = useLocalClock();
  const frameWrapRef = useRef<HTMLDivElement>(null);
  const frameImgRef = useRef<HTMLImageElement>(null);

  const activeRow =
    EXPERIENCE_ROWS.find((row) => row.id === activeId) || EXPERIENCE_ROWS[0];
  const activeMedia = mediaById[activeRow.mediaId] || mediaById["hawker-hero"];
  const isRender = activeMedia.type === "render";

  // Jesko exact counter-parallax slide-up + scale 1.35 -> 1 reveal on row switch
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced || !frameWrapRef.current || !frameImgRef.current) return;

    gsap.killTweensOf([frameWrapRef.current, frameImgRef.current]);
    gsap.fromTo(
      frameWrapRef.current,
      { clipPath: "inset(100% 0 0 0)" },
      { clipPath: "inset(0% 0 0 0)", duration: 0.85, ease: "power3.out" }
    );
    gsap.fromTo(
      frameImgRef.current,
      { scale: 1.32, yPercent: -12 },
      { scale: 1, yPercent: 0, duration: 0.9, ease: "power3.out" }
    );
  }, [activeId]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] lg:items-start lg:gap-16">
        {/* Left: Spacious horizontal-rule expandable rows */}
        <div className="border-t border-[var(--jc-line-light)]">
          {EXPERIENCE_ROWS.map((row) => {
            const isOpen = row.id === activeId;
            return (
              <div
                key={row.id}
                className="border-b border-[var(--jc-line-light)]"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setActiveId(row.id)}
                  className="flex min-h-[76px] w-full items-center justify-between gap-4 py-6 text-left cursor-pointer"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="text-[13px] font-medium text-[var(--jc-muted)] tabular-nums">
                      {row.number}
                    </span>
                    <span
                      className={cn(
                        "jc-display-title transition-colors",
                        isOpen
                          ? "text-[var(--jc-ink)]"
                          : "text-[var(--jc-muted)] hover:text-[var(--jc-ink)]"
                      )}
                    >
                      {row.title}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--jc-line-strong)] text-[var(--jc-ink)] transition-transform duration-300",
                      isOpen && "rotate-45"
                    )}
                  >
                    <Plus className="size-4" />
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-7 pl-9 sm:pl-10">
                    <p className="m-0 max-w-[50ch] text-[16px] leading-relaxed text-[var(--jc-ink)]">
                      {row.summary}
                    </p>
                    <p className="mt-3 mb-0 max-w-[50ch] text-[15px] leading-relaxed text-[var(--jc-muted)]">
                      {row.detail}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Flush Jesko counter-parallax editorial visual frame */}
        <div className="overflow-hidden bg-[var(--jc-stone)]">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--jc-stone)]">
            <div
              ref={frameWrapRef}
              className={cn(
                "flex h-full w-full items-center justify-center overflow-hidden will-change-transform",
                isRender ? "bg-[var(--jc-stone)] p-8 sm:p-12" : "bg-[var(--jc-teal-deep)]"
              )}
            >
              <img
                ref={frameImgRef}
                key={activeRow.id}
                src={activeMedia.path}
                alt={activeMedia.alt}
                width={activeMedia.width}
                height={activeMedia.height}
                loading="lazy"
                className={cn(
                  "will-change-transform",
                  isRender
                    ? "jc-aircraft-shadow-light max-h-full w-full object-contain"
                    : "h-full w-full object-cover"
                )}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-[var(--jc-line-light)] bg-[var(--jc-ivory)] py-4 text-[13px] text-[var(--jc-muted)]">
            <span className="font-semibold text-[var(--jc-ink)] tabular-nums">
              {activeRow.number}
            </span>
            <span className="flex-1">{activeRow.mediaNote}</span>
          </div>
        </div>
      </div>

      {/* Jesko step_22 honest 3-column lower architectural strip with visitor local time */}
      <div className="mt-20 grid grid-cols-1 gap-6 border-t border-[var(--jc-line-light)] pt-7 sm:grid-cols-3">
        <div>
          <p className="m-0 text-[12px] font-medium text-[var(--jc-muted)]">
            Inquiry desk
          </p>
          <p className="mt-1 m-0 text-[15px] font-semibold text-[var(--jc-ink)]">
            Founder-led, direct first contact
          </p>
        </div>

        <div>
          <p className="m-0 text-[12px] font-medium text-[var(--jc-muted)]">
            Active focus markets
          </p>
          <p className="mt-1 m-0 text-[15px] font-semibold text-[var(--jc-ink)]">
            Delhi NCR, Mumbai, Rajasthan, Goa &amp; international
          </p>
        </div>

        <div className="sm:text-right">
          <p className="m-0 text-[12px] font-medium text-[var(--jc-muted)]">
            Local time ({localClock.zoneLabel})
          </p>
          <p className="jc-display-title mt-0.5 m-0 text-[var(--jc-ink)] tabular-nums">
            {localClock.time}
          </p>
        </div>
      </div>
    </div>
  );
}
