import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content");

const FORBIDDEN_PUBLIC_TERMS = [/\bsumit\b/i, /\btransworld\b/i, /\bour fleet\b/i];

function readJson(fileName) {
  const fullPath = path.join(contentDir, fileName);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

const errors = [];

const files = [
  "site-settings.json",
  "media.json",
  "services.json",
  "aircraft.json",
  "scenarios.json",
  "faqs.json",
  "claim-evidence.json",
  "case-studies.json",
  "testimonials.json",
  "editorial.json",
  "campaigns.json",
];

// 1. Check JSON validity and forbidden private/unapproved copy across all content files
for (const file of files) {
  const fullPath = path.join(contentDir, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing content file: content/${file}`);
    continue;
  }
  const raw = fs.readFileSync(fullPath, "utf8");
  for (const pattern of FORBIDDEN_PUBLIC_TERMS) {
    if (pattern.test(raw)) {
      errors.push(`Forbidden term matched (${pattern}) in content/${file}`);
    }
  }
  if (raw.includes("\u2014") || raw.includes("\u2013")) {
    errors.push(`Em/en dash detected in content/${file}; replace with standard punctuation.`);
  }
  try {
    JSON.parse(raw);
  } catch (err) {
    errors.push(`Invalid JSON in content/${file}: ${err.message}`);
  }
}

if (errors.length === 0) {
  const site = readJson("site-settings.json");
  const media = readJson("media.json");
  const services = readJson("services.json");
  const aircraft = readJson("aircraft.json");
  const scenarios = readJson("scenarios.json");
  const faqs = readJson("faqs.json");
  const caseStudies = readJson("case-studies.json");

  const mediaIds = new Set(media.map((m) => m.id));
  const serviceIds = new Set(services.map((s) => s.id));
  const aircraftIds = new Set(aircraft.map((a) => a.id));
  const faqIds = new Set(faqs.map((f) => f.id));

  if (!mediaIds.has(site.defaultSeo.ogImageId)) {
    errors.push(`site-settings defaultSeo.ogImageId missing: ${site.defaultSeo.ogImageId}`);
  }

  for (const service of services) {
    if (!mediaIds.has(service.heroMediaId)) {
      errors.push(`Service ${service.id} references missing heroMediaId: ${service.heroMediaId}`);
    }
    for (const acId of service.relatedAircraftIds) {
      if (!aircraftIds.has(acId)) {
        errors.push(`Service ${service.id} references missing aircraft: ${acId}`);
      }
    }
    for (const fId of service.faqIds) {
      if (!faqIds.has(fId)) {
        errors.push(`Service ${service.id} references missing FAQ: ${fId}`);
      }
    }
    // Enforce PRD 7.2: Hawker/Falcon must not be presented as 22-passenger group aircraft
    if (service.slug === "group-charter" && service.relatedAircraftIds.length > 0) {
      errors.push(`Group charter must not link mid-size jets as group fleet examples.`);
    }
  }

  for (const ac of aircraft) {
    if (!mediaIds.has(ac.posterId)) {
      errors.push(`Aircraft ${ac.id} references missing posterId: ${ac.posterId}`);
    }
    for (const detailId of ac.detailMediaIds) {
      if (!mediaIds.has(detailId)) {
        errors.push(`Aircraft ${ac.id} references missing detailMediaId: ${detailId}`);
      }
    }
    for (const cfg of ac.configurations) {
      if (!mediaIds.has(cfg.posterId)) {
        errors.push(`Aircraft ${ac.id} config ${cfg.id} references missing posterId: ${cfg.posterId}`);
      }
    }
    if (ac.id === "falcon-2000-classic") {
      if (!/classic/i.test(ac.displayTitle) || !/classic/i.test(ac.variant)) {
        errors.push(`Falcon 2000 Classic identity rule violated: title/variant must clearly state Classic.`);
      }
      if (/\b(EX|LX|LXS)\b/.test(ac.displayTitle)) {
        errors.push(`Falcon 2000 Classic must never be titled EX, LX, or LXS.`);
      }
    }
  }

  for (const sc of scenarios) {
    if (!serviceIds.has(sc.serviceId)) {
      errors.push(`Scenario ${sc.id} references missing serviceId: ${sc.serviceId}`);
    }
    if (sc.kind !== "example-itinerary-scenario") {
      errors.push(`Scenario ${sc.id} must use kind "example-itinerary-scenario".`);
    }
  }

  for (const cs of caseStudies) {
    if (cs.status === "published" && !cs.anonymizationVerified) {
      errors.push(`Published case study ${cs.id} must have anonymizationVerified: true.`);
    }
  }
}

if (errors.length > 0) {
  console.error("Content validation FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("Content validation PASSED (all schemas, cross-references, identity & privacy rules verified).");
