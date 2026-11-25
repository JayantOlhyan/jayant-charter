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
 * Digital Jets-inspired interactive Before/After wipe comparing our camera-matched
 * Hawker 4000 Parked (closed ramp) and Boarding (deployed airstair) studio renders.
 * Uses GPU-composited clip-path + native accessible range slider for full touch & keyboard support.
 */
export function ConfigurationCompareSlider({
  closedMedia,
  openMedia,
}: ConfigurationCompareSliderProps) {
  const [splitPercent, setSplitPercent] = useState<number>(52);

  return (
    <div className="overflow-hidden rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--jc-line-light)] px-6 py-4">
        <div>
          <h3 className="font-serif text-[24px] leading-snug text-[var(--jc-ink)]">
            Hawker 4000 ramp comparison
          </h3>
          <p className="mt-1 m-0 text-[14px] text-[var(--jc-muted)]">
            Drag or use arrow keys to compare closed parked ramp stance against deployed forward airstair geometry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Comparison presets">
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
                "min-h-10 rounded-[3px] border px-3 text-[13px] font-medium transition-colors cursor-pointer",
                Math.abs(splitPercent - preset.val) < 4
                  ? "border-[var(--jc-teal)] bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                  : "border-[var(--jc-line-strong)] bg-[var(--jc-ivory)] text-[var(--jc-ink)] hover:border-[var(--jc-teal)]"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive split viewport (exact 1025/535 ratio matching Blender parked/boarding camera) */}
      <div className="relative mx-auto w-full select-none overflow-hidden bg-[var(--jc-ivory)]">
        <div className="relative mx-auto aspect-[1025/535] max-h-[450px] w-full max-w-[920px] px-4 py-3 sm:px-8 sm:py-5">
          {/* Base layer: Parked closed configuration */}
          <img
            src={closedMedia.path}
            alt={closedMedia.alt}
            width={closedMedia.width}
            height={closedMedia.height}
            loading="lazy"
            className="jc-aircraft-shadow-light pointer-events-none absolute inset-x-4 inset-y-3 h-[calc(100%-1.5rem)] w-[calc(100%-2rem)] object-contain object-top sm:inset-x-8 sm:inset-y-5 sm:h-[calc(100%-2.5rem)] sm:w-[calc(100%-4rem)]"
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
              className="jc-aircraft-shadow-light absolute inset-x-4 inset-y-3 h-[calc(100%-1.5rem)] w-[calc(100%-2rem)] object-contain object-top sm:inset-x-8 sm:inset-y-5 sm:h-[calc(100%-2.5rem)] sm:w-[calc(100%-4rem)]"
            />
          </div>

          {/* Crisp vertical divider & tactile handle */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 z-10 w-[2px] bg-[var(--jc-teal)]"
            style={{ left: `${splitPercent}%` }}
          >
            <div className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[var(--jc-gold)] bg-[var(--jc-teal)] text-[var(--jc-ivory)] shadow-md">
              <MoveHorizontal className="size-4" />
            </div>
          </div>

          {/* Labels */}
          <span className="pointer-events-none absolute left-4 top-4 rounded-[2px] bg-[var(--jc-teal)] px-3 py-1 text-[12px] font-medium text-[var(--jc-ivory)] sm:left-6 sm:top-6">
            Boarding (open airstair)
          </span>
          <span className="pointer-events-none absolute right-4 top-4 rounded-[2px] border border-[var(--jc-line-strong)] bg-[var(--jc-paper)] px-3 py-1 text-[12px] font-medium text-[var(--jc-ink)] sm:right-6 sm:top-6">
            Parked (entry closed)
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

      <p className="m-0 border-t border-[var(--jc-line-light)] px-6 py-3.5 text-[13px] text-[var(--jc-muted)]">
        Static exterior display variants rendered from our Hawker 4000 kit. The boarding entry depicts a shallow display vestibule, not a full cabin interior tour.
      </p>
    </div>
  );
}
