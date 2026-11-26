"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";

interface NotFoundFlightProps {
  blueprintPath: string;
  blueprintWidth: number;
  blueprintHeight: number;
}

/**
 * Awwwards Element #4-inspired animated 404 page:
 * Warm stone-to-cream studio gradient with giant stacked translucent 404 numerals
 * and a top-down Hawker 4000 silhouette flying smoothly upward into place.
 */
export function NotFoundFlight({
  blueprintPath,
  blueprintWidth,
  blueprintHeight,
}: NotFoundFlightProps) {
  const jetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced || !jetRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        jetRef.current,
        { yPercent: 42, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.15, ease: "power3.out" }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      data-nav-theme="light"
      data-surface="light"
      data-hide-floating-cta="true"
      className="jc-light-stone relative flex min-h-[88svh] items-center overflow-hidden py-14 text-[var(--jc-ink)] sm:py-20 lg:py-24"
    >
      {/* Stacked giant translucent 404 numerals behind the aircraft */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center overflow-hidden select-none"
      >
        {[0, 1, 2].map((idx) => (
          <span
            key={idx}
            className="jc-wordmark block text-[clamp(6rem,20vw,16rem)] leading-[0.82] tracking-[-0.06em] text-[var(--jc-ink)] opacity-[0.06]"
          >
            404
          </span>
        ))}
      </div>

      <div className="jc-container relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(240px,360px)_minmax(0,1fr)]">
        <div>
          <p className="m-0 text-[13px] font-medium text-[var(--jc-muted)] tabular-nums">
            Flight path 404
          </p>
          <h1 className="jc-display-section mt-3 m-0 text-[var(--jc-ink)]">
            You&apos;ve taken a wrong turn.
          </h1>
          <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-[var(--jc-muted)]">
            This page is unavailable. Return to our flight path below.
          </p>
        </div>

        {/* Top-down vertical aircraft silhouette rising into frame */}
        <div
          ref={jetRef}
          className="mx-auto flex h-[340px] w-full max-w-[300px] items-center justify-center sm:h-[420px] will-change-transform"
        >
          <img
            src={blueprintPath}
            alt="Top-down architectural silhouette of a Hawker 4000 business jet"
            width={blueprintWidth}
            height={blueprintHeight}
            className="h-full w-full object-contain"
          />
        </div>

        <div className="lg:text-right">
          <p className="m-0 text-[14px] font-medium text-[var(--jc-ink)]">
            Back on course
          </p>
          <div className="mt-5 flex flex-wrap gap-3 lg:justify-end">
            <Link href="/" className="jc-btn-teal">
              Go home
            </Link>
            <Link href="/aircraft" className="jc-btn-outline-dark">
              Explore aircraft
            </Link>
            <Link href="/inquire" className="jc-btn-outline-dark">
              Request a callback
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
