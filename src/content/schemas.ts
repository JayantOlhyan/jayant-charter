import { z } from "zod";

export const PublicationStatusSchema = z.enum(["draft", "review", "published"]);

export const SeoMetadataSchema = z.object({
  title: z.string().min(4).max(120),
  description: z.string().min(20).max(220),
  ogImageId: z.string().min(1),
  noIndex: z.boolean().optional(),
});

export const SiteSettingsSchema = z.object({
  brandName: z.string().min(2).max(60),
  brandMarkFirst: z.string().min(1).max(30),
  brandMarkSecond: z.string().min(1).max(30),
  descriptor: z.string().min(5).max(120),
  legalEntity: z.string().min(2).max(120),
  jurisdictionNotice: z.string().min(5).max(240),
  roleDisclosure: z.string().min(20).max(400),
  corridorsNote: z.string().min(10).max(260),
  timezone: z.string().min(3).max(60),
  responseHoursConfigured: z.boolean(),
  responseHoursLabel: z.string().nullable(),
  contactNoticeVersion: z.string().min(2).max(40),
  channels: z.object({
    email: z.string().email().nullable(),
    phone: z.string().min(7).max(30).nullable(),
    whatsappUrl: z.string().url().nullable(),
    linkedinUrl: z.string().url().nullable(),
    instagramUrl: z.string().url().nullable(),
  }),
  featureFlags: z.object({
    enableLive3D: z.boolean(),
    enableIntake: z.boolean(),
    showPreviewBanner: z.boolean(),
    enableSmoothScroll: z.boolean(),
  }),
  defaultSeo: SeoMetadataSchema,
});

export const MediaAssetSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  type: z.enum(["image", "render"]),
  path: z.string().startsWith("/media/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(10).max(240),
  caption: z.string().min(5).max(260),
  illustrative: z.boolean(),
  license: z.string().min(3).max(120),
  source: z.string().min(3).max(180),
  permissionStatus: z.enum(["approved", "internal-render", "generated-illustrative"]),
  focalPoint: z.string().optional(),
});

export const ModelConfigurationSchema = z.object({
  id: z.enum(["flight", "parked", "boarding"]),
  label: z.string().min(2).max(40),
  description: z.string().min(5).max(180),
  desktopUrl: z.string().startsWith("/models/"),
  mobileUrl: z.string().startsWith("/models/"),
  posterId: z.string().min(1),
  desktopBytes: z.number().int().positive(),
  mobileBytes: z.number().int().positive(),
  triangles: z.number().int().positive(),
  supportedPresets: z.array(z.string().min(1)).min(1),
  supportedHotspots: z.array(z.string().min(1)),
});

export const CameraPresetSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(2).max(40),
  orbit: z.string().min(5),
  target: z.string().min(3),
  fieldOfView: z.string().default("30deg"),
  requiredConfig: z.enum(["flight", "parked", "boarding"]).optional(),
});

export const ExteriorHotspotSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(2).max(60),
  summary: z.string().min(10).max(240),
  presetId: z.string().min(1),
  position: z.string().min(3),
  normal: z.string().min(3),
  supportedConfigs: z.array(z.enum(["flight", "parked", "boarding"])).min(1),
});

export const AircraftSpecificationSchema = z.object({
  label: z.string().min(2).max(80),
  value: z.string().min(1).max(120),
  unit: z.string().max(40).optional(),
  qualification: z.string().min(5).max(200),
  sourceLabel: z.string().min(3).max(120),
  sourceUrl: z.string().url(),
  reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const AircraftSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  manufacturer: z.string().min(2).max(80),
  model: z.string().min(2).max(80),
  variant: z.string().min(2).max(120),
  displayTitle: z.string().min(2).max(100),
  category: z.string().min(2).max(80),
  presentation: z.literal("illustrative-aircraft-example"),
  summary: z.string().min(20).max(320),
  overview: z.array(z.string().min(20).max(500)).min(1),
  tripConsiderations: z.array(z.string().min(10).max(240)).min(2),
  posterId: z.string().min(1),
  environmentUrl: z.string().startsWith("/models/"),
  configurations: z.array(ModelConfigurationSchema).min(1),
  cameraPresets: z.array(CameraPresetSchema).min(3),
  hotspots: z.array(ExteriorHotspotSchema),
  detailMediaIds: z.array(z.string().min(1)).min(1),
  specifications: z.array(AircraftSpecificationSchema),
  disclaimer: z.string().min(20).max(300),
  identityNote: z.string().min(10).max(300),
  licenseRefs: z.array(z.string().min(3)).min(1),
  relatedAircraftIds: z.array(z.string().min(1)),
  featuredOrder: z.number().int().nonnegative(),
  seo: SeoMetadataSchema,
  status: PublicationStatusSchema,
});

export const ServiceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  slug: z.enum(["private-jets", "group-charter", "helicopters"]),
  inquiryServiceKey: z.enum(["private-jet", "group-charter", "helicopter"]),
  title: z.string().min(3).max(80),
  headline: z.string().min(10).max(140),
  summary: z.string().min(20).max(320),
  editorialIntro: z.array(z.string().min(20).max(520)).min(1),
  useCases: z
    .array(
      z.object({
        title: z.string().min(4).max(100),
        detail: z.string().min(15).max(280),
      })
    )
    .min(3),
  inquiryChecklist: z.array(z.string().min(8).max(180)).min(3),
  heroMediaId: z.string().min(1),
  relatedAircraftIds: z.array(z.string()),
  availabilityQualifier: z.string().min(20).max(360),
  ctaLabel: z.string().min(4).max(60),
  faqIds: z.array(z.string().min(1)).min(2),
  featuredOrder: z.number().int().nonnegative(),
  seo: SeoMetadataSchema,
  status: PublicationStatusSchema,
});

export const ExampleScenarioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  kind: z.literal("example-itinerary-scenario"),
  badgeLabel: z.literal("Example scenario"),
  serviceId: z.string().min(1),
  routeLabel: z.string().min(4).max(80),
  title: z.string().min(6).max(100),
  summary: z.string().min(20).max(280),
  planningNotes: z.string().min(15).max(240),
  inquiryServiceKey: z.enum(["private-jet", "group-charter", "helicopter"]),
  status: PublicationStatusSchema,
});

export const FaqItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  question: z.string().min(10).max(180),
  answer: z.string().min(20).max(520),
  scopes: z.array(
    z.enum(["home", "private-jets", "group-charter", "helicopters", "how-it-works"])
  ),
});

export const CaseStudySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(6).max(120),
  serviceId: z.string().min(1),
  audience: z.string().min(4).max(100),
  summary: z.string().min(20).max(320),
  anonymizedRoute: z.string().min(4).max(120),
  timingGranularity: z.string().min(4).max(80),
  passengerContext: z.string().min(4).max(120),
  challenge: z.string().min(20).max(600),
  approach: z.string().min(20).max(600),
  outcome: z.string().min(20).max(600),
  mediaIds: z.array(z.string()),
  relatedAircraftIds: z.array(z.string()),
  anonymizationVerified: z.boolean(),
  evidenceApprovalRef: z.string().min(3),
  seo: SeoMetadataSchema,
  status: PublicationStatusSchema,
});

export const TestimonialSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  quote: z.string().min(20).max(400),
  attribution: z.string().min(3).max(100),
  linkedCaseId: z.string().nullable(),
  permissionReference: z.string().min(3),
  approvedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: PublicationStatusSchema,
});

export const EditorialEntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  kind: z.enum(["insight", "destination"]),
  title: z.string().min(6).max(120),
  intro: z.string().min(20).max(360),
  sections: z
    .array(
      z.object({
        heading: z.string().min(4).max(120),
        paragraphs: z.array(z.string().min(20).max(800)).min(1),
      })
    )
    .min(1),
  linkedServiceIds: z.array(z.string()),
  reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  seo: SeoMetadataSchema,
  status: PublicationStatusSchema,
});

export const CampaignPageSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  headline: z.string().min(10).max(120),
  lead: z.string().min(20).max(320),
  serviceId: z.string().min(1),
  inquiryServiceKey: z.enum(["private-jet", "group-charter", "helicopter", "decide"]),
  highlights: z.array(z.string().min(10).max(180)).min(3),
  enableViewer: z.boolean(),
  featuredAircraftId: z.string().nullable(),
  seo: SeoMetadataSchema,
  status: PublicationStatusSchema,
});

export const ClaimEvidenceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  claimText: z.string().min(10).max(260),
  source: z.string().min(5).max(200),
  scope: z.string().min(5).max(140),
  approver: z.string().min(2).max(80),
  reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  publicApproval: z.boolean(),
});

export type SiteSettings = z.infer<typeof SiteSettingsSchema>;
export type MediaAsset = z.infer<typeof MediaAssetSchema>;
export type AircraftRecord = z.infer<typeof AircraftSchema>;
export type ServiceRecord = z.infer<typeof ServiceSchema>;
export type ExampleScenario = z.infer<typeof ExampleScenarioSchema>;
export type FaqItem = z.infer<typeof FaqItemSchema>;
export type CaseStudyRecord = z.infer<typeof CaseStudySchema>;
export type TestimonialRecord = z.infer<typeof TestimonialSchema>;
export type EditorialEntry = z.infer<typeof EditorialEntrySchema>;
export type CampaignPage = z.infer<typeof CampaignPageSchema>;
export type ClaimEvidence = z.infer<typeof ClaimEvidenceSchema>;
