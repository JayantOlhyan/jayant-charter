import { NextResponse, type NextRequest } from "next/server";
import { getSiteSettings } from "@/content/repository";
import { CreateInquiryPayloadSchema } from "@/server/inquiry-validation";
import { createDurableInquiry } from "@/server/inquiry-service";
import { checkRateLimit } from "@/server/rate-limit";
import { safeOperationalLog } from "@/server/redaction";

const MAX_BODY_BYTES = 16 * 1024;

function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "local";
}

export async function POST(request: NextRequest) {
  const settings = getSiteSettings();
  if (!settings.featureFlags.enableIntake) {
    return NextResponse.json(
      {
        error: "intake_unavailable",
        message: "Online inquiry intake is temporarily paused. Please try again shortly.",
      },
      { status: 503 }
    );
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      {
        error: "payload_too_large",
        message: "Request payload exceeds the maximum allowed size.",
      },
      { status: 413 }
    );
  }

  const rate = checkRateLimit(`inquiries:${getClientKey(request)}`);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Too many inquiry attempts in a short period. Please wait a moment and try again.",
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Unable to read the submitted request." },
      { status: 400 }
    );
  }

  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "payload_too_large", message: "Request payload exceeds the maximum allowed size." },
      { status: 413 }
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Submitted request must be valid JSON." },
      { status: 400 }
    );
  }

  const parsed = CreateInquiryPayloadSchema.safeParse(json);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return NextResponse.json(
      {
        error: "validation_failed",
        message: "Please review the highlighted fields and try again.",
        fieldErrors,
      },
      { status: 422 }
    );
  }

  // Silent honeypot discard for automated bots without leaking validation hints
  if (parsed.data.honeypot && parsed.data.honeypot.trim().length > 0) {
    safeOperationalLog("inquiry_honeypot_triggered", {});
    return NextResponse.json(
      {
        error: "validation_failed",
        message: "We could not accept this request. Please reload the page and try again.",
      },
      { status: 422 }
    );
  }

  try {
    const outcome = await createDurableInquiry(parsed.data);

    if (outcome.kind === "conflict") {
      return NextResponse.json(
        {
          error: "idempotency_conflict",
          message: outcome.message,
        },
        { status: 409 }
      );
    }

    if (outcome.kind === "idempotent_replay") {
      return NextResponse.json(
        {
          inquiryId: outcome.inquiryId,
          status: outcome.status,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        inquiryId: outcome.inquiryId,
        status: outcome.status,
      },
      { status: 201 }
    );
  } catch (err) {
    safeOperationalLog("inquiry_persistence_error", {
      code: err instanceof Error ? err.name : "UNKNOWN",
    });
    return NextResponse.json(
      {
        error: "storage_unavailable",
        message:
          "We could not save your inquiry right now. Your entered details have been kept on screen so you can retry shortly.",
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  // PRD Section 19.3: Do not expose a public status endpoint that reveals personal information
  return NextResponse.json(
    { error: "method_not_allowed", message: "Use POST to submit an inquiry." },
    { status: 405 }
  );
}
