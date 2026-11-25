import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const INQUIRY_STAGES = [
  "received",
  "jayant_review",
  "ready_for_handoff",
  "sent_to_partner",
  "accepted",
  "contact_attempted",
  "reached",
  "qualified",
  "quoted",
  "booked",
  "flown",
  "commission_paid",
  "lost",
  "cancelled",
  "spam",
  "duplicate",
] as const;

export type InquiryStage = (typeof INQUIRY_STAGES)[number];

export const DELIVERY_STATES = [
  "pending",
  "delivered",
  "acknowledged",
  "retry_scheduled",
  "failed",
] as const;

export type DeliveryState = (typeof DELIVERY_STATES)[number];

export const inquiries = sqliteTable(
  "inquiries",
  {
    id: text("id").primaryKey(),
    submissionKey: text("submission_key").notNull().unique(),
    payloadHash: text("payload_hash").notNull(),
    submittedAt: text("submitted_at").notNull(),

    contactName: text("contact_name").notNull(),
    contactPhoneRaw: text("contact_phone_raw").notNull(),
    contactPhoneNormalized: text("contact_phone_normalized").notNull(),
    contactEmail: text("contact_email"),

    service: text("service").notNull(),
    tripType: text("trip_type"),
    tripJson: text("trip_json").notNull(),
    passengers: integer("passengers"),
    venue: text("venue"),
    enginePreference: text("engine_preference"),
    aircraftPreferenceId: text("aircraft_preference_id"),
    notes: text("notes"),

    consentInquiryContact: integer("consent_inquiry_contact", { mode: "boolean" }).notNull(),
    consentNoticeVersion: text("consent_notice_version").notNull(),
    consentMarketing: integer("consent_marketing", { mode: "boolean" }).notNull().default(false),

    landingPath: text("landing_path"),
    referralToken: text("referral_token"),
    utmJson: text("utm_json"),

    currentStage: text("current_stage").notNull().default("received"),
    possibleDuplicateOf: text("possible_duplicate_of"),
    ownerId: text("owner_id").notNull().default("jayant"),
    crmReference: text("crm_reference"),
    handoffApprovedAt: text("handoff_approved_at"),
    onwardConsentRecordedAt: text("onward_consent_recorded_at"),
    retentionUntil: text("retention_until"),
  },
  (table) => [
    index("idx_inquiries_phone_submitted").on(table.contactPhoneNormalized, table.submittedAt),
    index("idx_inquiries_stage").on(table.currentStage),
  ]
);

export const inquiryEvents = sqliteTable(
  "inquiry_events",
  {
    id: text("id").primaryKey(),
    inquiryId: text("inquiry_id")
      .notNull()
      .references(() => inquiries.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    previousStage: text("previous_stage"),
    newStage: text("new_stage"),
    actor: text("actor").notNull(),
    occurredAt: text("occurred_at").notNull(),
    reason: text("reason"),
  },
  (table) => [index("idx_events_inquiry").on(table.inquiryId)]
);

export const deliveryJobs = sqliteTable(
  "delivery_jobs",
  {
    id: text("id").primaryKey(),
    inquiryId: text("inquiry_id")
      .notNull()
      .references(() => inquiries.id, { onDelete: "cascade" }),
    destinationType: text("destination_type").notNull(),
    state: text("state").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    nextAttemptAt: text("next_attempt_at"),
    lastErrorCode: text("last_error_code"),
    acknowledgedAt: text("acknowledged_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_delivery_inquiry").on(table.inquiryId),
    index("idx_delivery_state").on(table.state),
  ]
);
