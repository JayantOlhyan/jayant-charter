import siteSettingsRaw from "@content/site-settings.json";
import mediaRaw from "@content/media.json";
import servicesRaw from "@content/services.json";
import aircraftRaw from "@content/aircraft.json";
import scenariosRaw from "@content/scenarios.json";
import faqsRaw from "@content/faqs.json";
import claimEvidenceRaw from "@content/claim-evidence.json";
import caseStudiesRaw from "@content/case-studies.json";
import testimonialsRaw from "@content/testimonials.json";
import editorialRaw from "@content/editorial.json";
import campaignsRaw from "@content/campaigns.json";
import scenesRaw from "@content/scenes.json";

import {
  AircraftSchema,
  CampaignPageSchema,
  CaseStudySchema,
  ClaimEvidenceSchema,
  EditorialEntrySchema,
  ExampleScenarioSchema,
  FaqItemSchema,
  MediaAssetSchema,
  SceneSchema,
  ServiceSchema,
  SiteSettingsSchema,
  TestimonialSchema,
  type AircraftRecord,
  type CampaignPage,
  type CaseStudyRecord,
  type EditorialEntry,
  type ExampleScenario,
  type FaqItem,
  type MediaAsset,
  type SceneRecord,
  type ServiceRecord,
  type SiteSettings,
  type TestimonialRecord,
} from "./schemas";
import { z } from "zod";

const siteSettings: SiteSettings = SiteSettingsSchema.parse(siteSettingsRaw);
const mediaList: MediaAsset[] = z.array(MediaAssetSchema).parse(mediaRaw);
const servicesList: ServiceRecord[] = z.array(ServiceSchema).parse(servicesRaw);
const aircraftList: AircraftRecord[] = z.array(AircraftSchema).parse(aircraftRaw);
const scenariosList: ExampleScenario[] = z.array(ExampleScenarioSchema).parse(scenariosRaw);
const faqsList: FaqItem[] = z.array(FaqItemSchema).parse(faqsRaw);
const claimEvidenceList = z.array(ClaimEvidenceSchema).parse(claimEvidenceRaw);
const caseStudiesList: CaseStudyRecord[] = z.array(CaseStudySchema).parse(caseStudiesRaw);
const testimonialsList: TestimonialRecord[] = z.array(TestimonialSchema).parse(testimonialsRaw);
const editorialList: EditorialEntry[] = z.array(EditorialEntrySchema).parse(editorialRaw);
const campaignsList: CampaignPage[] = z.array(CampaignPageSchema).parse(campaignsRaw);
const scenesList: SceneRecord[] = z.array(SceneSchema).parse(scenesRaw);

const mediaById = new Map<string, MediaAsset>(mediaList.map((m) => [m.id, m]));
const faqById = new Map<string, FaqItem>(faqsList.map((f) => [f.id, f]));
const sceneById = new Map<string, SceneRecord>(scenesList.map((s) => [s.id, s]));

export function getSceneById(id: string): SceneRecord {
  const scene = sceneById.get(id);
  if (!scene) {
    throw new Error(`Missing scene definition: ${id}`);
  }
  return scene;
}

export function getSiteSettings(): SiteSettings {
  return siteSettings;
}

export function getMediaAsset(id: string): MediaAsset {
  const asset = mediaById.get(id);
  if (!asset) {
    throw new Error(`Missing media asset reference: ${id}`);
  }
  return asset;
}

export function getPublishedServices(): ServiceRecord[] {
  return servicesList
    .filter((s) => s.status === "published")
    .sort((a, b) => a.featuredOrder - b.featuredOrder);
}

export function getServiceBySlug(slug: string): ServiceRecord | undefined {
  return servicesList.find((s) => s.slug === slug && s.status === "published");
}

export function getPublishedAircraft(): AircraftRecord[] {
  return aircraftList
    .filter((a) => a.status === "published")
    .sort((a, b) => a.featuredOrder - b.featuredOrder);
}

export function getAircraftBySlug(slug: string): AircraftRecord | undefined {
  return aircraftList.find((a) => a.slug === slug && a.status === "published");
}

export function getAircraftById(id: string): AircraftRecord | undefined {
  return aircraftList.find((a) => a.id === id && a.status === "published");
}

export function getPublishedScenarios(): ExampleScenario[] {
  return scenariosList.filter((s) => s.status === "published");
}

export function getFaqsByScope(scope: FaqItem["scopes"][number]): FaqItem[] {
  return faqsList.filter((f) => f.scopes.includes(scope));
}

export function getFaqsByIds(ids: string[]): FaqItem[] {
  return ids.map((id) => faqById.get(id)).filter((item): item is FaqItem => Boolean(item));
}

export function getPublishedCaseStudies(): CaseStudyRecord[] {
  return caseStudiesList.filter(
    (c) => c.status === "published" && c.anonymizationVerified
  );
}

export function getCaseStudyBySlug(slug: string): CaseStudyRecord | undefined {
  return getPublishedCaseStudies().find((c) => c.slug === slug);
}

export function getPublishedTestimonials(): TestimonialRecord[] {
  return testimonialsList.filter((t) => t.status === "published");
}

export function getPublishedInsights(): EditorialEntry[] {
  return editorialList.filter((e) => e.kind === "insight" && e.status === "published");
}

export function getInsightBySlug(slug: string): EditorialEntry | undefined {
  return getPublishedInsights().find((e) => e.slug === slug);
}

export function getPublishedDestinations(): EditorialEntry[] {
  return editorialList.filter((e) => e.kind === "destination" && e.status === "published");
}

export function getDestinationBySlug(slug: string): EditorialEntry | undefined {
  return getPublishedDestinations().find((e) => e.slug === slug);
}

export function getPublishedCampaigns(): CampaignPage[] {
  return campaignsList.filter((c) => c.status === "published");
}

export function getCampaignBySlug(slug: string): CampaignPage | undefined {
  return getPublishedCampaigns().find((c) => c.slug === slug);
}

export function getApprovedClaims() {
  return claimEvidenceList.filter((c) => c.publicApproval);
}

export function getPublicNavigationVisibility() {
  return {
    showCaseStudies: getPublishedCaseStudies().length > 0,
    showInsights: getPublishedInsights().length > 0,
  };
}
