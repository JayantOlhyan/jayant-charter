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
  SceneRecord,
  ServiceRecord,
  SiteSettings,
  TestimonialRecord,
} from "@/content/schemas";
import { ArrivalApproachStage } from "@/features/scroll/ArrivalApproachStage";
import { AircraftStudioViewer } from "@/features/aircraft/AircraftStudioViewer";
import { ConfigurationCompareSlider } from "@/features/aircraft/ConfigurationCompareSlider";
import { TrustEditorialSplit } from "@/features/home/TrustEditorialSplit";
import { ProgressiveInquiryForm } from "@/features/inquiry/ProgressiveInquiryForm";
import { FaqBlock } from "@/components/blocks/FaqBlock";
import { ConditionalProofSection } from "@/components/blocks/ConditionalProofSection";

gsap.registerPlugin(ScrollTrigger);

interface HomeExperienceProps {
  settings: SiteSettings;
  services: ServiceRecord[];
  aircraftList: AircraftRecord[];
  arrivalScene: SceneRecord;
  hangarScene: SceneRecord;
  scenarios: ExampleScenario[];
  faqs: FaqItem[];
  caseStudies: CaseStudyRecord[];
  testimonials: TestimonialRecord[];
  mediaById: Record<string, MediaAsset>;
}

export function HomeExperience({
  settings,
  services,
  aircraftList,
  arrivalScene,
  hangarScene,
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
  const hawkerParked = mediaById["hawker-parked"];
  const hawkerBoarding = mediaById["hawker-boarding"];
  const falconHero = mediaById["falcon-hero"];
  const groupImg = mediaById["group-charter-editorial"];
  const heliImg = mediaById["helicopter-editorial"];
  const engineDetail = mediaById["hawker-engine-detail"];
  const entryDetail = mediaById["hawker-entry-detail"];
  const gearDetail = mediaById["hawker-gear-detail"];
  const falconEngine = mediaById["falcon-engine-detail"];

  const arrivalAircraft =
    aircraftList.find((a) => a.id === arrivalScene.aircraftId) || aircraftList[0];

  // Subtle composited depth parallax for macro plate below fold (desktop non-reduced-motion only)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (prefersReduced || !isDesktop) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-plane='macro-lead']",
        { y: 26 },
        {
          y: -22,
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
          CHAPTERS 1 & 2: CONTINUOUS ARRIVAL -> APPROACH 3D AIRCRAFT STAGE
      ===================================================================== */}
      <ArrivalApproachStage
        scene={arrivalScene}
        aircraft={arrivalAircraft}
        skyPlate={skyPlate}
        heroPoster={heroJet}
        approachPoster={approachJet}
        enableLive3D={settings.featureFlags.enableLive3D}
      />

      {/* Multi-stop eased atmospheric tonal bridge (Deep Teal horizon -> Warm Ivory) */}
      <div aria-hidden="true" className="jc-tonal-bridge w-full" />

      {/* =====================================================================
          CHAPTER 3: CHOOSE THE JOURNEY — Distinct editorial compositions
      ===================================================================== */}
      <section id="services" className="surface-ivory py-20 md:py-28">
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
            {/* 01 Private jets */}
            {privateJetsSvc && (
              <article className="grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.96fr)] lg:gap-16 lg:py-20">
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

            {/* 02 Group charter */}
            {groupSvc && (
              <article className="grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-20">
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

            {/* 03 Helicopters */}
            {heliSvc && (
              <article className="grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.96fr)] lg:gap-16 lg:py-20">
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
          CHAPTER 4: AIRCRAFT EXPLORATION (Engineered Peak — Digital Jets 3D Hangar)
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
                Orbit the Hawker 4000 and original Dassault Falcon 2000 Classic at generous scale. Switch exterior configurations, compare twilight and daylight studio lighting, and attach a preference directly to your callback request.
              </p>
            </div>
          </div>

          <AircraftStudioViewer
            aircraftList={aircraftList}
            mediaById={mediaById}
            lightingModes={hangarScene.lightingModes}
            initialAircraftId={aircraftList[0]?.id}
            enableLive3D={settings.featureFlags.enableLive3D}
            mode="hangar"
            onSelectAircraftPreference={prefillAircraft}
          />
        </div>
      </section>

      {/* =====================================================================
          CHAPTER 5: DETAIL & ATMOSPHERE — Comparison Wipe + Digital Jets Macro Plates
      ===================================================================== */}
      <section
        data-chapter="detail"
        className="surface-stone border-b border-[var(--jc-line-light)] py-20 md:py-24"
      >
        <div className="jc-container space-y-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <h2 className="jc-display-section text-[var(--jc-ink)]">
              Detail examined before you fly.
            </h2>
            <p className="m-0 max-w-[50ch] text-[17px] leading-relaxed text-[var(--jc-muted)] lg:justify-self-end">
              Compare ramp configurations side by side and inspect high-resolution exterior views of nacelles, airstair hardware, and undercarriage assemblies.
            </p>
          </div>

          {/* Digital Jets-inspired Interactive Before/After Configuration Wipe */}
          <ConfigurationCompareSlider
            closedMedia={hawkerParked}
            openMedia={hawkerBoarding}
          />

          {/* Full-width macro craftsmanship spread */}
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
          CHAPTER 6: TRUST & EXPERIENCE — Jesko-inspired synced 2-column split
      ===================================================================== */}
      <section className="surface-ivory py-20 md:py-24">
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <h2 className="jc-display-section text-[var(--jc-ink)]">
              A calmer way to arrange a charter.
            </h2>
            <p className="m-0 max-w-[50ch] text-[17px] leading-relaxed text-[var(--jc-muted)] lg:justify-self-end">
              Clear accountability from the first callback to licensed operator confirmation, with zero synthetic instant-booking claims.
            </p>
          </div>

          <TrustEditorialSplit mediaById={mediaById} />
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
          CHAPTER 7: FAQ & INQUIRY (Calm Zero-Motion Task Surface)
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
