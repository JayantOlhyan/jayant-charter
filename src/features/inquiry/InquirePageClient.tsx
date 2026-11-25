"use client";

import { useSearchParams } from "next/navigation";
import { ProgressiveInquiryForm } from "./ProgressiveInquiryForm";
import type { AircraftRecord, SiteSettings } from "@/content/schemas";

interface InquirePageClientProps {
  settings: SiteSettings;
  aircraftList: AircraftRecord[];
}

const VALID_SERVICES = new Set([
  "private-jet",
  "group-charter",
  "helicopter",
  "decide",
]);

export function InquirePageClient({
  settings,
  aircraftList,
}: InquirePageClientProps) {
  const searchParams = useSearchParams();
  const rawService = searchParams.get("service") || "decide";
  const defaultService = (
    VALID_SERVICES.has(rawService) ? rawService : "decide"
  ) as "private-jet" | "group-charter" | "helicopter" | "decide";

  const rawAircraft = searchParams.get("aircraft");
  const validAircraftId = aircraftList.some((a) => a.id === rawAircraft)
    ? rawAircraft
    : null;

  return (
    <ProgressiveInquiryForm
      settings={settings}
      aircraftOptions={aircraftList}
      defaultService={defaultService}
      defaultAircraftId={validAircraftId}
      entryPage="/inquire"
    />
  );
}
