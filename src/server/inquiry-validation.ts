import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export const InquiryServiceEnum = z.enum([
  "private-jet",
  "group-charter",
  "helicopter",
  "decide",
]);

export const TripTypeEnum = z.enum(["one-way", "return", "multi-stop"]);

export const EnginePreferenceEnum = z.enum(["no-preference", "single-engine", "twin-engine"]);

const IsoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const TripLegSchema = z.object({
  from: z.string().trim().max(120).optional().default(""),
  to: z.string().trim().max(120).optional().default(""),
  localDate: z
    .string()
    .trim()
    .refine((v) => v === "" || IsoDateRegex.test(v), "Use YYYY-MM-DD date format.")
    .optional()
    .default(""),
  localTimeWindow: z.string().trim().max(60).optional().default(""),
});

export const CreateInquiryPayloadSchema = z
  .object({
    submissionKey: z
      .string()
      .trim()
      .min(8, "Missing submission key.")
      .max(128, "Invalid submission key."),
    honeypot: z.string().max(120).optional().default(""),
    contact: z.object({
      name: z
        .string()
        .trim()
        .min(2, "Please enter your name.")
        .max(100, "Name must be 100 characters or fewer."),
      phone: z
        .string()
        .trim()
        .min(7, "Enter a reachable phone number with country code.")
        .max(32, "Phone number is too long."),
      email: z
        .string()
        .trim()
        .max(140)
        .refine(
          (val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
          "Enter a valid email address or leave this field blank."
        )
        .optional()
        .default(""),
    }),
    trip: z
      .object({
        service: InquiryServiceEnum.optional().default("decide"),
        type: TripTypeEnum.optional().default("one-way"),
        legs: z.array(TripLegSchema).max(6, "Up to 6 legs can be added online.").optional().default([]),
        returnDate: z
          .string()
          .trim()
          .refine((v) => v === "" || IsoDateRegex.test(v), "Use YYYY-MM-DD format for return date.")
          .optional()
          .default(""),
        flexibleDates: z.boolean().optional().default(false),
        timezone: z.string().trim().max(64).optional().default(""),
        passengers: z
          .union([z.number().int().positive("Passenger count must be at least 1.").max(500), z.null()])
          .optional()
          .default(null),
        venue: z.string().trim().max(160).optional().default(""),
        enginePreference: EnginePreferenceEnum.optional().default("no-preference"),
        aircraftPreferenceId: z.string().trim().max(80).nullable().optional().default(null),
        notes: z.string().trim().max(1200, "Notes must be 1,200 characters or fewer.").optional().default(""),
      })
      .optional()
      .default({
        service: "decide",
        type: "one-way",
        legs: [],
        returnDate: "",
        flexibleDates: false,
        timezone: "",
        passengers: null,
        venue: "",
        enginePreference: "no-preference",
        aircraftPreferenceId: null,
        notes: "",
      }),
    consents: z.object({
      inquiryContact: z.literal(true, {
        errorMap: () => ({
          message: "Permission is required so Jayant can contact you about this inquiry.",
        }),
      }),
      noticeVersion: z.string().trim().min(2).max(40).default("2026-11-25-v1"),
      marketing: z.boolean().optional().default(false),
    }),
    source: z
      .object({
        landingPath: z.string().trim().max(160).optional().default("/inquire"),
        referralToken: z
          .string()
          .trim()
          .max(64)
          .regex(/^[a-zA-Z0-9_-]*$/, "Invalid referral token.")
          .optional()
          .default(""),
        utmSource: z.string().trim().max(64).optional().default(""),
        utmMedium: z.string().trim().max(64).optional().default(""),
        utmCampaign: z.string().trim().max(80).optional().default(""),
      })
      .optional()
      .default({
        landingPath: "/inquire",
        referralToken: "",
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
      }),
  })
  .superRefine((data, ctx) => {
    // International phone validation
    const rawPhone = data.contact.phone.trim();
    const parsed = parsePhoneNumberFromString(rawPhone);
    if (!parsed || !parsed.isValid()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contact", "phone"],
        message: "Enter a valid international phone number including country code, e.g. +971 50 123 4567 or +91 98765 43210.",
      });
    }

    // Validate return date >= outbound date if both supplied
    const outboundDate = data.trip.legs[0]?.localDate ?? "";
    const returnDate = data.trip.returnDate ?? "";
    if (outboundDate && returnDate && returnDate < outboundDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["trip", "returnDate"],
        message: "Return date cannot be earlier than the outbound travel date.",
      });
    }
  });

export type CreateInquiryFormValues = z.input<typeof CreateInquiryPayloadSchema>;
export type CreateInquiryInput = z.output<typeof CreateInquiryPayloadSchema>;

export function normalizePhoneE164(raw: string): string {
  const parsed = parsePhoneNumberFromString(raw.trim());
  if (!parsed || !parsed.isValid()) {
    throw new Error("Invalid international phone number");
  }
  return parsed.number;
}
