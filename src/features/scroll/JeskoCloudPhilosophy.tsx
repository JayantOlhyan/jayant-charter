"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Compass } from "lucide-react";
import type { MediaAsset } from "@/content/schemas";

gsap.registerPlugin(ScrollTrigger);

interface JeskoCloudPhilosophyProps {
  skyDaylight: MediaAsset;
  cloudsMarquee: MediaAsset;
}

const LEAD_STATEMENT =
  "Jayant Charter is a founder-led private aviation inquiry desk for custom jet, group charter, and helicopter itineraries. One direct conversation before suitability, range, and licensed carrier options are verified.";

const PILLARS = [
  {
    title: "Direct Access to Private Travel",
    body: "Every request starts directly with Jayant rather than an automated queue. Private jets, 22+ guest group charters, and helicopter transfers are scoped around your exact schedule.",
  },
  {
    title: "Built Around Your Schedule",
    body: "Whether coordinating a same-day business return, a multi-stop leadership roadshow, or a destination wedding movement, timings are verified against actual airport and slot realities.",
  },
  {
    title: "Feasibility Verified First",
    body: "Non-stop range under passenger and baggage load, runway margins, and venue helipad clearances are checked with licensed aviation partners before written options are shared.",
  },
  {
    title: "Discretion & Clear Attribution",
    body: "Initial consent covers Jayant's callback only. Details are never forwarded onward without your explicit permission, and licensed operating carriers are named before confirmation.",
  },
];

/**
 * Jesko-inspired sky-to-cream immersion band (step_10 parity):
 * - Seamless multi-stop azure sky (#015AA9 -> #8FC2D7 -> #FFF8ED) with soft drifting clouds
 * - Scroll-scrubbed character-by-character opacity highlight (0.18 -> 1.0, exact initHighlightText behavior)
 * - Clean 2x2 borderless floating typography pillars with crisp hairline rules
 */
export function JeskoCloudPhilosophy({
  skyDaylight,
  cloudsMarquee,
}: JeskoCloudPhilosophyProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const highlightRef = useRef<HTMLParagraphElement>(null);
  const pillarsWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (prefersReduced || !isDesktop) return;

    const ctx = gsap.context(() => {
      // Exact Jesko initHighlightText: word/char opacity scrub 0.18 -> 1 as you read
      if (highlightRef.current) {
        const words = highlightRef.current.querySelectorAll("[data-hw]");
        gsap.fromTo(
          words,
          { opacity: 0.18 },
          {
            opacity: 1,
            stagger: 0.04,
            ease: "none",
            scrollTrigger: {
              trigger: highlightRef.current,
              start: "top 80%",
              end: "bottom 55%",
              scrub: true,
            },
          }
        );
      }

      // Subtle blur-to-sharp reveal for the 4 floating pillars (Jesko initScrollElementsReveal parity)
      if (pillarsWrapRef.current) {
        const items = pillarsWrapRef.current.querySelectorAll("[data-pillar]");
        gsap.fromTo(
          items,
          { opacity: 0.2, filter: "blur(14px)", y: 24 },
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            stagger: 0.12,
            duration: 0.9,
            ease: "power3.out",
            clearProps: "filter",
            scrollTrigger: {
              trigger: pillarsWrapRef.current,
              start: "top 82%",
              end: "top 35%",
              scrub: 0.5,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const words = LEAD_STATEMENT.split(" ");

  return (
    <section
      id="about"
      ref={sectionRef}
      data-nav-theme="dark"
      data-surface="dark"
      className="jc-sky-about relative overflow-hidden pb-36 pt-28 text-[var(--jc-ivory)] md:pb-48 md:pt-40"
    >
      {/* Ambient soft drifting sky texture layered gently across the azure sky */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-28 mix-blend-soft-light"
      >
        <img
          src={skyDaylight.path}
          alt=""
          width={skyDaylight.width}
          height={skyDaylight.height}
          loading="lazy"
          className="h-full w-full object-cover object-top"
        />
      </div>
      <div
        aria-hidden="true"
        className="jc-cloud-fade-bottom pointer-events-none absolute inset-x-0 top-0 h-[72%] overflow-hidden"
      >
        <div className="jc-cloud-marquee flex h-full w-[400%] opacity-26 mix-blend-screen">
          <img
            src={cloudsMarquee.path}
            alt=""
            width={cloudsMarquee.width}
            height={cloudsMarquee.height}
            loading="lazy"
            className="h-full w-[calc(25%+2px)] shrink-0 object-cover"
          />
          <img
            src={cloudsMarquee.path}
            alt=""
            width={cloudsMarquee.width}
            height={cloudsMarquee.height}
            loading="lazy"
            className="-ml-[2px] h-full w-[calc(25%+2px)] shrink-0 -scale-x-100 object-cover"
          />
          <img
            src={cloudsMarquee.path}
            alt=""
            width={cloudsMarquee.width}
            height={cloudsMarquee.height}
            loading="lazy"
            className="-ml-[2px] h-full w-[calc(25%+2px)] shrink-0 object-cover"
          />
          <img
            src={cloudsMarquee.path}
            alt=""
            width={cloudsMarquee.width}
            height={cloudsMarquee.height}
            loading="lazy"
            className="-ml-[2px] h-full w-[calc(25%+2px)] shrink-0 -scale-x-100 object-cover"
          />
        </div>
      </div>

      <div className="jc-container relative z-10">
        {/* Scroll-scrubbed monumental lead manifesto (exact Jesko highlight text effect) */}
        <div className="max-w-[1120px]">
          <p
            ref={highlightRef}
            className="jc-display-section jc-sky-legible m-0 leading-[1.12] text-[var(--jc-ivory)]"
          >
            {words.map((word, idx) => (
              <span key={`${word}-${idx}`} data-hw="1" className="inline-block">
                {word}
                {idx < words.length - 1 ? "\u00A0" : ""}
              </span>
            ))}
          </p>
        </div>

        {/* Jesko step_10 2-column architectural pillars + left founder emblem */}
        <div className="mt-24 grid grid-cols-1 gap-12 lg:mt-32 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] lg:gap-16">
          <div className="flex items-start gap-4 pt-2">
            <span
              aria-hidden="true"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--jc-line-dark-strong)] text-[var(--jc-ivory)]"
            >
              <Compass className="size-5" />
            </span>
            <div>
              <p className="jc-brand-mark jc-sky-legible m-0 text-[16px] text-[var(--jc-ivory)]">
                Jayant Charter
              </p>
              <p className="jc-sky-legible mt-1 m-0 max-w-[26ch] text-[13px] leading-snug text-[var(--jc-ivory)]">
                Custom private aviation inquiries across Dubai, Delhi NCR, Mumbai, Rajasthan, Goa, and worldwide corridors.
              </p>
            </div>
          </div>

          <div
            ref={pillarsWrapRef}
            className="grid grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2"
          >
            {PILLARS.map((pillar) => (
              <div key={pillar.title} data-pillar="1">
                <h2 className="jc-display-title jc-sky-legible m-0 text-[var(--jc-ivory)]">
                  {pillar.title}
                </h2>
                <div className="my-4 h-px w-8 bg-[var(--jc-line-dark-strong)]" />
                <p className="jc-sky-legible m-0 max-w-[36ch] text-[15px] leading-relaxed text-[var(--jc-ivory)]">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
