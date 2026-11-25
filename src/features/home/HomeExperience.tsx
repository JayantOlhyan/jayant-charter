"use client";

import { useState } from "react";
import Link from "next/link";
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
import { CorridorsMomentum } from "@/features/home/CorridorsMomentum";
import { ProgressiveInquiryForm } from "@/features/inquiry/ProgressiveInquiryForm";
import { FaqBlock } from "@/components/blocks/FaqBlock";
import { ConditionalProofSection } from "@/components/blocks/ConditionalProofSection";

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

  const macroPlates = [
    {
      label: "Hawker 4000 rear nacelle",
      media: engineDetail,
    },
    {
      label: "Forward airstair & vestibule",
      media: entryDetail,
    },
    {
      label: "Twin-wheel undercarriage",
      media: gearDetail,
    },
    {
      label: "Falcon 2000 Classic CFE738",
      media: falconEngine,
    },
  ];

  return (
    <div>
      {/* =====================================================================
          ACTS I - III: CONTINUOUS 3-BEAT 3D CINEMA
          (Full-Bleed Arrival -> Cloud Profile -> Warm Stone Overhead Planform)
      ===================================================================== */}
      <ArrivalApproachStage
        scene={arrivalScene}
        aircraft={arrivalAircraft}
        skyPlate={skyPlate}
        heroPoster={heroJet}
        approachPoster={approachJet}
        enableLive3D={settings.featureFlags.enableLive3D}
      />

      {/* =====================================================================
          CHAPTER 3: CHOOSE THE JOURNEY — Expansive Architectural Spreads
      ===================================================================== */}
      <section id="services" className="surface-ivory py-24 md:py-32">
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-6 pb-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
            <h2 className="jc-display-section m-0 text-[var(--jc-ink)]">
              Three ways to fly, one conversation.
            </h2>
            <p className="m-0 max-w-[48ch] text-[17px] leading-relaxed text-[var(--jc-muted)] lg:justify-self-end">
              Every service begins with feasibility checks rather than fixed templates. Select the path closest to your trip, or let Jayant advise on the call.
            </p>
          </div>

          <div className="divide-y divide-[var(--jc-line-light)] border-y border-[var(--jc-line-light)]">
            {/* 01 Private jets */}
            {privateJetsSvc && (
              <article className="grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:py-24">
                <div className="bg-[var(--jc-stone)] px-6 py-10 sm:px-12 sm:py-14">
                  <img
                    src={falconHero.path}
                    alt={falconHero.alt}
                    width={falconHero.width}
                    height={falconHero.height}
                    loading="lazy"
                    className="jc-aircraft-shadow-light w-full object-contain"
                  />
                  <p className="mt-6 mb-0 text-[13px] text-[var(--jc-muted)]">
                    Dassault Falcon 2000 Classic illustrative exterior model.
                  </p>
                </div>

                <div>
                  <span className="font-serif text-[20px] text-[var(--jc-gold-muted)] tabular-nums">
                    01
                  </span>
                  <h3 className="mt-2 font-serif text-[36px] leading-[1.08] text-[var(--jc-ink)] sm:text-[44px]">
                    {privateJetsSvc.title}
                  </h3>
                  <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-[var(--jc-muted)]">
                    {privateJetsSvc.summary}
                  </p>
                  <ul className="mt-6 space-y-2.5 border-t border-[var(--jc-line-light)] pt-5 text-[15px] text-[var(--jc-ink)]">
                    <li>One-way, same-day return, and multi-stop itineraries</li>
                    <li>Aircraft class matched to party size, luggage, and runways</li>
                    <li>Operating range and feasibility verified before quoting</li>
                  </ul>
                  <div className="mt-8 flex flex-wrap items-center gap-6">
                    <a
                      href="#inquire"
                      onClick={() => prefillService("private-jet")}
                      className="jc-btn-teal"
                    >
                      {privateJetsSvc.ctaLabel}
                    </a>
                    <Link
                      href={`/services/${privateJetsSvc.slug}`}
                      className="inline-flex min-h-12 items-center text-[15px] font-medium text-[var(--jc-teal)] underline decoration-[var(--jc-gold-muted)] underline-offset-8 hover:text-[var(--jc-ink)]"
                    >
                      Private jets guide
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* 02 Group charter */}
            {groupSvc && (
              <article className="grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16 lg:py-24">
                <div className="order-2 lg:order-1">
                  <span className="font-serif text-[20px] text-[var(--jc-gold-muted)] tabular-nums">
                    02
                  </span>
                  <h3 className="mt-2 font-serif text-[36px] leading-[1.08] text-[var(--jc-ink)] sm:text-[44px]">
                    {groupSvc.title}
                  </h3>
                  <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-[var(--jc-muted)]">
                    {groupSvc.summary}
                  </p>
                  <ul className="mt-6 space-y-2.5 border-t border-[var(--jc-line-light)] pt-5 text-[15px] text-[var(--jc-ink)]">
                    <li>Planning for 22 passengers on one aircraft, or larger groups</li>
                    <li>Corporate offsites, leadership delegations, and wedding parties</li>
                    <li>Coordinated terminal timing and group baggage checks</li>
                  </ul>
                  <div className="mt-8 flex flex-wrap items-center gap-6">
                    <a
                      href="#inquire"
                      onClick={() => prefillService("group-charter")}
                      className="jc-btn-teal"
                    >
                      {groupSvc.ctaLabel}
                    </a>
                    <Link
                      href={`/services/${groupSvc.slug}`}
                      className="inline-flex min-h-12 items-center text-[15px] font-medium text-[var(--jc-teal)] underline decoration-[var(--jc-gold-muted)] underline-offset-8 hover:text-[var(--jc-ink)]"
                    >
                      Group charter guide
                    </Link>
                  </div>
                </div>

                <figure className="order-1 m-0 overflow-hidden bg-[var(--jc-teal-deep)] lg:order-2">
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
              <article className="grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:py-24">
                <figure className="m-0 overflow-hidden bg-[var(--jc-teal-deep)]">
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
                  <span className="font-serif text-[20px] text-[var(--jc-gold-muted)] tabular-nums">
                    03
                  </span>
                  <h3 className="mt-2 font-serif text-[36px] leading-[1.08] text-[var(--jc-ink)] sm:text-[44px]">
                    {heliSvc.title}
                  </h3>
                  <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-[var(--jc-muted)]">
                    {heliSvc.summary}
                  </p>
                  <ul className="mt-6 space-y-2.5 border-t border-[var(--jc-line-light)] pt-5 text-[15px] text-[var(--jc-ink)]">
                    <li>Transfers for one or two guests, or larger multi-shuttle parties</li>
                    <li>Optional single-engine or twin-engine preference</li>
                    <li>Venue permissions and daytime landing clearance checked first</li>
                  </ul>
                  <div className="mt-8 flex flex-wrap items-center gap-6">
                    <a
                      href="#inquire"
                      onClick={() => prefillService("helicopter")}
                      className="jc-btn-teal"
                    >
                      {heliSvc.ctaLabel}
                    </a>
                    <Link
                      href={`/services/${heliSvc.slug}`}
                      className="inline-flex min-h-12 items-center text-[15px] font-medium text-[var(--jc-teal)] underline decoration-[var(--jc-gold-muted)] underline-offset-8 hover:text-[var(--jc-ink)]"
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
          CHAPTER 4: FULL-BLEED DIGITAL JETS 3D SHOWROOM
      ===================================================================== */}
      <section
        id="inspect-aircraft"
        data-chapter="hangar"
        data-surface="dark"
        className="bg-[var(--jc-teal-deep)] text-[var(--jc-ivory)]"
      >
        <div className="jc-container py-16 md:py-20">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <h2 className="jc-display-section m-0 text-[var(--jc-ivory)]">
              Inspect aircraft in real-time 3D.
            </h2>
            <p className="m-0 max-w-[50ch] text-[16px] leading-relaxed text-[var(--jc-ivory-soft)] lg:justify-self-end">
              Orbit the Hawker 4000 and original Dassault Falcon 2000 Classic across full-width studio lighting atmospheres. Compare configurations and attach a preference directly to your inquiry.
            </p>
          </div>
        </div>

        {/* Full viewport width borderless 3D showroom */}
        <AircraftStudioViewer
          aircraftList={aircraftList}
          mediaById={mediaById}
          lightingModes={hangarScene.lightingModes}
          initialAircraftId={aircraftList[0]?.id}
          enableLive3D={settings.featureFlags.enableLive3D}
          mode="hangar"
          onSelectAircraftPreference={prefillAircraft}
        />
      </section>

      {/* =====================================================================
          CHAPTER 5: DIGITAL JETS EDGE-TO-EDGE COMPARISON + FLUSH MACRO STRIP
      ===================================================================== */}
      <section data-chapter="detail" className="surface-ivory pt-20 md:pt-28">
        <div className="jc-container pb-12">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <h2 className="jc-display-section m-0 text-[var(--jc-ink)]">
              Detail examined before you fly.
            </h2>
            <p className="m-0 max-w-[50ch] text-[17px] leading-relaxed text-[var(--jc-muted)] lg:justify-self-end">
              Compare parked and boarding ramp stances pixel-for-pixel, then inspect high-resolution exterior studies of engine nacelles, entry hardware, and landing gear.
            </p>
          </div>
        </div>

        {/* Edge-to-edge full-width Hawker 4000 Parked <-> Boarding wipe */}
        <ConfigurationCompareSlider
          closedMedia={hawkerParked}
          openMedia={hawkerBoarding}
        />

        {/* Digital Jets-inspired flush edge-to-edge 4-panel macro CGI strip */}
        <div className="grid grid-cols-1 gap-px border-b border-[var(--jc-line-light)] bg-[var(--jc-line-light)] sm:grid-cols-2 lg:grid-cols-4">
          {macroPlates.map((plate) => (
            <figure
              key={plate.label}
              className="m-0 flex flex-col justify-between bg-[var(--jc-stone)]"
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-[var(--jc-paper)] p-6">
                <img
                  src={plate.media.path}
                  alt={plate.media.alt}
                  width={plate.media.width}
                  height={plate.media.height}
                  loading="lazy"
                  className="max-h-full w-full object-contain"
                />
              </div>
              <figcaption className="border-t border-[var(--jc-line-light)] bg-[var(--jc-ivory)] px-5 py-4">
                <span className="block text-[14px] font-medium text-[var(--jc-ink)]">
                  {plate.label}
                </span>
                <span className="mt-1 block text-[13px] leading-snug text-[var(--jc-muted)]">
                  {plate.media.caption}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* =====================================================================
          CHAPTER 6: TRUST & EXPERIENCE — Jesko Flush Synced Editorial Split
      ===================================================================== */}
      <section className="surface-ivory py-24 md:py-32">
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-6 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <h2 className="jc-display-section m-0 text-[var(--jc-ink)]">
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

      {/* Jesko-inspired Dark Focus Corridors Momentum Band */}
      <CorridorsMomentum />

      {/* Example Trip Scenarios — Crisp Hairline Architectural Band */}
      <section
        data-surface="dark"
        className="border-t border-[var(--jc-line-dark)] bg-[var(--jc-teal)] py-20 text-[var(--jc-ivory)] md:py-24"
      >
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-6 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <h2 className="jc-display-section m-0 text-[var(--jc-ivory)]">
              Example trip briefs.
            </h2>
            <p className="m-0 max-w-[50ch] text-[16px] leading-relaxed text-[var(--jc-ivory-soft)] lg:justify-self-end">
              Illustrative itinerary patterns showing the detail helpful to share on a call. Planning examples only, not completed client flights.
            </p>
          </div>

          <div className="grid grid-cols-1 divide-y divide-[var(--jc-line-dark)] border-y border-[var(--jc-line-dark)] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {scenarios.map((scenario) => (
              <article
                key={scenario.id}
                className="flex flex-col justify-between py-8 lg:px-8 lg:first:pl-0 lg:last:pr-0"
              >
                <div>
                  <span className="text-[12px] font-medium text-[var(--jc-gold)]">
                    {scenario.badgeLabel}
                  </span>
                  <p className="mt-3 m-0 font-serif text-[20px] text-[var(--jc-ivory)]">
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
                    className="mt-4 inline-flex min-h-10 items-center text-[14px] font-medium text-[var(--jc-gold)] underline underline-offset-8 hover:text-[var(--jc-gold-hover)]"
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
          CHAPTER 7: FAQ & CALM INQUIRY STUDIO
      ===================================================================== */}
      <section className="surface-ivory border-b border-[var(--jc-line-light)] py-20 md:py-24">
        <div className="jc-container">
          <FaqBlock items={faqs} />
        </div>
      </section>

      <section id="inquire" className="surface-stone py-24 md:py-28">
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.25fr)] lg:gap-16">
            <div>
              <h2 className="jc-display-section m-0 text-[var(--jc-ink)]">
                Tell us about your trip.
              </h2>
              <p className="mt-4 max-w-[44ch] text-[17px] leading-relaxed text-[var(--jc-muted)]">
                Only three details are required to start: your name, a reachable phone number, and permission for Jayant to call you. Everything else can be refined together on the phone.
              </p>

              {settings.featureFlags.showPreviewBanner && (
                <p
                  role="status"
                  className="mt-6 rounded-[3px] border border-[var(--jc-line-strong)] bg-[var(--jc-paper)] px-4 py-3 text-[13px] leading-relaxed text-[var(--jc-ink)]"
                >
                  Preview environment: inquiries are recorded locally while direct email and WhatsApp channels remain paused.
                </p>
              )}

              <ol className="mt-8 list-decimal space-y-4 border-t border-[var(--jc-line-light)] pt-7 pl-5 text-[15px] leading-relaxed text-[var(--jc-muted)]">
                <li>Your request is recorded with a unique reference ID.</li>
                <li>Jayant contacts you directly to understand the itinerary and confirm permission for onward sourcing.</li>
                <li>Suitable aircraft options and a written quote follow through the operating party.</li>
              </ol>

              <div className="mt-8 text-[14px] text-[var(--jc-muted)]">
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
          CHAPTER 8: MONUMENTAL CLOSING HORIZON (Jesko step_28 Spirit)
      ===================================================================== */}
      <section
        data-surface="dark"
        className="relative overflow-hidden bg-[var(--jc-teal-deep)] py-24 text-[var(--jc-ivory)] md:py-32"
      >
        {/* Monumental whisper background brand silhouette */}
        <p
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center font-serif text-[clamp(4.5rem,14vw,14rem)] leading-none tracking-[-0.04em] text-[var(--jc-ghost-wordmark)] whitespace-nowrap"
        >
          Jayant Charter
        </p>

        <div className="jc-container relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
          <div>
            <h2 className="jc-display-section m-0 text-[var(--jc-ivory)]">
              Ready when your dates lock.
            </h2>
            <p className="mt-4 max-w-[44ch] text-[17px] leading-relaxed text-[var(--jc-ivory-soft)]">
              Start an inquiry whenever a trip is on your desk, or inspect our aircraft examples in full detail.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
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
              className="jc-aircraft-shadow w-full max-w-[640px] object-contain"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
