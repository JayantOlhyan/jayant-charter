"use client";

import { useEffect, useState } from "react";

export interface LocalClockState {
  time: string;
  zoneLabel: string;
  headerText: string;
  ready: boolean;
}

const SHORT_ZONE_ALIASES: Record<string, string> = {
  "Asia/Kolkata": "IST",
  "Asia/Calcutta": "IST",
};

function resolveZoneAbbreviation(timeZone?: string): string {
  if (timeZone && SHORT_ZONE_ALIASES[timeZone]) {
    return SHORT_ZONE_ALIASES[timeZone];
  }

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(new Date());
    const abbr = parts.find((p) => p.type === "timeZoneName")?.value?.trim();
    if (abbr && !abbr.startsWith("GMT") && abbr.length <= 6) {
      return abbr;
    }
    if (timeZone && timeZone.includes("/")) {
      const citySeg = timeZone.split("/").pop()?.replace(/_/g, " ");
      if (citySeg) return citySeg;
    }
    if (abbr) return abbr;
  } catch {
    // ignore formatting errors
  }

  return "Local";
}

function formatLocalTime(
  timeZone: string | undefined,
  cityOverride: string | null
): LocalClockState {
  try {
    const now = new Date();
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    const detectedTz =
      timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const zoneLabel = cityOverride || resolveZoneAbbreviation(detectedTz);
    const headerText = cityOverride
      ? `${cityOverride} ${time}`
      : `Local ${time} ${zoneLabel}`;

    return { time, zoneLabel, headerText, ready: true };
  } catch {
    return { time: "--:--", zoneLabel: "Local", headerText: "", ready: false };
  }
}

let cachedVisitorGeo: Promise<{
  timezone: string | null;
  city: string | null;
}> | null = null;

function fetchVisitorGeo() {
  if (!cachedVisitorGeo) {
    cachedVisitorGeo = fetch("/api/visitor-time", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data: { timezone?: string | null; city?: string | null } | null) => ({
          timezone: data?.timezone ?? null,
          city: data?.city ?? null,
        })
      )
      .catch(() => ({ timezone: null, city: null }));
  }
  return cachedVisitorGeo;
}

/**
 * Live 24-hour clock strictly synced to the visitor's IP-derived timezone (via /api/visitor-time
 * edge headers when deployed) with immediate zero-latency fallback to the visitor's live
 * browser/OS timezone on local or direct connections.
 */
export function useLocalClock(): LocalClockState {
  const [state, setState] = useState<LocalClockState>({
    time: "--:--",
    zoneLabel: "Local",
    headerText: "",
    ready: false,
  });

  useEffect(() => {
    let active = true;
    let resolvedTz: string | undefined = undefined;
    let resolvedCity: string | null = null;

    const update = () => {
      if (!active) return;
      setState(formatLocalTime(resolvedTz, resolvedCity));
    };

    // Immediate paint in visitor's real local timezone
    update();

    // Upgrade to IP-resolved timezone/city when available from edge headers
    fetchVisitorGeo().then((geo) => {
      if (!active) return;
      if (geo.timezone) {
        resolvedTz = geo.timezone;
        resolvedCity = geo.city;
        update();
      }
    });

    const interval = window.setInterval(update, 10_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return state;
}
