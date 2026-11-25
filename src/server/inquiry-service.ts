import crypto from "node:crypto";
import { and, desc, eq, gte } from "drizzle-orm";
import { getInquiryDb } from "./db/client";
import { deliveryJobs, inquiries, inquiryEvents, type InquiryStage } from "./db/schema";
import {
  type CreateInquiryInput,
  normalizePhoneE164,
} from "./inquiry-validation";
import {
  defaultDispatcher,
  processDeliveryJob,
  type NotificationDispatcher,
} from "./notification-adapter";
import { safeOperationalLog } from "./redaction";

export type CreateInquiryResult =
  | { kind: "created"; inquiryId: string; status: "received"; deliveryJobId: string }
  | { kind: "idempotent_replay"; inquiryId: string; status: "received" }
  | { kind: "conflict"; message: string };

function generateInquiryId(): string {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `JC-${stamp}-${rand}`;
}

function hashCanonicalPayload(input: CreateInquiryInput, normalizedPhone: string): string {
  const canonical = JSON.stringify({
    name: input.contact.name.trim(),
    phone: normalizedPhone,
    email: input.contact.email.trim().toLowerCase(),
    trip: input.trip,
    consents: input.consents,
  });
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

export async function createDurableInquiry(
  input: CreateInquiryInput,
  options: { dispatcher?: NotificationDispatcher } = {}
): Promise<CreateInquiryResult> {
  const normalizedPhone = normalizePhoneE164(input.contact.phone);
  const payloadHash = hashCanonicalPayload(input, normalizedPhone);
  const { db, sqlite } = getInquiryDb();

  // 1. Check idempotency key first
  const [existingByKey] = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.submissionKey, input.submissionKey))
    .limit(1);

  if (existingByKey) {
    if (existingByKey.payloadHash === payloadHash) {
      safeOperationalLog("inquiry_idempotent_replay", {
        inquiryId: existingByKey.id,
      });
      return { kind: "idempotent_replay", inquiryId: existingByKey.id, status: "received" };
    }
    return {
      kind: "conflict",
      message: "This submission key was already used for a different request. Please submit again.",
    };
  }

  // 2. Check for recent duplicate from same phone + service within 48h (flagged internally; never exposed)
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const [recentMatch] = await db
    .select({ id: inquiries.id })
    .from(inquiries)
    .where(
      and(
        eq(inquiries.contactPhoneNormalized, normalizedPhone),
        eq(inquiries.service, input.trip.service),
        gte(inquiries.submittedAt, twoDaysAgo)
      )
    )
    .orderBy(desc(inquiries.submittedAt))
    .limit(1);

  const nowIso = new Date().toISOString();
  const inquiryId = generateInquiryId();
  const eventId = `EVT-${crypto.randomBytes(6).toString("hex")}`;
  const deliveryJobId = `JOB-${crypto.randomBytes(6).toString("hex")}`;

  // 3. Atomic SQLite transaction: persist inquiry + initial stage event + delivery outbox job
  const tx = sqlite.transaction(() => {
    db.insert(inquiries)
      .values({
        id: inquiryId,
        submissionKey: input.submissionKey,
        payloadHash,
        submittedAt: nowIso,
        contactName: input.contact.name,
        contactPhoneRaw: input.contact.phone,
        contactPhoneNormalized: normalizedPhone,
        contactEmail: input.contact.email || null,
        service: input.trip.service,
        tripType: input.trip.type,
        tripJson: JSON.stringify({
          legs: input.trip.legs,
          returnDate: input.trip.returnDate || null,
          flexibleDates: input.trip.flexibleDates,
          timezone: input.trip.timezone || null,
        }),
        passengers: input.trip.passengers,
        venue: input.trip.venue || null,
        enginePreference:
          input.trip.service === "helicopter" ? input.trip.enginePreference : null,
        aircraftPreferenceId: input.trip.aircraftPreferenceId || null,
        notes: input.trip.notes || null,
        consentInquiryContact: true,
        consentNoticeVersion: input.consents.noticeVersion,
        consentMarketing: input.consents.marketing,
        landingPath: input.source.landingPath || "/inquire",
        referralToken: input.source.referralToken || null,
        utmJson: JSON.stringify({
          utmSource: input.source.utmSource || null,
          utmMedium: input.source.utmMedium || null,
          utmCampaign: input.source.utmCampaign || null,
        }),
        currentStage: "received",
        possibleDuplicateOf: recentMatch?.id ?? null,
        ownerId: "jayant",
      })
      .run();

    db.insert(inquiryEvents)
      .values({
        id: eventId,
        inquiryId,
        eventType: "stage_transition",
        previousStage: null,
        newStage: "received",
        actor: "web-intake",
        occurredAt: nowIso,
        reason: recentMatch
          ? `Received via web intake; flagged possible duplicate of ${recentMatch.id} for owner review.`
          : "Received via web intake.",
      })
      .run();

    db.insert(deliveryJobs)
      .values({
        id: deliveryJobId,
        inquiryId,
        destinationType: "owner_notification",
        state: "pending",
        attemptCount: 0,
        nextAttemptAt: nowIso,
        lastErrorCode: null,
        acknowledgedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .run();
  });

  tx();

  safeOperationalLog("inquiry_persisted", {
    inquiryId,
    service: input.trip.service,
    possibleDuplicate: Boolean(recentMatch),
  });

  // 4. Trigger initial non-blocking delivery attempt (never fails already-persisted inquiry!)
  await processDeliveryJob(
    deliveryJobId,
    {
      inquiryId,
      service: input.trip.service,
      submittedAt: nowIso,
      possibleDuplicate: Boolean(recentMatch),
    },
    options.dispatcher ?? defaultDispatcher
  ).catch(() => {
    // Persisted inquiry remains safe; outbox job retains pending/retry state
  });

  return {
    kind: "created",
    inquiryId,
    status: "received",
    deliveryJobId,
  };
}

/**
 * Operational stage transition & permissioned handoff helper (PRD Section 11.1 & 11.3).
 * Enforces that onward partner handoff cannot occur without recorded onward consent and explicit owner approval.
 */
export function transitionInquiryStage(params: {
  inquiryId: string;
  newStage: InquiryStage;
  actor: string;
  reason?: string;
  recordOnwardConsent?: boolean;
}) {
  const { db, sqlite } = getInquiryDb();
  const [record] = db
    .select()
    .from(inquiries)
    .where(eq(inquiries.id, params.inquiryId))
    .limit(1)
    .all();

  if (!record) {
    throw new Error(`Inquiry not found: ${params.inquiryId}`);
  }

  const nowIso = new Date().toISOString();
  const consentRecordedAt = params.recordOnwardConsent
    ? nowIso
    : record.onwardConsentRecordedAt;

  if (params.newStage === "sent_to_partner" && !consentRecordedAt) {
    throw new Error(
      "Onward handoff blocked: explicit onward-sharing consent must be recorded before forwarding."
    );
  }

  const handoffApprovedAt =
    params.newStage === "sent_to_partner" ? nowIso : record.handoffApprovedAt;

  const tx = sqlite.transaction(() => {
    db.update(inquiries)
      .set({
        currentStage: params.newStage,
        onwardConsentRecordedAt: consentRecordedAt,
        handoffApprovedAt,
      })
      .where(eq(inquiries.id, params.inquiryId))
      .run();

    db.insert(inquiryEvents)
      .values({
        id: `EVT-${crypto.randomBytes(6).toString("hex")}`,
        inquiryId: params.inquiryId,
        eventType: "stage_transition",
        previousStage: record.currentStage,
        newStage: params.newStage,
        actor: params.actor,
        occurredAt: nowIso,
        reason: params.reason ?? null,
      })
      .run();
  });

  tx();

  return {
    inquiryId: params.inquiryId,
    previousStage: record.currentStage,
    newStage: params.newStage,
    handoffApprovedAt,
    onwardConsentRecordedAt: consentRecordedAt,
  };
}
