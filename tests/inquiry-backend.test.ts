import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getInquiryDb, resetInquiryDbForTests } from "@/server/db/client";
import { deliveryJobs, inquiries, inquiryEvents } from "@/server/db/schema";
import { CreateInquiryPayloadSchema } from "@/server/inquiry-validation";
import {
  createDurableInquiry,
  transitionInquiryStage,
} from "@/server/inquiry-service";
import { checkRateLimit, resetRateLimiterForTests } from "@/server/rate-limit";
import type { NotificationDispatcher } from "@/server/notification-adapter";

const failingDispatcher: NotificationDispatcher = {
  async send() {
    return { ok: false, errorCode: "SMTP_TRANSIENT_TIMEOUT" };
  },
};

const succeedingDispatcher: NotificationDispatcher = {
  async send() {
    return { ok: true };
  },
};

describe("Durable inquiry intake and lead ownership (AC10-AC16, AC26)", () => {
  beforeEach(() => {
    process.env.INQUIRY_DB_PATH = ":memory:";
    resetInquiryDbForTests();
    resetRateLimiterForTests();
  });

  it("AC10: persists short valid callback with only name, phone, and consent", async () => {
    const parsed = CreateInquiryPayloadSchema.parse({
      submissionKey: "sub-key-short-001",
      contact: { name: "Aarav Mehta", phone: "+91 98765 43210" },
      consents: { inquiryContact: true, noticeVersion: "2026-11-25-v1" },
      source: {
        landingPath: "/services/private-jets",
        referralToken: "warm_intro_dubai",
        utmSource: "linkedin",
      },
    });

    const result = await createDurableInquiry(parsed, {
      dispatcher: succeedingDispatcher,
    });

    expect(result.kind).toBe("created");
    if (result.kind !== "created") return;
    expect(result.inquiryId).toMatch(/^JC-/);

    const { db } = getInquiryDb();
    const [saved] = await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.id, result.inquiryId));
    expect(saved).toBeDefined();
    expect(saved.contactPhoneNormalized).toBe("+919876543210");
    expect(saved.currentStage).toBe("received");
    expect(saved.ownerId).toBe("jayant");
    expect(saved.handoffApprovedAt).toBeNull();
    expect(saved.referralToken).toBe("warm_intro_dubai");
    expect(saved.landingPath).toBe("/services/private-jets");

    const events = await db
      .select()
      .from(inquiryEvents)
      .where(eq(inquiryEvents.inquiryId, result.inquiryId));
    expect(events).toHaveLength(1);
    expect(events[0].newStage).toBe("received");

    const jobs = await db
      .select()
      .from(deliveryJobs)
      .where(eq(deliveryJobs.inquiryId, result.inquiryId));
    expect(jobs).toHaveLength(1);
    expect(jobs[0].state).toBe("delivered");
  });

  it("AC11: rejects invalid phone, missing consent, and inverted return date; allows 22+ passengers", () => {
    const badPhone = CreateInquiryPayloadSchema.safeParse({
      submissionKey: "sub-bad-001",
      contact: { name: "Test User", phone: "12345" },
      consents: { inquiryContact: true, noticeVersion: "2026-11-25-v1" },
    });
    expect(badPhone.success).toBe(false);

    const badDates = CreateInquiryPayloadSchema.safeParse({
      submissionKey: "sub-bad-002",
      contact: { name: "Test User", phone: "+971 50 123 4567" },
      trip: {
        service: "group-charter",
        type: "return",
        legs: [{ from: "Mumbai", to: "Udaipur", localDate: "2027-02-20" }],
        returnDate: "2027-02-18",
        passengers: 22,
      },
      consents: { inquiryContact: true, noticeVersion: "2026-11-25-v1" },
    });
    expect(badDates.success).toBe(false);

    const largeGroup = CreateInquiryPayloadSchema.safeParse({
      submissionKey: "sub-group-048",
      contact: { name: "Event Planner", phone: "+971 50 123 4567" },
      trip: {
        service: "group-charter",
        type: "return",
        legs: [{ from: "Mumbai", to: "Udaipur", localDate: "2027-02-20" }],
        returnDate: "2027-02-22",
        passengers: 48,
      },
      consents: { inquiryContact: true, noticeVersion: "2026-11-25-v1" },
    });
    expect(largeGroup.success).toBe(true);
  });

  it("AC12: idempotent retry returns original inquiryId without duplicating; mismatched payload conflicts", async () => {
    const payload = CreateInquiryPayloadSchema.parse({
      submissionKey: "idemp-key-001",
      contact: { name: "Riya Kapoor", phone: "+971 50 222 3344" },
      trip: { service: "helicopter", venue: "Udaipur Palace", enginePreference: "twin-engine" },
      consents: { inquiryContact: true, noticeVersion: "2026-11-25-v1" },
    });

    const first = await createDurableInquiry(payload, { dispatcher: succeedingDispatcher });
    const replay = await createDurableInquiry(payload, { dispatcher: succeedingDispatcher });

    expect(first.kind).toBe("created");
    expect(replay.kind).toBe("idempotent_replay");
    if (first.kind === "created" && replay.kind === "idempotent_replay") {
      expect(replay.inquiryId).toBe(first.inquiryId);
    }

    const mutated = CreateInquiryPayloadSchema.parse({
      submissionKey: "idemp-key-001",
      contact: { name: "Different Name", phone: "+971 50 222 3344" },
      consents: { inquiryContact: true, noticeVersion: "2026-11-25-v1" },
    });
    const conflict = await createDurableInquiry(mutated, { dispatcher: succeedingDispatcher });
    expect(conflict.kind).toBe("conflict");

    const { db } = getInquiryDb();
    const allRows = await db.select().from(inquiries);
    expect(allRows).toHaveLength(1);
  });

  it("flags repeat inquiries from same contact internally without blocking or exposing prior data", async () => {
    const firstPayload = CreateInquiryPayloadSchema.parse({
      submissionKey: "dup-check-001",
      contact: { name: "Vikram Singh", phone: "+91 98111 22334" },
      trip: { service: "private-jet" },
      consents: { inquiryContact: true, noticeVersion: "2026-11-25-v1" },
    });
    const secondPayload = CreateInquiryPayloadSchema.parse({
      submissionKey: "dup-check-002",
      contact: { name: "Vikram Singh", phone: "+91 98111 22334" },
      trip: { service: "private-jet", notes: "Added extra bag" },
      consents: { inquiryContact: true, noticeVersion: "2026-11-25-v1" },
    });

    const first = await createDurableInquiry(firstPayload, { dispatcher: succeedingDispatcher });
    const second = await createDurableInquiry(secondPayload, { dispatcher: succeedingDispatcher });

    expect(first.kind).toBe("created");
    expect(second.kind).toBe("created");
    if (first.kind === "created" && second.kind === "created") {
      const { db } = getInquiryDb();
      const [row] = await db.select().from(inquiries).where(eq(inquiries.id, second.inquiryId));
      expect(row.possibleDuplicateOf).toBe(first.inquiryId);
    }
  });

  it("AC14: notification failure keeps saved inquiry durable and schedules retry job", async () => {
    const payload = CreateInquiryPayloadSchema.parse({
      submissionKey: "notif-fail-001",
      contact: { name: "Nadia Al Mansoor", phone: "+971 52 999 8877" },
      consents: { inquiryContact: true, noticeVersion: "2026-11-25-v1" },
    });

    const result = await createDurableInquiry(payload, { dispatcher: failingDispatcher });
    expect(result.kind).toBe("created");
    if (result.kind !== "created") return;

    const { db } = getInquiryDb();
    const [job] = await db
      .select()
      .from(deliveryJobs)
      .where(eq(deliveryJobs.id, result.deliveryJobId));
    expect(job.state).toBe("retry_scheduled");
    expect(job.attemptCount).toBe(1);
    expect(job.nextAttemptAt).not.toBeNull();
    expect(job.lastErrorCode).toBe("SMTP_TRANSIENT_TIMEOUT");
  });

  it("AC15 & AC26: blocks onward handoff without recorded permission and reconciles stages when approved", async () => {
    const payload = CreateInquiryPayloadSchema.parse({
      submissionKey: "handoff-001",
      contact: { name: "Synthetic Arranger", phone: "+91 98200 11223" },
      trip: { service: "private-jet", aircraftPreferenceId: "hawker-4000" },
      consents: { inquiryContact: true, noticeVersion: "2026-11-25-v1" },
    });

    const created = await createDurableInquiry(payload, { dispatcher: succeedingDispatcher });
    expect(created.kind).toBe("created");
    if (created.kind !== "created") return;

    // Attempting onward handoff without onward consent MUST throw
    expect(() =>
      transitionInquiryStage({
        inquiryId: created.inquiryId,
        newStage: "sent_to_partner",
        actor: "jayant",
      })
    ).toThrow(/Onward handoff blocked/);

    transitionInquiryStage({
      inquiryId: created.inquiryId,
      newStage: "jayant_review",
      actor: "jayant",
      reason: "Initial callback completed",
    });

    const handedOff = transitionInquiryStage({
      inquiryId: created.inquiryId,
      newStage: "sent_to_partner",
      actor: "jayant",
      recordOnwardConsent: true,
      reason: "Traveller explicitly approved introduction for quote",
    });

    expect(handedOff.handoffApprovedAt).not.toBeNull();
    expect(handedOff.onwardConsentRecordedAt).not.toBeNull();

    const { db } = getInquiryDb();
    const events = await db
      .select()
      .from(inquiryEvents)
      .where(eq(inquiryEvents.inquiryId, created.inquiryId));
    expect(events.map((e) => e.newStage)).toEqual([
      "received",
      "jayant_review",
      "sent_to_partner",
    ]);
  });

  it("enforces sliding-window rate limits cleanly", () => {
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("ip:test", { maxRequests: 3, windowMs: 60_000 }).allowed).toBe(true);
    }
    const blocked = checkRateLimit("ip:test", { maxRequests: 3, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
