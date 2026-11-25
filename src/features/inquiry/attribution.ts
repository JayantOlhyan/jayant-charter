"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export interface AttributionContext {
  landingPath: string;
  referralToken: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}

const STORAGE_KEY = "jc_attribution_v1";

function sanitizeToken(raw: string | null, maxLen: number): string {
  if (!raw) return "";
  return raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, maxLen);
}

function sanitizeParam(raw: string | null, maxLen: number): string {
  if (!raw) return "";
  return raw.trim().slice(0, maxLen);
}

export function readAttributionContext(): AttributionContext {
  if (typeof window === "undefined") {
    return {
      landingPath: "/",
      referralToken: "",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
    };
  }
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AttributionContext>;
      return {
        landingPath: parsed.landingPath || window.location.pathname || "/",
        referralToken: parsed.referralToken || "",
        utmSource: parsed.utmSource || "",
        utmMedium: parsed.utmMedium || "",
        utmCampaign: parsed.utmCampaign || "",
      };
    }
  } catch {
    // Ignore storage unavailability
  }
  return {
    landingPath: window.location.pathname || "/",
    referralToken: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
  };
}

export function AttributionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const existing = readAttributionContext();
      const ref = sanitizeToken(searchParams.get("ref"), 64);
      const utmSource = sanitizeParam(searchParams.get("utm_source"), 64);
      const utmMedium = sanitizeParam(searchParams.get("utm_medium"), 64);
      const utmCampaign = sanitizeParam(searchParams.get("utm_campaign"), 80);

      const alreadySet = Boolean(window.sessionStorage.getItem(STORAGE_KEY));
      const next: AttributionContext = {
        landingPath: alreadySet ? existing.landingPath : pathname || "/",
        referralToken: ref || existing.referralToken,
        utmSource: utmSource || existing.utmSource,
        utmMedium: utmMedium || existing.utmMedium,
        utmCampaign: utmCampaign || existing.utmCampaign,
      };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Session attribution is progressive; never block rendering
    }
  }, [pathname, searchParams]);

  return null;
}
