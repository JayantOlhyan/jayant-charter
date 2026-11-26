"use client";

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
import { JeskoOpeningHero } from "@/features/scroll/JeskoOpeningHero";
import { JeskoCloudPhilosophy } from "@/features/scroll/JeskoCloudPhilosophy";
import { JeskoPlanformBlueprint } from "@/features/scroll/JeskoPlanformBlueprint";
import { TrustEditorialSplit } from "@/features/home/TrustEditorialSplit";
import { JeskoGlobalGlobe } from "@/features/home/JeskoGlobalGlobe";
import { FaqBlock } from "@/components/blocks/FaqBlock";
import { ConditionalProofSection } from "@/components/blocks/ConditionalProofSection";
import { useCallbackDrawer } from "@/components/layout/CallbackDrawerProvider";

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

/**
 * Pure Jesko Jets scroll rhythm rebuilt 100% originally for Jayant Charter,
 * seamlessly connected into our multi-page service guides, Digital Jets 3D /aircraft hub,
 * and slide-up Callback Drawer:
 * 1. Opening Cabin Window Shade Lift & Zoom-Through (JeskoOpeningHero)
 * 2. Cloud Philosophy & Character-Scrub Highlight (JeskoCloudPhilosophy)
 * 3. Overhead 3D Hawker 4000 Planform & X-Ray Blueprint Wipe (JeskoPlanformBlueprint)
 * 4. Three Charter Services — Architectural Warm Cream Spreads (linking to multi-page guides)
 * 5. A Calmer Way to Fly — Flush Synced Accordion + Live Dubai Clock Strip (TrustEditorialSplit)
 * 6. Compact FAQ
 * 7. Custom Routes Looping City Wheel & Live 3D Globe.gl Finale (JeskoGlobalGlobe)
 */
export function HomeExperience({
  settings,
  services,
  aircraftList,
  arrivalScene,
  faqs,
  caseStudies,
  testimonials,
  mediaById,
}: HomeExperienceProps) {
  const { openDrawer } = useCallbackDrawer();

  const skyDaylight = mediaById["jesko-sky-daylight"] || mediaById["hero-sky-plate"];
  const cloudsMarquee = mediaById["jesko-clouds-marquee"] || mediaById["hero-sky-plate"];
  const heroJet = mediaById["hawker-hero"];
  const blueprintMedia = mediaById["hawker-blueprint-planform"];
  const falconHero = mediaById["falcon-hero"];
  const groupImg = mediaById["group-charter-editorial"];
  const heliImg = mediaById["helicopter-editorial"];

  const arrivalAircraft =
    aircraftList.find((a) => a.id === arrivalScene.aircraftId) || aircraftList[0];

  const privateJetsSvc = services.find((s) => s.slug === "private-jets");
  const groupSvc = services.find((s) => s.slug === "group-charter");
  const heliSvc = services.find((s) => s.slug === "helicopters");

  return (
    <div>
      {/* =====================================================================
          ACT 1: OPENING CABIN WINDOW SHADE LIFT & ZOOM-THROUGH INTO SKY
      ===================================================================== */}
      <JeskoOpeningHero
        skyDaylight={skyDaylight}
        cloudsMarquee={cloudsMarquee}
        brandName={settings.brandName}
      />

      {/* =====================================================================
          ACT 2: CLOUD PHILOSOPHY & CHARACTER-BY-CHARACTER HIGHLIGHT
      ===================================================================== */}
      <JeskoCloudPhilosophy
        skyDaylight={skyDaylight}
        cloudsMarquee={cloudsMarquee}
      />

      {/* =====================================================================
          ACT 3: OVERHEAD LIVE 3D HAWKER 4000 PLANFORM & X-RAY BLUEPRINT WIPE
      ===================================================================== */}
      <JeskoPlanformBlueprint
        scene={arrivalScene}
        aircraft={arrivalAircraft}
        heroPoster={heroJet}
        blueprintMedia={blueprintMedia}
        enableLive3D={settings.featureFlags.enableLive3D}
      />

      {/* =====================================================================
          ACT 4: THREE WAYS TO FLY — Multi-Page Editorial Gateway (Warm Cream)
      ===================================================================== */}
      <section
        id="services"
        data-nav-theme="light"
        data-surface="light"
        className="surface-ivory border-t border-[var(--jc-line-light)] py-24 md:py-32"
      >
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-6 pb-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
            <div>
              <p className="m-0 text-[13px] font-medium text-[var(--jc-muted)]">
                Dedicated charter disciplines
              </p>
              <h2 className="jc-display-section mt-2 m-0 text-[var(--jc-ink)]">
                Three ways to fly, one conversation.
              </h2>
            </div>
            <p className="m-0 max-w-[46ch] text-[16px] leading-relaxed text-[var(--jc-muted)] lg:justify-self-end">
              Explore dedicated guides for each service or open our interactive 3D aircraft hub to compare the Hawker 4000 and Dassault Falcon 2000 Classic.
            </p>
          </div>

          <div className="divide-y divide-[var(--jc-line-light)] border-y border-[var(--jc-line-light)]">
            {/* 01 Private Jets */}
            {privateJetsSvc && (
              <article className="grid grid-cols-1 items-center gap-12 py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:py-20">
                <div className="bg-[var(--jc-stone)] px-6 py-10 sm:px-12 sm:py-14">
                  <img
                    src={falconHero.path}
                    alt={falconHero.alt}
                    width={falconHero.width}
                    height={falconHero.height}
                    loading="lazy"
                    className="jc-aircraft-shadow-light w-full object-contain"
                  />
                  <p className="mt-5 mb-0 text-[13px] text-[var(--jc-muted)]">
                    Dassault Falcon 2000 Classic illustrative exterior model.
                  </p>
                </div>

                <div>
                  <span className="text-[13px] font-medium text-[var(--jc-muted)] tabular-nums">
                    01
                  </span>
                  <h3 className="jc-display-section mt-2 m-0 text-[var(--jc-ink)]">
                    {privateJetsSvc.title}
                  </h3>
                  <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-[var(--jc-muted)]">
                    {privateJetsSvc.summary}
                  </p>
                  <div className="mt-7 flex flex-wrap items-center gap-5">
                    <button
                      type="button"
                      onClick={() => openDrawer({ service: "private-jet" })}
                      className="jc-btn-teal"
                    >
                      Request a callback
                    </button>
                    <Link
                      href={`/services/${privateJetsSvc.slug}`}
                      className="inline-flex min-h-12 items-center text-[14px] font-semibold text-[var(--jc-ink)] underline underline-offset-8 hover:opacity-75"
                    >
                      Private jets guide
                    </Link>
                    <Link
                      href="/aircraft"
                      className="inline-flex min-h-12 items-center text-[14px] font-medium text-[var(--jc-muted)] underline underline-offset-8 hover:text-[var(--jc-ink)]"
                    >
                      3D aircraft showroom
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* 02 Group Charter */}
            {groupSvc && (
              <article className="grid grid-cols-1 items-center gap-12 py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-20">
                <div className="order-2 lg:order-1">
                  <span className="text-[13px] font-medium text-[var(--jc-muted)] tabular-nums">
                    02
                  </span>
                  <h3 className="jc-display-section mt-2 m-0 text-[var(--jc-ink)]">
                    {groupSvc.title}
                  </h3>
                  <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-[var(--jc-muted)]">
                    {groupSvc.summary}
                  </p>
                  <ul className="mt-5 space-y-2 border-t border-[var(--jc-line-light)] pt-4 text-[14px] text-[var(--jc-ink)]">
                    <li>Planning for 22 passengers on one aircraft, or larger delegations</li>
                    <li>Corporate offsites, executive retreats, and destination wedding parties</li>
                  </ul>
                  <div className="mt-7 flex flex-wrap items-center gap-5">
                    <button
                      type="button"
                      onClick={() => openDrawer({ service: "group-charter" })}
                      className="jc-btn-teal"
                    >
                      Request a callback
                    </button>
                    <Link
                      href={`/services/${groupSvc.slug}`}
                      className="inline-flex min-h-12 items-center text-[14px] font-semibold text-[var(--jc-ink)] underline underline-offset-8 hover:opacity-75"
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
              <article className="grid grid-cols-1 items-center gap-12 py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:py-20">
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
                  <span className="text-[13px] font-medium text-[var(--jc-muted)] tabular-nums">
                    03
                  </span>
                  <h3 className="jc-display-section mt-2 m-0 text-[var(--jc-ink)]">
                    {heliSvc.title}
                  </h3>
                  <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-[var(--jc-muted)]">
                    {heliSvc.summary}
                  </p>
                  <ul className="mt-5 space-y-2 border-t border-[var(--jc-line-light)] pt-4 text-[14px] text-[var(--jc-ink)]">
                    <li>Private transfers for one or two guests, or coordinated event shuttles</li>
                    <li>Venue permissions, daytime landing rules, and twin-engine preferences verified first</li>
                  </ul>
                  <div className="mt-7 flex flex-wrap items-center gap-5">
                    <button
                      type="button"
                      onClick={() => openDrawer({ service: "helicopter" })}
                      className="jc-btn-teal"
                    >
                      Request a callback
                    </button>
                    <Link
                      href={`/services/${heliSvc.slug}`}
                      className="inline-flex min-h-12 items-center text-[14px] font-semibold text-[var(--jc-ink)] underline underline-offset-8 hover:opacity-75"
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
          ACT 5: A CALMER WAY TO FLY — Jesko Flush Synced Accordion + Clock Strip
      ===================================================================== */}
      <section
        id="benefits"
        data-nav-theme="light"
        data-surface="light"
        className="surface-ivory py-24 md:py-32"
      >
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-6 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <div>
              <p className="m-0 text-[13px] font-medium text-[var(--jc-muted)]">
                A calmer way to fly
              </p>
              <h2 className="jc-display-section mt-2 m-0 text-[var(--jc-ink)]">
                Clear accountability from first call to confirmation.
              </h2>
            </div>
            <div className="lg:justify-self-end">
              <Link
                href="/how-it-works"
                className="text-[14px] font-semibold text-[var(--jc-ink)] underline underline-offset-8 hover:opacity-75"
              >
                Read the full process guide
              </Link>
            </div>
          </div>

          <TrustEditorialSplit mediaById={mediaById} />
        </div>
      </section>

      {/* Conditional Approved Proof (hidden while empty per AC17) */}
      <ConditionalProofSection
        caseStudies={caseStudies}
        testimonials={testimonials}
      />

      {/* Compact Editorial FAQ */}
      <section
        data-nav-theme="light"
        data-surface="light"
        className="surface-ivory border-t border-[var(--jc-line-light)] py-20 md:py-24"
      >
        <div className="jc-container">
          <FaqBlock items={faqs} />
        </div>
      </section>

      {/* =====================================================================
          ACT 6: LOOPING CITY WHEEL + LIVE 3D GLOBE.GL FINALE
      ===================================================================== */}
      <JeskoGlobalGlobe />
    </div>
  );
}
