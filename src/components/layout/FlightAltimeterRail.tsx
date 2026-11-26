"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const WAYPOINTS = [
  { id: "hero", label: "FL450" },
  { id: "about", label: "FL380" },
  { id: "flight", label: "FL280" },
  { id: "services", label: "FL160" },
  { id: "benefits", label: "FL060" },
  { id: "global", label: "INTL" },
];

/**
 * Whisper-thin architectural vertical flight-level progress rail on xl+ desktop,
 * echoing Jesko's Awwwards altimeter language without adding clutter.
 * Auto-disabled under prefers-reduced-motion.
 */
export function FlightAltimeterRail() {
  const [progress, setProgress] = useState(0);
  const [activeLabel, setActiveLabel] = useState("FL450");
  const [lightSurface, setLightSurface] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    let rafId = 0;
    const sync = () => {
      rafId = 0;
      const scrollY = window.scrollY;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const p = Math.max(0, Math.min(1, scrollY / maxScroll));
      setProgress(p);
      setVisible(scrollY > 120);

      const midY = window.innerHeight * 0.48;
      let nextLight = false;
      const themed = document.querySelectorAll<HTMLElement>(
        "#main-content [data-nav-theme], #main-content [data-surface]"
      );
      for (const el of themed) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= midY && rect.bottom >= midY) {
          const val =
            el.getAttribute("data-nav-theme") || el.getAttribute("data-surface");
          nextLight = val === "light";
          break;
        }
      }
      setLightSurface(nextLight);

      let current = WAYPOINTS[0].label;
      for (const wp of WAYPOINTS) {
        const el = document.getElementById(wp.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= midY) {
          current = wp.label;
        }
      }
      setActiveLabel(current);
    };

    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <aside
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed right-5 top-1/2 z-[var(--z-overlay)] hidden -translate-y-1/2 flex-col items-end gap-2.5 transition-opacity duration-300 xl:flex",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <span
        className={cn(
          "text-[11px] font-medium tabular-nums transition-colors duration-300",
          lightSurface ? "text-[var(--jc-ink)]" : "text-[var(--jc-ivory)]"
        )}
      >
        {activeLabel}
      </span>

      <div className="relative flex h-36 w-4 justify-end">
        {/* Subtle vertical ruler ticks */}
        <div className="flex h-full flex-col justify-between py-0.5">
          {Array.from({ length: 9 }).map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "block h-px transition-colors duration-300",
                idx % 2 === 0 ? "w-3" : "w-1.5",
                lightSurface
                  ? "bg-[var(--jc-line-strong)]"
                  : "bg-[var(--jc-line-dark-strong)]"
              )}
            />
          ))}
        </div>

        {/* Live altitude indicator dot sliding along the ruler */}
        <span
          style={{
            transform: `translate3d(0, ${(progress * 136).toFixed(1)}px, 0)`,
          }}
          className={cn(
            "absolute right-0 top-0 h-[3px] w-4 rounded-full transition-colors duration-300 will-change-transform",
            lightSurface ? "bg-[var(--jc-ink)]" : "bg-[var(--jc-gold)]"
          )}
        />
      </div>
    </aside>
  );
}
