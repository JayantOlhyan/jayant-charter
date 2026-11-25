import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { getInquiryDb } from "./db/client";
import { deliveryJobs } from "./db/schema";
import { safeOperationalLog } from "./redaction";

export interface DeliveryAttemptOutcome {
  jobId: string;
  state: "pending" | "delivered" | "retry_scheduled" | "failed";
  errorCode: string | null;
}

export interface NotificationDispatcher {
  send(payload: {
    inquiryId: string;
    service: string;
    submittedAt: string;
    possibleDuplicate: boolean;
  }): Promise<{ ok: boolean; errorCode?: string }>;
}

const MAX_RETRIES = 4;

/**
 * Default dispatcher honors PRD Section 10.3 & D02:
 * When OWNER_NOTIFICATION_WEBHOOK_URL is configured, delivers a signed server-side payload.
 * When contact routing is paused (no external URL configured), keeps the durable outbox job
 * queued cleanly rather than pretending an external email/message succeeded.
 */
export const defaultDispatcher: NotificationDispatcher = {
  async send(payload) {
    const webhookUrl = process.env.OWNER_NOTIFICATION_WEBHOOK_URL;
    if (!webhookUrl) {
      return { ok: false, errorCode: "CHANNEL_PAUSED_UNCONFIGURED" };
    }

    const body = JSON.stringify(payload);
    const secret = process.env.OWNER_NOTIFICATION_SECRET || "";
    const signature = secret
      ? crypto.createHmac("sha256", secret).update(body).digest("hex")
      : "";

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(signature ? { "X-Jayant-Signature": signature } : {}),
        },
        body,
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        return { ok: false, errorCode: `HTTP_${res.status}` };
      }
      return { ok: true };
    } catch {
      return { ok: false, errorCode: "NETWORK_OR_TIMEOUT" };
    }
  },
};

export async function processDeliveryJob(
  jobId: string,
  payload: {
    inquiryId: string;
    service: string;
    submittedAt: string;
    possibleDuplicate: boolean;
  },
  dispatcher: NotificationDispatcher = defaultDispatcher
): Promise<DeliveryAttemptOutcome> {
  const { db } = getInquiryDb();
  const [job] = await db.select().from(deliveryJobs).where(eq(deliveryJobs.id, jobId)).limit(1);

  if (!job) {
    return { jobId, state: "failed", errorCode: "JOB_NOT_FOUND" };
  }

  const now = new Date();
  const attemptCount = job.attemptCount + 1;
  const result = await dispatcher.send(payload);

  if (result.ok) {
    await db
      .update(deliveryJobs)
      .set({
        state: "delivered",
        attemptCount,
        nextAttemptAt: null,
        lastErrorCode: null,
        updatedAt: now.toISOString(),
      })
      .where(eq(deliveryJobs.id, jobId));

    safeOperationalLog("delivery_job_delivered", {
      jobId,
      inquiryId: payload.inquiryId,
      attemptCount,
    });
    return { jobId, state: "delivered", errorCode: null };
  }

  const isPaused = result.errorCode === "CHANNEL_PAUSED_UNCONFIGURED";
  const exhausted = !isPaused && attemptCount >= MAX_RETRIES;
  const nextState = isPaused ? "pending" : exhausted ? "failed" : "retry_scheduled";
  const backoffMinutes = Math.pow(2, attemptCount) * 2;
  const nextAttemptAt =
    nextState === "retry_scheduled"
      ? new Date(now.getTime() + backoffMinutes * 60_000).toISOString()
      : null;

  await db
    .update(deliveryJobs)
    .set({
      state: nextState,
      attemptCount,
      nextAttemptAt,
      lastErrorCode: result.errorCode ?? "UNKNOWN_ERROR",
      updatedAt: now.toISOString(),
    })
    .where(eq(deliveryJobs.id, jobId));

  safeOperationalLog("delivery_job_deferred", {
    jobId,
    inquiryId: payload.inquiryId,
    state: nextState,
    attemptCount,
    errorCode: result.errorCode ?? "UNKNOWN_ERROR",
  });

  return { jobId, state: nextState, errorCode: result.errorCode ?? null };
}
