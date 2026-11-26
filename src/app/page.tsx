import type { Metadata } from "next";
import {
  getFaqsByScope,
  getMediaAsset,
  getPublishedAircraft,
  getPublishedCaseStudies,
  getPublishedScenarios,
  getPublishedServices,
  getPublishedTestimonials,
  getSceneById,
  getSiteSettings,
} from "@/content/repository";
import type { MediaAsset } from "@/content/schemas";
import { HomeExperience } from "@/features/home/HomeExperience";

const settings = getSiteSettings();
const og = getMediaAsset(settings.defaultSeo.ogImageId);

export const metadata: Metadata = {
  title: settings.defaultSeo.title,
  description: settings.defaultSeo.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: settings.defaultSeo.title,
    description: settings.defaultSeo.description,
    images: [{ url: og.path, width: og.width, height: og.height, alt: og.alt }],
  },
};

export default function HomePage() {
  const services = getPublishedServices();
  const aircraftList = getPublishedAircraft();
  const scenarios = getPublishedScenarios();
  const faqs = getFaqsByScope("home");
  const caseStudies = getPublishedCaseStudies();
  const testimonials = getPublishedTestimonials();
  const arrivalScene = getSceneById("home-arrival-approach");
  const hangarScene = getSceneById("hangar-studio-explorer");

  const requiredMediaIds = new Set<string>([
    "hero-sky-plate",
    "jesko-sky-daylight",
    "jesko-clouds-marquee",
    "hawker-blueprint-planform",
    "cabin-editorial",
    "hawker-hero",
    "hawker-low-angle",
    "hawker-parked",
    "hawker-boarding",
    "hawker-engine-detail",
    "hawker-entry-detail",
    "hawker-gear-detail",
    "falcon-hero",
    "falcon-parked",
    "falcon-engine-detail",
    "helicopter-editorial",
    "group-charter-editorial",
  ]);
  for (const ac of aircraftList) {
    requiredMediaIds.add(ac.posterId);
    for (const cfg of ac.configurations) requiredMediaIds.add(cfg.posterId);
    for (const d of ac.detailMediaIds) requiredMediaIds.add(d);
  }

  const mediaById: Record<string, MediaAsset> = {};
  for (const id of requiredMediaIds) {
    mediaById[id] = getMediaAsset(id);
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HomeExperience
        settings={settings}
        services={services}
        aircraftList={aircraftList}
        arrivalScene={arrivalScene}
        hangarScene={hangarScene}
        scenarios={scenarios}
        faqs={faqs}
        caseStudies={caseStudies}
        testimonials={testimonials}
        mediaById={mediaById}
      />
    </>
  );
}
