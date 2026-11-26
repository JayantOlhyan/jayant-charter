import type { Metadata } from "next";
import Link from "next/link";
import {
  getMediaAsset,
  getPublishedAircraft,
  getSceneById,
  getSiteSettings,
} from "@/content/repository";
import type { MediaAsset } from "@/content/schemas";
import { AircraftStudioViewer } from "@/features/aircraft/AircraftStudioViewer";
import { ConfigurationCompareSlider } from "@/features/aircraft/ConfigurationCompareSlider";

export const metadata: Metadata = {
  title: "Explore Aircraft Examples in 3D",
  description:
    "Explore interactive 3D exterior models of the Hawker 4000 and original Dassault Falcon 2000 Classic across studio lighting modes, compare ramp stances, and request a callback.",
  alternates: { canonical: "/aircraft" },
};

export default function AircraftIndexPage() {
  const settings = getSiteSettings();
  const aircraftList = getPublishedAircraft();
  const hangarScene = getSceneById("hangar-studio-explorer")!;

  const mediaIds = new Set<string>([
    "hawker-hero",
    "hawker-parked",
    "hawker-boarding",
    "hawker-engine-detail",
    "hawker-entry-detail",
    "hawker-gear-detail",
    "falcon-hero",
    "falcon-parked",
    "falcon-engine-detail",
  ]);
  for (const ac of aircraftList) {
    mediaIds.add(ac.posterId);
    for (const cfg of ac.configurations) mediaIds.add(cfg.posterId);
    for (const d of ac.detailMediaIds) mediaIds.add(d);
  }
  const mediaById: Record<string, MediaAsset> = {};
  for (const id of mediaIds) mediaById[id] = getMediaAsset(id);
  const hawkerParked = mediaById["hawker-parked"];
  const hawkerBoarding = mediaById["hawker-boarding"];
  const macroPlates = [
    { label: "Hawker 4000 rear nacelle", media: mediaById["hawker-engine-detail"] },
    { label: "Forward airstair & vestibule", media: mediaById["hawker-entry-detail"] },
    { label: "Twin-wheel undercarriage", media: mediaById["hawker-gear-detail"] },
    { label: "Falcon 2000 Classic CFE738", media: mediaById["falcon-engine-detail"] },
  ];

  return (
    <div>
      {/* Intro Header */}
      <section
        data-nav-theme="dark"
        data-surface="dark"
        className="jc-dark-espresso py-20 text-[var(--jc-ivory)] md:py-24"
      >
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
            <div>
              <p className="m-0 text-[13px] font-medium text-[var(--jc-ivory-muted)]">
                Interactive 3D showcase
              </p>
              <h1 className="jc-display-hero mt-2 m-0 text-[var(--jc-ivory)]">
                Aircraft examples in real-time 3D.
              </h1>
            </div>
            <p className="m-0 max-w-[48ch] text-[16px] leading-relaxed text-[var(--jc-ivory-soft)] lg:justify-self-end">
              Orbit the Hawker 4000 and Falcon 2000 Classic across studio lighting modes. Illustrative exterior studies only.
            </p>
          </div>
        </div>
      </section>

      {/* Full-Bleed Digital Jets 3D Showroom */}
      <section
        id="inspect-aircraft"
        data-chapter="hangar"
        data-nav-theme="dark"
        data-surface="dark"
        className="bg-[var(--jc-teal-deep)] text-[var(--jc-ivory)]"
      >
        <AircraftStudioViewer
          aircraftList={aircraftList}
          mediaById={mediaById}
          lightingModes={hangarScene.lightingModes}
          initialAircraftId={aircraftList[0]?.id}
          enableLive3D={settings.featureFlags.enableLive3D}
          mode="hangar"
        />
      </section>

      {/* Digital Jets Edge-to-Edge Parked <-> Boarding Ramp Comparison + Macro CGI Strip */}
      <section
        data-chapter="detail"
        data-nav-theme="light"
        data-surface="light"
        className="surface-ivory pt-20 md:pt-24"
      >
        <ConfigurationCompareSlider
          closedMedia={hawkerParked}
          openMedia={hawkerBoarding}
        />

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
                <span className="block text-[14px] font-semibold text-[var(--jc-ink)]">
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

      {/* Detailed Profile Cards & Planning Guidance */}
      <section
        data-nav-theme="light"
        data-surface="light"
        className="surface-ivory py-20 md:py-28"
      >
        <div className="jc-container">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {aircraftList.map((ac) => {
              const poster = getMediaAsset(ac.posterId);
              return (
                <article
                  key={ac.id}
                  className="flex flex-col overflow-hidden border border-[var(--jc-line-light)] bg-[var(--jc-paper)]"
                >
                  <Link
                    href={`/aircraft/${ac.slug}`}
                    className="jc-stage-daylight group relative flex min-h-[280px] items-center justify-center p-8 sm:min-h-[340px] sm:p-12"
                  >
                    <img
                      src={poster.path}
                      alt={poster.alt}
                      width={poster.width}
                      height={poster.height}
                      className="jc-aircraft-shadow-light max-h-[260px] w-full object-contain"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col justify-between p-7 sm:p-9">
                    <div>
                      <p className="m-0 text-[13px] text-[var(--jc-muted)]">
                        {ac.category}
                      </p>
                      <h2 className="jc-display-section mt-2 m-0 text-[var(--jc-ink)]">
                        {ac.displayTitle}
                      </h2>
                      <p className="mt-1 text-[14px] text-[var(--jc-muted)]">
                        {ac.variant}
                      </p>
                      <p className="mt-4 text-[15px] leading-relaxed text-[var(--jc-muted)]">
                        {ac.summary}
                      </p>

                      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--jc-line-light)] pt-5 text-[14px]">
                        <div>
                          <dt className="text-[var(--jc-muted)]">3D views available</dt>
                          <dd className="mt-1 m-0 font-semibold text-[var(--jc-ink)]">
                            {ac.configurations.map((c) => c.label).join(", ")}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[var(--jc-muted)]">Model scope</dt>
                          <dd className="mt-1 m-0 font-semibold text-[var(--jc-ink)]">
                            Illustrative exterior
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--jc-line-light)] pt-6">
                      <Link
                        href={`/aircraft/${ac.slug}`}
                        className="jc-btn-teal flex-1"
                      >
                        Full aircraft profile
                      </Link>
                      <Link
                        href={`/inquire?service=private-jet&aircraft=${ac.id}`}
                        className="jc-btn-outline-dark"
                      >
                        Request a callback
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-14 border border-[var(--jc-line-light)] bg-[var(--jc-stone)] p-7 sm:p-9">
            <h2 className="jc-display-title m-0 text-[var(--jc-ink)]">
              Planning a 22+ guest group charter or a helicopter arrival?
            </h2>
            <p className="mt-3 max-w-[66ch] text-[15px] leading-relaxed text-[var(--jc-muted)]">
              The Hawker 4000 and Falcon 2000 Classic are business jet examples and are never represented as 22-passenger aircraft or rotorcraft.
            </p>
            <div className="mt-6 flex flex-wrap gap-3.5">
              <Link href="/services/group-charter" className="jc-btn-outline-dark">
                Group charter guide
              </Link>
              <Link href="/services/helicopters" className="jc-btn-outline-dark">
                Helicopters guide
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
