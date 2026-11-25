"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type {
  AircraftRecord,
  CaseStudyRecord,
  ExampleScenario,
  FaqItem,
  MediaAsset,
  ServiceRecord,
  SiteSettings,
  TestimonialRecord,
} from "@/content/schemas";
import { AircraftStudioViewer } from "@/features/aircraft/AircraftStudioViewer";
import { ProgressiveInquiryForm } from "@/features/inquiry/ProgressiveInquiryForm";
import { FaqBlock } from "@/components/blocks/FaqBlock";
import { ConditionalProofSection } from "@/components/blocks/ConditionalProofSection";

gsap.registerPlugin(ScrollTrigger);

interface HomeExperienceProps {
  settings: SiteSettings;
  services: ServiceRecord[];
  aircraftList: AircraftRecord[];
  scenarios: ExampleScenario[];
  faqs: FaqItem[];
  caseStudies: CaseStudyRecord[];
  testimonials: TestimonialRecord[];
  mediaById: Record<string, MediaAsset>;
}

const PROCESS_STEPS = [
  {
    num: "01",
    title: "Tell Jayant about the trip",
    body: "Name and phone number are enough to begin. Add your route, travel window, passenger count, or venue if you already have them.",
  },
  {
    num: "02",
    title: "Review feasible aircraft options",
    body: "The aviation team checks routing, airports, helipad permissions, and live availability before returning suitable aircraft options and a written quote.",
  },
  {
    num: "03",
    title: "Confirm with the booking party",
    body: "You see the exact aircraft, operating carrier, and contract terms before confirming or paying anything.",
  },
];

const TRUST_PILLARS = [
  {
    title: "One accountable contact",
    body: "Jayant receives your first inquiry personally and coordinates follow-up so you are never handed between anonymous call desks.",
  },
  {
    title: "Permission before sharing",
    body: "Your phone number and itinerary are shared with an aviation sourcing team or operator only after you confirm permission for your trip.",
  },
  {
    title: "Transparent operating role",
    body: "Flights are operated by licensed air carriers identified in your quote. Models presented here are illustrative exterior examples.",
  },
];

export function HomeExperience({
  settings,
  services,
  aircraftList,
  scenarios,
  faqs,
  caseStudies,
  testimonials,
  mediaById,
}: HomeExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedService, setSelectedService] = useState<
    "private-jet" | "group-charter" | "helicopter" | "decide"
  >("decide");
  const [selectedAircraftPref, setSelectedAircraftPref] = useState<string | null>(null);

  const skyPlate = mediaById["hero-sky-plate"];
  const heroJet = mediaById["hawker-hero"];
  const approachJet = mediaById["hawker-low-angle"];
  const falconHero = mediaById["falcon-hero"];
  const groupImg = mediaById["group-charter-editorial"];
  const heliImg = mediaById["helicopter-editorial"];
  const engineDetail = mediaById["hawker-engine-detail"];
  const entryDetail = mediaById["hawker-entry-detail"];
  const gearDetail = mediaById["hawker-gear-detail"];
  const falconEngine = mediaById["falcon-engine-detail"];

  // Centralized single ScrollTrigger choreography (PRD §15.5, §18.2, AC07)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (prefersReduced || !isDesktop) return;

    const ctx = gsap.context(() => {
      // Chapter 1: Multi-plane atmospheric depth on hero scroll
      gsap.to("[data-plane='sky']", {
        yPercent: 14,
        scale: 1.09,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-chapter='arrival']",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to("[data-plane='hero-jet']", {
        y: -44,
        x: -36,
        scale: 1.04,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-chapter='arrival']",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to("[data-plane='hero-copy']", {
        y: 36,
        opacity: 0.32,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-chapter='arrival']",
          start: "top top",
          end: "80% top",
          scrub: true,
        },
      });

      // Chapter 2: Signature Move — The Approach (bounded flight glide into profile framing)
      gsap.fromTo(
        "[data-plane='approach-jet']",
        { xPercent: 8, y: 24, scale: 0.96 },
        {
          xPercent: -6,
          y: -18,
          scale: 1.03,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-chapter='approach']",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );

      // Chapter 5: Subtle differential parallax on detail macro plate
      gsap.fromTo(
        "[data-plane='macro-lead']",
        { y: 28 },
        {
          y: -24,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-chapter='detail']",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  const prefillService = (svc: "private-jet" | "group-charter" | "helicopter") => {
    setSelectedService(svc);
  };

  const prefillAircraft = (aircraftId: string) => {
    setSelectedService("private-jet");
    setSelectedAircraftPref(aircraftId);
  };

  const privateJetsSvc = services.find((s) => s.slug === "private-jets");
  const groupSvc = services.find((s) => s.slug === "group-charter");
  const heliSvc = services.find((s) => s.slug === "helicopters");

  return (
    <div ref={rootRef}>
      {/* =====================================================================
          CHAPTER 1: ARRIVAL — Multi-plane dimensional hero (fits 1280x800 cleanly)
      ===================================================================== */}
      <section
        data-chapter="arrival"
        data-surface="dark"
        className="relative overflow-hidden bg-[var(--jc-teal-deep)] text-[var(--jc-ivory)]"
      >
        {/* Plane 0: High-altitude twilight sky plate */}
        <div
          data-plane="sky"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 origin-center will-change-transform"
        >
          <img
            src={skyPlate.path}
            alt=""
            width={skyPlate.width}
            height={skyPlate.height}
            fetchPriority="high"
            className="h-full w-full object-cover object-bottom opacity-95"
          />
        </div>

        {/* Plane 1: Targeted reading scrim (left edge & bottom caption lip, keeping twilight horizon crisp) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(102deg, rgba(10,29,28,0.88) 0%, rgba(16,43,42,0.54) 46%, rgba(16,43,42,0.14) 100%), linear-gradient(180deg, transparent 72%, rgba(10,29,28,0.68) 100%)",
          }}
        />

        {/* Plane 2 + Plane 3: Semantic HTML hierarchy & transparent Hawker 4000 */}
        <div className="jc-container relative z-10 grid min-h-[calc(100svh-114px)] grid-cols-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.18fr)] lg:gap-8 lg:py-14">
          <div data-plane="hero-copy" className="max-w-[560px] will-change-transform">
            <h1 className="jc-display-hero text-[var(--jc-ivory)]">
              Private charter for your itinerary.
            </h1>

            <p className="mt-6 max-w-[46ch] text-[18px] leading-[1.6] text-[var(--jc-ivory-soft)]">
              Private jets, group charters, and helicopters arranged around your schedule, with Jayant as your first point of contact.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <a href="#inquire" className="jc-btn-gold">
                Request a callback
              </a>
              <a href="#inspect-aircraft" className="jc-btn-outline-light">
                Explore aircraft
              </a>
            </div>
          </div>

          <div
            data-plane="hero-jet"
            className="relative flex flex-col items-end will-change-transform"
          >
            <img
              src={heroJet.path}
              alt={heroJet.alt}
              width={heroJet.width}
              height={heroJet.height}
              fetchPriority="high"
              className="jc-aircraft-shadow w-full max-w-[780px] object-contain lg:w-[112%] lg:max-w-none"
            />
            <p className="mt-4 max-w-[44ch] text-right text-[13px] leading-snug text-[var(--jc-ivory-soft)]">
              {heroJet.caption}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          CHAPTER 2: THE APPROACH — Scroll-scrubbed flight glide into editorial clarity
      ===================================================================== */}
      <section
        data-chapter="approach"
        className="surface-ivory relative overflow-hidden border-b border-[var(--jc-line-light)] py-20 md:py-28"
      >
        <div className="jc-container">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16">
            <div>
              <h2 className="jc-display-section text-[var(--jc-ink)]">
                Built around the flight you actually need.
              </h2>
              <p className="mt-5 max-w-[50ch] text-[17px] leading-relaxed text-[var(--jc-muted)]">
                Whether you are an executive assistant coordinating a same-day board return, a luxury travel advisor sourcing a family jet, or a planner arranging wedding transfers, you start with one calm conversation instead of an instant-booking algorithm.
              </p>

              <dl className="mt-8 grid grid-cols-1 gap-6 border-t border-[var(--jc-line-light)] pt-7 sm:grid-cols-2">
                <div>
                  <dt className="text-[14px] font-semibold text-[var(--jc-ink)]">
                    Custom itineraries
                  </dt>
                  <dd className="mt-1.5 m-0 text-[14px] leading-relaxed text-[var(--jc-muted)]">
                    One-way, return, and multi-stop requests checked directly for airport, runway, and timing feasibility.
                  </dd>
                </div>
                <div>
                  <dt className="text-[14px] font-semibold text-[var(--jc-ink)]">
                    Active corridor focus
                  </dt>
                  <dd className="mt-1.5 m-0 text-[14px] leading-relaxed text-[var(--jc-muted)]">
                    Dubai, Delhi NCR, and Mumbai, with wedding and event movements across Rajasthan and Goa.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="relative rounded-[4px] border border-[var(--jc-line-light)] bg-[linear-gradient(180deg,var(--jc-stone)_0%,var(--jc-paper)_100%)] p-6 sm:p-10">
              <div data-plane="approach-jet" className="will-change-transform">
                <img
                  src={approachJet.path}
                  alt={approachJet.alt}
                  width={approachJet.width}
                  height={approachJet.height}
                  loading="lazy"
                  className="jc-aircraft-shadow-light w-full object-contain"
                />
              </div>
              <p className="mt-5 mb-0 text-[13px] text-[var(--jc-muted)]">
                Hawker 4000 exterior display study. Aircraft class is matched to your route, luggage, and party size during feasibility review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          CHAPTER 3: CHOOSE THE JOURNEY — Asymmetric editorial service rows
      ===================================================================== */}
      <section id="services" className="surface-ivory py-24 md:py-32">
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-6 pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <h2 className="jc-display-section text-[var(--jc-ink)]">
              Three ways to fly, one conversation.
            </h2>
            <p className="m-0 max-w-[52ch] text-[17px] leading-relaxed text-[var(--jc-muted)] lg:justify-self-end">
              Every service begins with feasibility checks rather than fixed templates. Select the path closest to your trip, or let Jayant advise on the call.
            </p>
          </div>

          <div className="divide-y divide-[var(--jc-line-light)] border-y border-[var(--jc-line-light)]">
            {/* Service 01: Private jets */}
            {privateJetsSvc && (
              <article className="grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 lg:py-20">
                <div className="rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-stone)] p-6 sm:p-10">
                  <img
                    src={falconHero.path}
                    alt={falconHero.alt}
                    width={falconHero.width}
                    height={falconHero.height}
                    loading="lazy"
                    className="jc-aircraft-shadow-light w-full object-contain"
                  />
                  <p className="mt-4 mb-0 text-[13px] text-[var(--jc-muted)]">
                    Dassault Falcon 2000 Classic illustrative exterior model.
                  </p>
                </div>

                <div>
                  <span className="font-serif text-[20px] text-[var(--jc-muted)] tabular-nums">
                    01
                  </span>
                  <h3 className="mt-2 font-serif text-[34px] leading-tight text-[var(--jc-ink)]">
                    {privateJetsSvc.title}
                  </h3>
                  <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-[var(--jc-muted)]">
                    {privateJetsSvc.summary}
                  </p>
                  <ul className="mt-6 space-y-2.5 border-t border-[var(--jc-line-light)] pt-5 text-[15px] text-[var(--jc-ink)]">
                    <li>One-way, same-day return, and multi-stop itineraries</li>
                    <li>Aircraft class matched to party size, luggage, and runways</li>
                    <li>Operating range and feasibility verified before quoting</li>
                  </ul>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <a
                      href="#inquire"
                      onClick={() => prefillService("private-jet")}
                      className="jc-btn-teal"
                    >
                      {privateJetsSvc.ctaLabel}
                    </a>
                    <Link
                      href={`/services/${privateJetsSvc.slug}`}
                      className="inline-flex min-h-12 items-center text-[15px] font-medium text-[var(--jc-teal)] underline underline-offset-4 hover:text-[var(--jc-ink)]"
                    >
                      Private jets guide
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* Service 02: Group charter (reversed editorial composition) */}
            {groupSvc && (
              <article className="grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-16 lg:py-20">
                <div className="order-2 lg:order-1">
                  <span className="font-serif text-[20px] text-[var(--jc-muted)] tabular-nums">
                    02
                  </span>
                  <h3 className="mt-2 font-serif text-[34px] leading-tight text-[var(--jc-ink)]">
                    {groupSvc.title}
                  </h3>
                  <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-[var(--jc-muted)]">
                    {groupSvc.summary}
                  </p>
                  <ul className="mt-6 space-y-2.5 border-t border-[var(--jc-line-light)] pt-5 text-[15px] text-[var(--jc-ink)]">
                    <li>Planning for 22 passengers on one aircraft, or larger groups</li>
                    <li>Corporate offsites, leadership delegations, and wedding parties</li>
                    <li>Coordinated terminal timing and group baggage checks</li>
                  </ul>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <a
                      href="#inquire"
                      onClick={() => prefillService("group-charter")}
                      className="jc-btn-teal"
                    >
                      {groupSvc.ctaLabel}
                    </a>
                    <Link
                      href={`/services/${groupSvc.slug}`}
                      className="inline-flex min-h-12 items-center text-[15px] font-medium text-[var(--jc-teal)] underline underline-offset-4 hover:text-[var(--jc-ink)]"
                    >
                      Group charter guide
                    </Link>
                  </div>
                </div>

                <figure className="order-1 m-0 overflow-hidden rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-teal-deep)] lg:order-2">
                  <img
                    src={groupImg.path}
                    alt={groupImg.alt}
                    width={groupImg.width}
                    height={groupImg.height}
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <figcaption className="bg-[var(--jc-stone)] px-5 py-3 text-[13px] text-[var(--jc-muted)]">
                    {groupImg.caption}
                  </figcaption>
                </figure>
              </article>
            )}

            {/* Service 03: Helicopters */}
            {heliSvc && (
              <article className="grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-16 lg:py-20">
                <figure className="m-0 overflow-hidden rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-teal-deep)]">
                  <img
                    src={heliImg.path}
                    alt={heliImg.alt}
                    width={heliImg.width}
                    height={heliImg.height}
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <figcaption className="bg-[var(--jc-stone)] px-5 py-3 text-[13px] text-[var(--jc-muted)]">
                    {heliImg.caption}
                  </figcaption>
                </figure>

                <div>
                  <span className="font-serif text-[20px] text-[var(--jc-muted)] tabular-nums">
                    03
                  </span>
                  <h3 className="mt-2 font-serif text-[34px] leading-tight text-[var(--jc-ink)]">
                    {heliSvc.title}
                  </h3>
                  <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-[var(--jc-muted)]">
                    {heliSvc.summary}
                  </p>
                  <ul className="mt-6 space-y-2.5 border-t border-[var(--jc-line-light)] pt-5 text-[15px] text-[var(--jc-ink)]">
                    <li>Transfers for one or two guests, or larger multi-shuttle parties</li>
                    <li>Optional single-engine or twin-engine preference</li>
                    <li>Venue permissions and daytime landing clearance checked first</li>
                  </ul>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <a
                      href="#inquire"
                      onClick={() => prefillService("helicopter")}
                      className="jc-btn-teal"
                    >
                      {heliSvc.ctaLabel}
                    </a>
                    <Link
                      href={`/services/${heliSvc.slug}`}
                      className="inline-flex min-h-12 items-center text-[15px] font-medium text-[var(--jc-teal)] underline underline-offset-4 hover:text-[var(--jc-ink)]"
                    >
                      Helicopters guide
                    </Link>
                  </div>
                </div>
              </article>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          CHAPTER 4: INSPECT THE AIRCRAFT (Engineered Peak — Digital Jets 3D Hangar)
      ===================================================================== */}
      <section
        id="inspect-aircraft"
        data-chapter="hangar"
        data-surface="dark"
        className="surface-dark py-24 md:py-32"
      >
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-6 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <div>
              <h2 className="jc-display-section text-[var(--jc-ivory)]">
                Explore aircraft examples in 3D.
              </h2>
            </div>
            <div className="lg:justify-self-end">
              <p className="m-0 max-w-[50ch] text-[17px] leading-relaxed text-[var(--jc-ivory-soft)]">
                Inspect two photo-referenced exterior models up close: the Hawker 4000 and the original Dassault Falcon 2000 Classic. Switch configurations, examine angles, and attach a preference to your inquiry.
              </p>
            </div>
          </div>

          <AircraftStudioViewer
            aircraftList={aircraftList}
            mediaById={mediaById}
            initialAircraftId={aircraftList[0]?.id}
            enableLive3D={settings.featureFlags.enableLive3D}
            mode="hangar"
            onSelectAircraftPreference={prefillAircraft}
          />
        </div>
      </section>

      {/* =====================================================================
          CHAPTER 5: DETAIL & ATMOSPHERE — Digital Jets Macro Craftsmanship
      ===================================================================== */}
      <section
        data-chapter="detail"
        className="surface-stone border-b border-[var(--jc-line-light)] py-24 md:py-32"
      >
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-6 pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <h2 className="jc-display-section text-[var(--jc-ink)]">
              Detail examined before you fly.
            </h2>
            <p className="m-0 max-w-[50ch] text-[17px] leading-relaxed text-[var(--jc-muted)] lg:justify-self-end">
              Studio macro views of exterior nacelles, forward airstair hardware, and undercarriage assemblies from our reference kits.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <figure
              data-plane="macro-lead"
              className="m-0 flex flex-col overflow-hidden rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)] will-change-transform"
            >
              <div className="flex flex-1 items-center justify-center bg-[var(--jc-ivory)] p-6 sm:p-10">
                <img
                  src={engineDetail.path}
                  alt={engineDetail.alt}
                  width={engineDetail.width}
                  height={engineDetail.height}
                  loading="lazy"
                  className="max-h-[420px] w-full object-contain"
                />
              </div>
              <figcaption className="border-t border-[var(--jc-line-light)] px-6 py-4 text-[14px] text-[var(--jc-muted)]">
                <strong className="font-medium text-[var(--jc-ink)]">
                  Hawker 4000.
                </strong>{" "}
                {engineDetail.caption}
              </figcaption>
            </figure>

            <div className="grid grid-cols-1 gap-6">
              <figure className="m-0 overflow-hidden rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)]">
                <div className="flex items-center justify-center bg-[var(--jc-ivory)] p-6">
                  <img
                    src={entryDetail.path}
                    alt={entryDetail.alt}
                    width={entryDetail.width}
                    height={entryDetail.height}
                    loading="lazy"
                    className="max-h-[210px] w-full object-contain"
                  />
                </div>
                <figcaption className="border-t border-[var(--jc-line-light)] px-5 py-3.5 text-[14px] text-[var(--jc-muted)]">
                  <strong className="font-medium text-[var(--jc-ink)]">
                    Boarding configuration.
                  </strong>{" "}
                  {entryDetail.caption}
                </figcaption>
              </figure>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <figure className="m-0 overflow-hidden rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)]">
                  <div className="flex items-center justify-center bg-[var(--jc-ivory)] p-5">
                    <img
                      src={gearDetail.path}
                      alt={gearDetail.alt}
                      width={gearDetail.width}
                      height={gearDetail.height}
                      loading="lazy"
                      className="max-h-[160px] w-full object-contain"
                    />
                  </div>
                  <figcaption className="border-t border-[var(--jc-line-light)] px-4 py-3 text-[13px] text-[var(--jc-muted)]">
                    {gearDetail.caption}
                  </figcaption>
                </figure>

                <figure className="m-0 overflow-hidden rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)]">
                  <div className="flex items-center justify-center bg-[var(--jc-ivory)] p-5">
                    <img
                      src={falconEngine.path}
                      alt={falconEngine.alt}
                      width={falconEngine.width}
                      height={falconEngine.height}
                      loading="lazy"
                      className="max-h-[160px] w-full object-contain"
                    />
                  </div>
                  <figcaption className="border-t border-[var(--jc-line-light)] px-4 py-3 text-[13px] text-[var(--jc-muted)]">
                    {falconEngine.caption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          CHAPTER 6: TRUST, PROCESS & EXAMPLE SCENARIOS
      ===================================================================== */}
      <section className="surface-ivory py-24 md:py-32">
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-6 pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <h2 className="jc-display-section text-[var(--jc-ink)]">
              From inquiry to a confirmed flight.
            </h2>
            <p className="m-0 max-w-[50ch] text-[17px] leading-relaxed text-[var(--jc-muted)] lg:justify-self-end">
              No synthetic instant-booking button pretending to hold live aircraft. A real person checks your trip before you commit.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 border-t border-[var(--jc-line-light)] pt-12 md:grid-cols-3 md:gap-0">
            {PROCESS_STEPS.map((step, index) => (
              <div
                key={step.num}
                className={
                  index > 0
                    ? "md:border-l md:border-[var(--jc-line-light)] md:pl-8 lg:pl-10"
                    : "md:pr-8 lg:pr-10"
                }
              >
                <span className="font-serif text-[46px] leading-none text-[var(--jc-gold-muted)] tabular-nums">
                  {step.num}
                </span>
                <h3 className="mt-5 jc-display-title text-[var(--jc-ink)]">
                  {step.title}
                </h3>
                <p className="mt-3 m-0 text-[15px] leading-relaxed text-[var(--jc-muted)]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-20 grid grid-cols-1 gap-6 border-t border-[var(--jc-line-light)] pt-14 md:grid-cols-3">
            {TRUST_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)] p-7"
              >
                <h3 className="font-serif text-[22px] text-[var(--jc-ink)]">
                  {pillar.title}
                </h3>
                <p className="mt-2.5 m-0 text-[15px] leading-relaxed text-[var(--jc-muted)]">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditional Case Studies & Testimonials (hidden while empty per AC17) */}
      <ConditionalProofSection
        caseStudies={caseStudies}
        testimonials={testimonials}
      />

      {/* Example Trip Scenarios (explicitly distinct from completed case studies) */}
      <section data-surface="dark" className="surface-dark py-24 md:py-28">
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-6 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <h2 className="jc-display-section text-[var(--jc-ivory)]">
              Example trip scenarios.
            </h2>
            <p className="m-0 max-w-[50ch] text-[16px] leading-relaxed text-[var(--jc-ivory-soft)] lg:justify-self-end">
              Illustrative itinerary briefs showing the kind of detail to share with Jayant. These are planning examples, not completed client flights.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[4px] border border-[var(--jc-line-dark)] bg-[var(--jc-line-dark)] lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <article
                key={scenario.id}
                className="flex flex-col justify-between bg-[var(--jc-teal)] p-8"
              >
                <div>
                  <span className="inline-block rounded-[2px] border border-[var(--jc-gold)] px-2.5 py-1 text-[12px] text-[var(--jc-gold)]">
                    {scenario.badgeLabel}
                  </span>
                  <p className="mt-5 m-0 font-serif text-[20px] text-[var(--jc-ivory)]">
                    {scenario.routeLabel}
                  </p>
                  <h3 className="mt-2 font-serif text-[26px] leading-snug text-[var(--jc-ivory)]">
                    {scenario.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--jc-ivory-soft)]">
                    {scenario.summary}
                  </p>
                </div>

                <div className="mt-6 border-t border-[var(--jc-line-dark)] pt-4">
                  <p className="m-0 text-[13px] leading-relaxed text-[var(--jc-ivory-muted)]">
                    {scenario.planningNotes}
                  </p>
                  <a
                    href="#inquire"
                    onClick={() => prefillService(scenario.inquiryServiceKey)}
                    className="mt-4 inline-flex min-h-10 items-center text-[14px] font-medium text-[var(--jc-gold)] underline underline-offset-4 hover:text-[var(--jc-gold-hover)]"
                  >
                    Use this service type
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          CHAPTER 7: FAQ & TELL US ABOUT THE TRIP (Calm Zero-Motion Task Surface)
      ===================================================================== */}
      <section className="surface-ivory border-b border-[var(--jc-line-light)] py-24 md:py-28">
        <div className="jc-container">
          <FaqBlock items={faqs} />
        </div>
      </section>

      <section id="inquire" className="surface-stone py-24 md:py-32">
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.25fr)] lg:gap-16">
            <div>
              <h2 className="jc-display-section text-[var(--jc-ink)]">
                Tell us about your trip.
              </h2>
              <p className="mt-4 max-w-[44ch] text-[17px] leading-relaxed text-[var(--jc-muted)]">
                Only three details are required to start: your name, a reachable phone number, and permission for Jayant to call you. Everything else is optional and can be refined together on the phone.
              </p>

              <ol className="mt-8 list-decimal space-y-4 border-t border-[var(--jc-line-light)] pt-7 pl-5 text-[15px] leading-relaxed text-[var(--jc-muted)]">
                <li>Your request is recorded with a unique reference ID.</li>
                <li>Jayant contacts you directly to understand the itinerary and confirm permission for onward sourcing.</li>
                <li>Suitable aircraft options and a written quote follow through the operating party.</li>
              </ol>

              <div className="mt-8 rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)] p-5 text-[14px] text-[var(--jc-muted)]">
                Prefer a dedicated full-screen form?{" "}
                <Link
                  href="/inquire"
                  className="font-medium text-[var(--jc-teal)] underline underline-offset-4"
                >
                  Open the full inquiry page
                </Link>
                .
              </div>
            </div>

            <ProgressiveInquiryForm
              settings={settings}
              aircraftOptions={aircraftList}
              defaultService={selectedService}
              defaultAircraftId={selectedAircraftPref}
              entryPage="/"
            />
          </div>
        </div>
      </section>

      {/* =====================================================================
          CHAPTER 8: CLOSING HORIZON COMPOSITION (Resolves cleanly into footer)
      ===================================================================== */}
      <section
        data-surface="dark"
        className="relative overflow-hidden bg-[var(--jc-teal)] py-20 text-[var(--jc-ivory)] md:py-24"
      >
        <div className="jc-container grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <h2 className="jc-display-section text-[var(--jc-ivory)]">
              Ready when your dates lock.
            </h2>
            <p className="mt-4 max-w-[44ch] text-[17px] leading-relaxed text-[var(--jc-ivory-soft)]">
              Start an inquiry whenever a trip is on your desk, or inspect our aircraft examples in full detail.
            </p>
            <div className="mt-7 flex flex-wrap gap-3.5">
              <Link href="/inquire" className="jc-btn-gold">
                Request a callback
              </Link>
              <Link href="/aircraft" className="jc-btn-outline-light">
                Explore aircraft
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <img
              src={falconHero.path}
              alt={falconHero.alt}
              width={falconHero.width}
              height={falconHero.height}
              loading="lazy"
              className="jc-aircraft-shadow w-full max-w-[560px] object-contain opacity-95"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
