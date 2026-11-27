"use client";

import { useState } from "react";
import { MoveHorizontal } from "lucide-react";
import type { MediaAsset } from "@/content/schemas";
import { cn } from "@/lib/utils";

interface ConfigurationCompareSliderProps {
  closedMedia: MediaAsset;
  openMedia: MediaAsset;
}

/**
 * Digital Jets-inspired borderless full-width Before/After wipe comparing our camera-matched
 * Hawker 4000 Parked (closed ramp) and Boarding (deployed airstair) studio renders.
 * Uses GPU-composited clip-path + native accessible range slider for full touch & keyboard support.
 */
export function ConfigurationCompareSlider({
  closedMedia,
  openMedia,
}: ConfigurationCompareSliderProps) {
  const [splitPercent, setSplitPercent] = useState<number>(52);

  return (
    <div className="border-y border-[var(--jc-line-light)] bg-[var(--jc-ivory)]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-end justify-between gap-4 px-[var(--gutter)] py-6">
        <div>
          <h3 className="m-0 font-serif text-[28px] leading-tight text-[var(--jc-ink)] sm:text-[32px]">
            Hawker 4000 ramp comparison
          </h3>
          <p className="mt-1.5 m-0 text-[15px] text-[var(--jc-muted)]">
            Drag or use arrow keys to compare closed ramp stance against the deployed forward airstair.
          </p>
        </div>

        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Comparison presets"
        >
          {[
            { label: "Parked closed", val: 0 },
            { label: "Split view", val: 52 },
            { label: "Boarding airstair", val: 100 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setSplitPercent(preset.val)}
              className={cn(
                "min-h-10 rounded-full border px-4 text-[13px] font-medium transition-colors cursor-pointer",
                Math.abs(splitPercent - preset.val) < 4
                  ? "border-[var(--jc-teal)] bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                  : "border-[var(--jc-line-strong)] bg-transparent text-[var(--jc-ink)] hover:border-[var(--jc-teal)]"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Full-width interactive wipe canvas (generous mobile 4:3 framing -> exact 1025/535 ratio on sm+) */}
      <div className="relative mx-auto w-full select-none overflow-hidden border-t border-[var(--jc-line-light)] bg-[var(--jc-paper)]">
        <div className="relative mx-auto aspect-[4/3] max-h-[500px] w-full max-w-[1120px] px-4 py-10 sm:aspect-[1025/535] sm:px-10 sm:py-6">
          {/* Base layer: Parked closed configuration */}
          <img
            src={closedMedia.path}
            alt={closedMedia.alt}
            width={closedMedia.width}
            height={closedMedia.height}
            loading="lazy"
            className="jc-aircraft-shadow-light pointer-events-none absolute inset-x-4 inset-y-10 h-[calc(100%-5rem)] w-[calc(100%-2rem)] object-contain object-center sm:inset-x-10 sm:inset-y-6 sm:h-[calc(100%-3rem)] sm:w-[calc(100%-5rem)] sm:object-top"
          />

          {/* Overlay layer: Boarding deployed airstair clipped via GPU clip-path */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
          >
            <img
              src={openMedia.path}
              alt=""
              width={openMedia.width}
              height={openMedia.height}
              loading="lazy"
              className="jc-aircraft-shadow-light absolute inset-x-4 inset-y-10 h-[calc(100%-5rem)] w-[calc(100%-2rem)] object-contain object-center sm:inset-x-10 sm:inset-y-6 sm:h-[calc(100%-3rem)] sm:w-[calc(100%-5rem)] sm:object-top"
            />
          </div>

          {/* Crisp vertical divider & tactile handle */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 z-10 w-[2px] bg-[var(--jc-teal)]"
            style={{ left: `${splitPercent}%` }}
          >
            <div className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[var(--jc-gold)] bg-[var(--jc-teal)] text-[var(--jc-ivory)] sm:size-12">
              <MoveHorizontal className="size-3.5 sm:size-4" />
            </div>
          </div>

          {/* Minimal architectural corner labels (compact on phones so they never collide) */}
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[var(--jc-teal)] px-3 py-1 text-[11px] font-medium text-[var(--jc-ivory)] sm:left-6 sm:top-6 sm:px-3.5 sm:text-[12px]">
            <span className="sm:hidden">Boarding</span>
            <span className="hidden sm:inline">Boarding (open airstair)</span>
          </span>
          <span className="pointer-events-none absolute right-3 top-3 rounded-full border border-[var(--jc-line-strong)] bg-[var(--jc-ivory)] px-3 py-1 text-[11px] font-medium text-[var(--jc-ink)] sm:right-6 sm:top-6 sm:px-3.5 sm:text-[12px]">
            <span className="sm:hidden">Parked</span>
            <span className="hidden sm:inline">Parked (entry closed)</span>
          </span>

          {/* Accessible range input spanning entire interactive surface */}
          <input
            type="range"
            min={0}
            max={100}
            value={splitPercent}
            aria-label="Slide to compare Hawker 4000 parked closed and boarding airstair configurations"
            onChange={(e) => setSplitPercent(Number(e.target.value))}
            className="absolute inset-0 z-20 m-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-[var(--gutter)] py-3.5">
        <p className="m-0 text-[13px] text-[var(--jc-muted)]">
          Static exterior display variants rendered from our Hawker 4000 kit. The boarding entry depicts a shallow display vestibule, not a full cabin interior tour.
        </p>
      </div>
    </div>
  );
}
