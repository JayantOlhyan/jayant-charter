import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getAircraftBySlug,
  getPublishedAircraft,
  getPublishedCaseStudies,
  getPublishedServices,
  getPublicNavigationVisibility,
  getSceneById,
  getServiceBySlug,
  getSiteSettings,
} from "@/content/repository";

describe("Content integrity, aircraft identity, and privacy rules (AC03, AC17, AC20, AC23, AC24)", () => {
  it("AC03: preserves Hawker 4000 realistic 3-config assets and Falcon 2000 Classic identity", () => {
    const hawker = getAircraftBySlug("hawker-4000");
    expect(hawker).toBeDefined();
    expect(hawker?.configurations.map((c) => c.id)).toEqual([
      "flight",
      "parked",
      "boarding",
    ]);

    const falcon = getAircraftBySlug("falcon-2000-classic");
    expect(falcon).toBeDefined();
    expect(falcon?.displayTitle).toContain("Classic");
    expect(falcon?.displayTitle).not.toMatch(/\b(EX|LX|LXS)\b/);
    expect(falcon?.configurations.map((c) => c.id)).toEqual(["flight", "parked"]);
  });

  it("PRD 7.2: never attaches Hawker or Falcon as 22-passenger group charter aircraft", () => {
    const group = getServiceBySlug("group-charter");
    expect(group).toBeDefined();
    expect(group?.relatedAircraftIds).toEqual([]);
  });

  it("AC17: hides draft case studies and empty proof sections until published", () => {
    expect(getPublishedCaseStudies()).toHaveLength(0);
    const nav = getPublicNavigationVisibility();
    expect(nav.showCaseStudies).toBe(false);
    expect(nav.showInsights).toBe(false);
  });

  it("AC23: preserves contact-setup pause until live channels are configured", () => {
    const settings = getSiteSettings();
    expect(settings.channels.email).toBeNull();
    expect(settings.channels.whatsappUrl).toBeNull();
    expect(settings.featureFlags.showPreviewBanner).toBe(true);
  });

  it("AC20 & AC24: ensures zero internal partner names or banned claims exist in public content", () => {
    const contentDir = path.join(process.cwd(), "content");
    const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(contentDir, file), "utf8");
      expect(raw).not.toMatch(/\bsumit\b/i);
      expect(raw).not.toMatch(/\btransworld\b/i);
      expect(raw).not.toMatch(/\bour fleet\b/i);
      expect(raw).not.toMatch(/30\s*minutes/i);
    }
    expect(getPublishedServices()).toHaveLength(3);
    expect(getPublishedAircraft()).toHaveLength(2);
  });

  it("Validates reusable 3D scene records, broadside profile keyframes, and lighting modes", () => {
    const arrivalScene = getSceneById("home-arrival-approach");
    expect(arrivalScene).toBeDefined();
    expect(arrivalScene?.aircraftId).toBe("hawker-4000");
    expect(arrivalScene?.keyframes.arrival.thetaDeg).toBe(-36);
    expect(arrivalScene?.keyframes.approach.thetaDeg).toBe(0);
    expect(arrivalScene?.qualityPolicy.mobileExplicitOnly).toBe(true);
    expect(arrivalScene?.qualityPolicy.reducedMotionStatic).toBe(true);

    const hangarScene = getSceneById("hangar-studio-explorer");
    expect(hangarScene).toBeDefined();
    expect(hangarScene?.lightingModes.map((m) => m.id)).toEqual([
      "twilight",
      "daylight",
      "dusk",
    ]);
  });
});
