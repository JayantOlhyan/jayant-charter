"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { MediaAsset } from "@/content/schemas";
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
      "Your inquiry comes directly to Jayant. Only your name, international phone number, and contact permission are required to start a calm, direct conversation around your actual schedule.",
    detail:
      "You are never pushed through anonymous call queues or automated instant-booking screens that pretend to hold aircraft availability.",
    mediaId: "hawker-hero",
    mediaNote: "Direct first contact for executive, family, and event itineraries.",
  },
  {
    id: "feasibility",
    number: "02",
    title: "Feasibility checked before quoting",
    summary:
      "Once your route, dates, luggage, or venue details are clear and you confirm permission for onward sharing, the aviation sourcing team verifies runway suitability, aircraft positioning, and helipad clearances.",
    detail:
      "Non-stop range, payload margins, and helicopter venue permissions are verified per leg rather than assumed from brochure specifications.",
    mediaId: "falcon-hero",
    mediaNote: "Suitability, range under load, and airport slots verified for your exact dates.",
  },
  {
    id: "carrier-clarity",
    number: "03",
    title: "Clear about who operates the flight",
    summary:
      "Before anything is confirmed or paid, you review written aircraft options naming the contracting party and the licensed air carrier operating the flight.",
    detail:
      "Jayant Charter is a founder-led inquiry desk, not an aircraft owner or airline. Full operational authority remains with the licensed carrier.",
    mediaId: "hawker-entry-detail",
    mediaNote: "Written quotes name the exact aircraft and licensed operating carrier.",
  },
  {
    id: "discretion",
    number: "04",
    title: "Discretion and staged permission",
    summary:
      "Initial permission covers Jayant's callback only. Contact details are never automatically forwarded to third parties on form submission, and sensitive documents such as passports are never requested online.",
    detail:
      "Repeat introducers, family offices, and executive assistants can coordinate discreetly with clear attribution and zero public disclosure.",
    mediaId: "group-charter-editorial",
    mediaNote: "Built for private families, executive assistants, advisors, and wedding planners.",
  },
];

export function TrustEditorialSplit({ mediaById }: TrustEditorialSplitProps) {
  const [activeId, setActiveId] = useState<string>(EXPERIENCE_ROWS[0].id);
  const activeRow =
    EXPERIENCE_ROWS.find((row) => row.id === activeId) || EXPERIENCE_ROWS[0];

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:items-start lg:gap-16">
      {/* Left: Jesko-inspired spacious horizontal-rule interactive accordion */}
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
                className="flex min-h-[72px] w-full items-center justify-between gap-4 py-6 text-left cursor-pointer"
              >
                <span className="flex items-baseline gap-4">
                  <span className="font-serif text-[18px] text-[var(--jc-gold-muted)] tabular-nums">
                    {row.number}
                  </span>
                  <span
                    className={cn(
                      "font-serif text-[24px] leading-snug transition-colors sm:text-[28px]",
                      isOpen ? "text-[var(--jc-ink)]" : "text-[var(--jc-muted)] hover:text-[var(--jc-ink)]"
                    )}
                  >
                    {row.title}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--jc-line-strong)] text-[var(--jc-ink)]"
                >
                  {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                </span>
              </button>

              {isOpen && (
                <div className="pb-7 pl-9 sm:pl-10">
                  <p className="m-0 max-w-[52ch] text-[16px] leading-relaxed text-[var(--jc-ink)]">
                    {row.summary}
                  </p>
                  <p className="mt-3 mb-0 max-w-[52ch] text-[15px] leading-relaxed text-[var(--jc-muted)]">
                    {row.detail}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right: Flush Jesko-style architectural visual frame (pure GPU CSS opacity stack) */}
      <div className="overflow-hidden bg-[var(--jc-stone)]">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--jc-stone)]">
          {EXPERIENCE_ROWS.map((row) => {
            const media = mediaById[row.mediaId];
            const isRender = media.type === "render";
            const visible = row.id === activeId;
            return (
              <div
                key={row.id}
                aria-hidden={!visible}
                className={cn(
                  "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-300 ease-out",
                  isRender ? "bg-[var(--jc-stone)] p-8 sm:p-12" : "bg-[var(--jc-teal-deep)]",
                  visible ? "opacity-100" : "pointer-events-none opacity-0"
                )}
              >
                <img
                  src={media.path}
                  alt={visible ? media.alt : ""}
                  width={media.width}
                  height={media.height}
                  loading="lazy"
                  className={
                    isRender
                      ? "jc-aircraft-shadow-light max-h-full w-full object-contain"
                      : "h-full w-full object-cover"
                  }
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[var(--jc-line-light)] bg-[var(--jc-ivory)] py-4 text-[14px] text-[var(--jc-muted)]">
          <span className="font-serif text-[17px] text-[var(--jc-ink)] tabular-nums">
            {activeRow.number}
          </span>
          <span className="flex-1">{activeRow.mediaNote}</span>
        </div>
      </div>
    </div>
  );
}
