"use client";

import { useEffect, useState } from "react";
import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUS_CORRIDORS = [
  { city: "Dubai", note: "Executive & family departures between the UAE, India, and Europe" },
  { city: "Delhi NCR", note: "Corporate roadshows, regional charters, and multi-stop schedules" },
  { city: "Mumbai", note: "Same-day business legs, coastal transfers, and international connectors" },
  { city: "Rajasthan", note: "Private wedding arrivals, desert heritage venues, and palace charters" },
  { city: "Goa", note: "Leisure departures, family escapes, and seasonal event movements" },
  { city: "London", note: "Long-range intercontinental itineraries arranged on custom request" },
  { city: "Geneva", note: "Private diplomatic, alpine, and European multi-leg planning" },
];

/**
 * Jesko-inspired dark atmospheric corridor wheel — strictly positioned around custom
 * itinerary focus markets (never claiming a fixed scheduled network or fabricated counts).
 */
export function CorridorsMomentum() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced || paused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % FOCUS_CORRIDORS.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [paused]);

  const active = FOCUS_CORRIDORS[activeIndex];

  return (
    <section
      data-surface="dark"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative overflow-hidden border-t border-[var(--jc-line-dark)] bg-[var(--jc-teal-deep)] py-24 text-[var(--jc-ivory)] md:py-32"
    >
      <div className="jc-container">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-12">
          <div className="lg:text-right">
            <p className="m-0 font-serif text-[32px] leading-tight text-[var(--jc-ivory)] sm:text-[42px]">
              Custom itineraries
            </p>
            <p className="mt-2 m-0 text-[14px] text-[var(--jc-ivory-muted)]">
              Planned leg by leg around your departure window
            </p>
          </div>

          <div
            aria-hidden="true"
            className="hidden items-center gap-4 lg:flex"
          >
            <span className="h-px w-16 bg-[var(--jc-line-dark-strong)]" />
            <Plane className="size-4 text-[var(--jc-gold)]" />
            <span className="h-px w-16 bg-[var(--jc-line-dark-strong)]" />
          </div>

          <div className="flex flex-col gap-1.5" role="tablist" aria-label="Active focus markets">
            {FOCUS_CORRIDORS.map((item, idx) => {
              const distance = Math.abs(idx - activeIndex);
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={item.city}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setPaused(true);
                    setActiveIndex(idx);
                  }}
                  className={cn(
                    "w-fit text-left font-serif leading-[1.12] transition-[opacity,color] duration-300 cursor-pointer",
                    isSelected
                      ? "text-[34px] text-[var(--jc-ivory)] opacity-100 sm:text-[44px]"
                      : distance === 1
                        ? "text-[26px] text-[var(--jc-ivory-soft)] opacity-45 hover:opacity-80 sm:text-[32px]"
                        : "text-[22px] text-[var(--jc-ivory-muted)] opacity-25 hover:opacity-65 sm:text-[26px]"
                  )}
                >
                  {item.city}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[var(--jc-line-dark)] pt-6 sm:flex-row sm:items-center">
          <p className="m-0 max-w-[54ch] text-[15px] text-[var(--jc-ivory-soft)]">
            <strong className="font-medium text-[var(--jc-gold)]">
              {active.city}:
            </strong>{" "}
            {active.note}.
          </p>
          <p className="m-0 text-[13px] text-[var(--jc-ivory-muted)]">
            Active focus markets only; not a fixed scheduled network.
          </p>
        </div>
      </div>
    </section>
  );
}
