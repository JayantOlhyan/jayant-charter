import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function decodeGeoHeader(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

/**
 * Resolves the visitor's IP-derived timezone and city from edge / CDN proxy headers
 * (Vercel, Cloudflare, CloudFront, Netlify, NGINX GeoIP) without leaking client IPs
 * to any third-party tracking service. When running locally (loopback) or without
 * geo headers, returns timezone: null so the client seamlessly formats live browser
 * local time via Intl.DateTimeFormat().resolvedOptions().timeZone.
 */
export function GET(request: NextRequest) {
  const h = request.headers;

  let timezone: string | null =
    h.get("x-vercel-ip-timezone") ||
    h.get("cf-timezone") ||
    h.get("cloudfront-viewer-time-zone") ||
    h.get("x-geo-timezone") ||
    null;

  let city: string | null =
    decodeGeoHeader(h.get("x-vercel-ip-city")) ||
    decodeGeoHeader(h.get("cf-ipcity")) ||
    decodeGeoHeader(h.get("cloudfront-viewer-city")) ||
    decodeGeoHeader(h.get("x-geo-city")) ||
    null;

  // Netlify passes base64-encoded JSON in x-nf-geo
  if (!timezone) {
    const nfGeo = h.get("x-nf-geo");
    if (nfGeo) {
      try {
        const parsed = JSON.parse(
          Buffer.from(nfGeo, "base64").toString("utf8")
        ) as { timezone?: string; city?: string };
        if (parsed.timezone) timezone = parsed.timezone;
        if (!city && parsed.city) city = parsed.city;
      } catch {
        // ignore malformed header
      }
    }
  }

  if (timezone && !isValidTimeZone(timezone)) {
    timezone = null;
  }

  return NextResponse.json(
    {
      source: timezone ? "ip-header" : "browser-fallback",
      timezone,
      city,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
