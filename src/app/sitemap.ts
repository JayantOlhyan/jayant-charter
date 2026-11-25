import type { MetadataRoute } from "next";
import {
  getPublishedAircraft,
  getPublishedCaseStudies,
  getPublishedDestinations,
  getPublishedInsights,
  getPublishedServices,
} from "@/content/repository";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();

  const staticPaths = [
    "",
    "/aircraft",
    "/about",
    "/how-it-works",
    "/inquire",
    "/privacy",
    "/terms",
  ];

  const servicePaths = getPublishedServices().map((s) => `/services/${s.slug}`);
  const aircraftPaths = getPublishedAircraft().map((a) => `/aircraft/${a.slug}`);

  const caseStudies = getPublishedCaseStudies();
  const casePaths =
    caseStudies.length > 0
      ? ["/case-studies", ...caseStudies.map((c) => `/case-studies/${c.slug}`)]
      : [];

  const insights = getPublishedInsights();
  const insightPaths =
    insights.length > 0
      ? ["/insights", ...insights.map((i) => `/insights/${i.slug}`)]
      : [];

  const destinationPaths = getPublishedDestinations().map(
    (d) => `/destinations/${d.slug}`
  );

  const allPaths = [
    ...staticPaths,
    ...servicePaths,
    ...aircraftPaths,
    ...casePaths,
    ...insightPaths,
    ...destinationPaths,
  ];

  return allPaths.map((p) => ({
    url: `${baseUrl}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : p.startsWith("/services") || p.startsWith("/aircraft") ? 0.9 : 0.7,
  }));
}
