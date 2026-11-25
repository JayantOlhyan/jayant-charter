export type SafeAnalyticsEvent =
  | { name: "service_view"; serviceId: string; page: string }
  | { name: "aircraft_view"; aircraftId: string; deviceClass: "mobile" | "desktop" }
  | {
      name: "viewer_requested";
      sceneId: string;
      qualityTier: "mobile" | "desktop";
      trigger: "explicit" | "auto";
    }
  | { name: "viewer_ready"; assetVersion: string; elapsedBucket: "fast" | "normal" | "slow" }
  | { name: "viewer_failed"; errorCode: string; assetId: string }
  | { name: "viewer_interaction"; sceneId: string; interactionKind: "orbit" | "preset" | "config" | "hotspot" }
  | { name: "inquiry_started"; entryPage: string; service: string }
  | { name: "inquiry_validation_error"; fieldKey: string; errorCode: string }
  | { name: "inquiry_submitted"; service: string; hasReferral: boolean }
  | { name: "contact_channel_click"; channel: string; location: string };

/**
 * Emits strictly PII-free diagnostic events (PRD Section 23.1).
 * Never transmits personal contact info, phone numbers, emails, or trip notes.
 * Dispatches a CustomEvent so an approved privacy-compliant collector can subscribe later.
 */
export function trackSafeEvent(event: SafeAnalyticsEvent): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("jc:analytics", { detail: event }));
  } catch {
    // Analytics must never interrupt user journeys
  }
}
