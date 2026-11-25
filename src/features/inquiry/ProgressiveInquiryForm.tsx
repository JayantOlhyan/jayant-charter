"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CreateInquiryPayloadSchema,
  type CreateInquiryFormValues,
  type CreateInquiryInput,
} from "@/server/inquiry-validation";
import { readAttributionContext } from "./attribution";
import { trackSafeEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { AircraftRecord, SiteSettings } from "@/content/schemas";

interface ProgressiveInquiryFormProps {
  settings: SiteSettings;
  aircraftOptions: AircraftRecord[];
  defaultService?: "private-jet" | "group-charter" | "helicopter" | "decide";
  defaultAircraftId?: string | null;
  entryPage: string;
}

type SubmissionState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; inquiryId: string }
  | { kind: "error"; message: string; retryAfterSeconds?: number; unavailable?: boolean };

function createSubmissionKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `jc-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

const SERVICE_CHOICES: Array<{
  value: "private-jet" | "group-charter" | "helicopter" | "decide";
  label: string;
}> = [
  { value: "private-jet", label: "Private jet" },
  { value: "group-charter", label: "Group charter" },
  { value: "helicopter", label: "Helicopter" },
  { value: "decide", label: "Help me decide" },
];

const TRIP_TYPE_CHOICES: Array<{
  value: "one-way" | "return" | "multi-stop";
  label: string;
}> = [
  { value: "one-way", label: "One-way" },
  { value: "return", label: "Return" },
  { value: "multi-stop", label: "Multi-stop" },
];

const ENGINE_CHOICES: Array<{
  value: "no-preference" | "single-engine" | "twin-engine";
  label: string;
}> = [
  { value: "no-preference", label: "No preference" },
  { value: "single-engine", label: "Single-engine" },
  { value: "twin-engine", label: "Twin-engine" },
];

export function ProgressiveInquiryForm({
  settings,
  aircraftOptions,
  defaultService = "decide",
  defaultAircraftId = null,
  entryPage,
}: ProgressiveInquiryFormProps) {
  const formId = useId();
  const [detailsOpen, setDetailsOpen] = useState<boolean>(
    Boolean(defaultAircraftId || defaultService !== "decide")
  );
  const [submissionKey, setSubmissionKey] = useState<string>(() => createSubmissionKey());
  const [submitState, setSubmitState] = useState<SubmissionState>({ kind: "idle" });
  const hasStartedRef = useRef<boolean>(false);
  const statusHeadingRef = useRef<HTMLHeadingElement>(null);

  const aircraftMap = useMemo(
    () => new Map(aircraftOptions.map((a) => [a.id, a])),
    [aircraftOptions]
  );

  const form = useForm<CreateInquiryFormValues, unknown, CreateInquiryInput>({
    resolver: zodResolver(CreateInquiryPayloadSchema),
    mode: "onBlur",
    defaultValues: {
      submissionKey,
      honeypot: "",
      contact: {
        name: "",
        phone: "",
        email: "",
      },
      trip: {
        service: defaultService,
        type: "one-way",
        legs: [{ from: "", to: "", localDate: "", localTimeWindow: "" }],
        returnDate: "",
        flexibleDates: false,
        timezone: settings.timezone,
        passengers: null,
        venue: "",
        enginePreference: "no-preference",
        aircraftPreferenceId: defaultAircraftId,
        notes: "",
      },
      consents: {
        inquiryContact: undefined as unknown as true,
        noticeVersion: settings.contactNoticeVersion,
        marketing: false,
      },
      source: {
        landingPath: entryPage,
        referralToken: "",
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
      },
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = form;

  const { fields: legFields, append: appendLeg, remove: removeLeg } = useFieldArray({
    control,
    name: "trip.legs",
  });

  const watchedService = watch("trip.service");
  const watchedTripType = watch("trip.type");
  const watchedAircraftId = watch("trip.aircraftPreferenceId");
  const watchedConsent = watch("consents.inquiryContact");
  const watchedFlexible = watch("trip.flexibleDates");

  // Keep submissionKey synced into form state
  useEffect(() => {
    setValue("submissionKey", submissionKey);
  }, [setValue, submissionKey]);

  // Sync external service/aircraft preference changes cleanly without losing user input
  useEffect(() => {
    if (defaultService) {
      setValue("trip.service", defaultService);
    }
  }, [defaultService, setValue]);

  useEffect(() => {
    if (defaultAircraftId !== undefined) {
      setValue("trip.aircraftPreferenceId", defaultAircraftId);
      if (defaultAircraftId) setDetailsOpen(true);
    }
  }, [defaultAircraftId, setValue]);

  // Populate client timezone & session attribution once mounted
  useEffect(() => {
    try {
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detectedTz) setValue("trip.timezone", detectedTz);
    } catch {
      // Keep default timezone
    }
    const attr = readAttributionContext();
    setValue("source.landingPath", attr.landingPath || entryPage);
    setValue("source.referralToken", attr.referralToken);
    setValue("source.utmSource", attr.utmSource);
    setValue("source.utmMedium", attr.utmMedium);
    setValue("source.utmCampaign", attr.utmCampaign);
  }, [entryPage, setValue]);

  // Ensure multi-stop always has at least 2 legs when selected
  useEffect(() => {
    if (watchedTripType === "multi-stop" && legFields.length < 2) {
      appendLeg({ from: "", to: "", localDate: "", localTimeWindow: "" });
    }
  }, [watchedTripType, legFields.length, appendLeg]);

  const markStarted = () => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      trackSafeEvent({
        name: "inquiry_started",
        entryPage,
        service: watchedService || "decide",
      });
    }
  };

  const onSubmit = async (values: CreateInquiryInput) => {
    setSubmitState({ kind: "submitting" });

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          submissionKey,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        inquiryId?: string;
        status?: string;
        error?: string;
        message?: string;
        fieldErrors?: Record<string, string>;
        retryAfterSeconds?: number;
      };

      if (response.status === 201 || response.status === 200) {
        const inquiryId = data.inquiryId || "RECORDED";
        setSubmitState({ kind: "success", inquiryId });
        trackSafeEvent({
          name: "inquiry_submitted",
          service: values.trip.service,
          hasReferral: Boolean(values.source.referralToken),
        });
        requestAnimationFrame(() => statusHeadingRef.current?.focus());
        return;
      }

      if (response.status === 422 && data.fieldErrors) {
        for (const [fieldPath, msg] of Object.entries(data.fieldErrors)) {
          setError(fieldPath as keyof CreateInquiryInput, { message: msg });
          trackSafeEvent({
            name: "inquiry_validation_error",
            fieldKey: fieldPath,
            errorCode: "server_validation",
          });
        }
        setSubmitState({
          kind: "error",
          message: data.message || "Please review the highlighted fields.",
        });
        return;
      }

      if (response.status === 409) {
        // Payload changed under old key: issue fresh key and let user resubmit safely
        setSubmissionKey(createSubmissionKey());
        setSubmitState({
          kind: "error",
          message:
            "Your trip details were updated after a prior attempt. Please press Request a callback once more to record this new request.",
        });
        return;
      }

      if (response.status === 429) {
        setSubmitState({
          kind: "error",
          message:
            data.message ||
            "Too many requests were sent in a short window. Your details remain on screen so you can retry shortly.",
          retryAfterSeconds: data.retryAfterSeconds,
        });
        return;
      }

      setSubmitState({
        kind: "error",
        message:
          data.message ||
          "We could not record your inquiry right now. Your entered details have been kept so you can retry.",
        unavailable: response.status === 503,
      });
    } catch {
      // Network interruption: keep identical submissionKey so retry is safely idempotent (AC12)
      setSubmitState({
        kind: "error",
        message:
          "Connection interrupted before confirmation arrived. Press Request a callback again to safely retry without creating a duplicate inquiry.",
      });
    }
  };

  const handleStartAnother = () => {
    const nextKey = createSubmissionKey();
    setSubmissionKey(nextKey);
    reset({
      submissionKey: nextKey,
      honeypot: "",
      contact: { name: "", phone: "", email: "" },
      trip: {
        service: defaultService,
        type: "one-way",
        legs: [{ from: "", to: "", localDate: "", localTimeWindow: "" }],
        returnDate: "",
        flexibleDates: false,
        timezone: settings.timezone,
        passengers: null,
        venue: "",
        enginePreference: "no-preference",
        aircraftPreferenceId: null,
        notes: "",
      },
      consents: {
        inquiryContact: undefined as unknown as true,
        noticeVersion: settings.contactNoticeVersion,
        marketing: false,
      },
      source: readAttributionContext(),
    });
    setSubmitState({ kind: "idle" });
  };

  const selectedAircraft = watchedAircraftId ? aircraftMap.get(watchedAircraftId) : null;

  if (!settings.featureFlags.enableIntake) {
    return (
      <div
        role="status"
        className="rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)] p-8"
      >
        <h3 className="font-serif text-[28px] text-[var(--jc-ink)]">
          Online inquiries are temporarily paused
        </h3>
        <p className="mt-3 text-[15px] text-[var(--jc-muted)]">
          Please check back shortly while maintenance is completed.
        </p>
      </div>
    );
  }

  if (submitState.kind === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-[4px] border border-[var(--jc-success-border)] bg-[var(--jc-success-bg)] p-7 sm:p-10"
      >
        <div className="flex items-start gap-3.5">
          <CheckCircle2
            aria-hidden="true"
            className="mt-1 size-6 shrink-0 text-[var(--jc-success)]"
          />
          <div>
            <h3
              ref={statusHeadingRef}
              tabIndex={-1}
              className="font-serif text-[30px] leading-tight text-[var(--jc-ink)] outline-none"
            >
              Your inquiry has been received.
            </h3>
            <p className="mt-3 max-w-[54ch] text-[16px] leading-relaxed text-[var(--jc-ink)]">
              Jayant will contact you to discuss the trip. Submitting this request records your inquiry so feasibility can be checked; availability, aircraft selection, and pricing are confirmed separately in your quote.
            </p>

            <dl className="mt-6 grid grid-cols-1 gap-3 border-t border-[var(--jc-success-border)] pt-5 text-[14px] sm:grid-cols-2">
              <div>
                <dt className="text-[var(--jc-muted)]">Reference ID</dt>
                <dd className="mt-0.5 font-semibold text-[var(--jc-ink)] tabular-nums">
                  {submitState.inquiryId}
                </dd>
              </div>
              {settings.responseHoursConfigured && settings.responseHoursLabel && (
                <div>
                  <dt className="text-[var(--jc-muted)]">Staffed response window</dt>
                  <dd className="mt-0.5 font-medium text-[var(--jc-ink)]">
                    {settings.responseHoursLabel}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleStartAnother}
                className="jc-btn-outline-dark !min-h-[44px] !text-[14px]"
              >
                Submit another trip
              </button>
              <Link
                href="/aircraft"
                className="jc-btn-teal !min-h-[44px] !text-[14px]"
              >
                Explore aircraft examples
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const errorEntries = [
    errors.contact?.name?.message && { id: `${formId}-name`, text: errors.contact.name.message },
    errors.contact?.phone?.message && { id: `${formId}-phone`, text: errors.contact.phone.message },
    errors.contact?.email?.message && { id: `${formId}-email`, text: errors.contact.email.message },
    errors.trip?.returnDate?.message && {
      id: `${formId}-return-date`,
      text: errors.trip.returnDate.message,
    },
    errors.trip?.passengers?.message && {
      id: `${formId}-passengers`,
      text: errors.trip.passengers.message,
    },
    errors.consents?.inquiryContact?.message && {
      id: `${formId}-consent`,
      text: errors.consents.inquiryContact.message,
    },
  ].filter((item): item is { id: string; text: string } => Boolean(item));

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onFocusCapture={markStarted}
      noValidate
      className="rounded-[4px] border border-[var(--jc-line-light)] bg-[var(--jc-paper)] p-6 sm:p-10"
    >
      {/* Hidden honeypot against automated spam */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`${formId}-company`}>Leave this field blank</label>
        <input
          id={`${formId}-company`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("honeypot")}
        />
      </div>

      {/* Accessible error summary when validation or submission fails */}
      {(errorEntries.length > 0 || submitState.kind === "error") && (
        <div
          role="alert"
          className="mb-7 rounded-[3px] border border-[var(--jc-danger-border)] bg-[var(--jc-danger-bg)] p-4 text-[14px] text-[var(--jc-danger)]"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="m-0 font-semibold">
                {submitState.kind === "error"
                  ? submitState.message
                  : "Please check the required details below."}
              </p>
              {submitState.kind === "error" && submitState.retryAfterSeconds && (
                <p className="mt-1 m-0 text-[13px] tabular-nums">
                  Suggested retry wait: {submitState.retryAfterSeconds} seconds.
                </p>
              )}
              {errorEntries.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {errorEntries.map((err) => (
                    <li key={err.id}>
                      <a href={`#${err.id}`} className="underline underline-offset-2">
                        {err.text}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Essential Minimum Intake (PRD Section 10.1: Name, Phone, Permission) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label
            htmlFor={`${formId}-name`}
            className="text-[14px] font-medium text-[var(--jc-ink)]"
          >
            Full name <span className="text-[var(--jc-danger)]">*</span>
          </Label>
          <Input
            id={`${formId}-name`}
            type="text"
            autoComplete="name"
            maxLength={100}
            aria-invalid={Boolean(errors.contact?.name)}
            aria-describedby={errors.contact?.name ? `${formId}-name-err` : undefined}
            className="mt-2 min-h-12 rounded-[3px] border-[var(--jc-line-strong)] bg-[var(--jc-ivory)] px-3.5 text-[16px] text-[var(--jc-ink)]"
            {...register("contact.name")}
          />
          <p
            id={`${formId}-name-err`}
            className="mt-1.5 min-h-[1.25rem] text-[13px] text-[var(--jc-danger)]"
          >
            {errors.contact?.name?.message || ""}
          </p>
        </div>

        <div>
          <Label
            htmlFor={`${formId}-phone`}
            className="text-[14px] font-medium text-[var(--jc-ink)]"
          >
            Phone with country code <span className="text-[var(--jc-danger)]">*</span>
          </Label>
          <Input
            id={`${formId}-phone`}
            type="tel"
            autoComplete="tel"
            placeholder="+971 50 123 4567 or +91 98765 43210"
            aria-invalid={Boolean(errors.contact?.phone)}
            aria-describedby={errors.contact?.phone ? `${formId}-phone-err` : `${formId}-phone-hint`}
            className="mt-2 min-h-12 rounded-[3px] border-[var(--jc-line-strong)] bg-[var(--jc-ivory)] px-3.5 text-[16px] text-[var(--jc-ink)] tabular-nums"
            {...register("contact.phone")}
          />
          {errors.contact?.phone?.message ? (
            <p
              id={`${formId}-phone-err`}
              className="mt-1.5 min-h-[1.25rem] text-[13px] text-[var(--jc-danger)]"
            >
              {errors.contact.phone.message}
            </p>
          ) : (
            <p
              id={`${formId}-phone-hint`}
              className="mt-1.5 min-h-[1.25rem] text-[13px] text-[var(--jc-muted)]"
            >
              Include international prefix so Jayant can reach you directly.
            </p>
          )}
        </div>
      </div>

      {/* Service Selection */}
      <fieldset className="mt-4 border-0 p-0">
        <legend className="text-[14px] font-medium text-[var(--jc-ink)]">
          Service <span className="font-normal text-[var(--jc-muted)]">(optional)</span>
        </legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {SERVICE_CHOICES.map((option) => {
            const active = watchedService === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setValue("trip.service", option.value)}
                className={cn(
                  "min-h-11 rounded-[3px] border px-4 text-[14px] font-medium transition-colors duration-150 cursor-pointer",
                  active
                    ? "border-[var(--jc-teal)] bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                    : "border-[var(--jc-line-strong)] bg-[var(--jc-ivory)] text-[var(--jc-ink)] hover:border-[var(--jc-teal)]"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Removable Aircraft Preference Badge (AC04) */}
      {selectedAircraft && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-[var(--jc-line-light)] bg-[var(--jc-stone)] px-4 py-3 text-[14px]">
          <div>
            <span className="text-[var(--jc-muted)]">Aircraft preference attached: </span>
            <strong className="font-semibold text-[var(--jc-ink)]">
              {selectedAircraft.displayTitle}
            </strong>
            <span className="block text-[12px] text-[var(--jc-muted)]">
              Saved as a preference only; availability is confirmed in your quote.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setValue("trip.aircraftPreferenceId", null)}
            className="inline-flex min-h-9 items-center gap-1 rounded-[3px] border border-[var(--jc-line-strong)] bg-[var(--jc-paper)] px-3 text-[13px] text-[var(--jc-ink)] hover:border-[var(--jc-teal)] cursor-pointer"
          >
            <X aria-hidden="true" className="size-3.5" />
            <span>Remove</span>
          </button>
        </div>
      )}

      {/* Progressive Disclosure Toggle for Optional Trip Details */}
      <div className="mt-6 border-t border-[var(--jc-line-light)] pt-5">
        <button
          type="button"
          aria-expanded={detailsOpen}
          aria-controls={`${formId}-trip-details`}
          onClick={() => setDetailsOpen((prev) => !prev)}
          className="inline-flex min-h-11 w-full items-center justify-between rounded-[3px] border border-[var(--jc-line-light)] bg-[var(--jc-ivory)] px-4 py-2.5 text-left text-[15px] font-medium text-[var(--jc-ink)] transition-colors hover:border-[var(--jc-teal)] cursor-pointer"
        >
          <span>Add trip details now (route, dates, passengers, venue)</span>
          {detailsOpen ? (
            <ChevronUp aria-hidden="true" className="size-4 text-[var(--jc-muted)]" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-4 text-[var(--jc-muted)]" />
          )}
        </button>

        {detailsOpen && (
          <div id={`${formId}-trip-details`} className="mt-5 space-y-5">
            {/* Trip Type */}
            <fieldset className="border-0 p-0">
              <legend className="text-[14px] font-medium text-[var(--jc-ink)]">
                Trip type
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {TRIP_TYPE_CHOICES.map((choice) => {
                  const selected = watchedTripType === choice.value;
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setValue("trip.type", choice.value)}
                      className={cn(
                        "min-h-10 rounded-[3px] border px-3.5 text-[14px] transition-colors cursor-pointer",
                        selected
                          ? "border-[var(--jc-teal)] bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                          : "border-[var(--jc-line-strong)] bg-[var(--jc-ivory)] text-[var(--jc-ink)]"
                      )}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Dynamic Route Legs */}
            <div className="space-y-4">
              {legFields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-[3px] border border-[var(--jc-line-light)] bg-[var(--jc-ivory)] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[var(--jc-ink)]">
                      {watchedTripType === "multi-stop" ? `Leg ${index + 1}` : "Route and travel date"}
                    </span>
                    {watchedTripType === "multi-stop" && legFields.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeLeg(index)}
                        className="inline-flex min-h-9 items-center gap-1 text-[13px] text-[var(--jc-danger)] hover:underline cursor-pointer"
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />
                        <span>Remove leg</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label
                        htmlFor={`${formId}-from-${index}`}
                        className="text-[13px] font-medium text-[var(--jc-ink)]"
                      >
                        Departure city or airport
                      </Label>
                      <Input
                        id={`${formId}-from-${index}`}
                        placeholder="e.g. Dubai (OMDB / DWC)"
                        className="mt-1.5 min-h-12 rounded-[3px] border-[var(--jc-line-strong)] bg-[var(--jc-paper)] text-[16px]"
                        {...register(`trip.legs.${index}.from`)}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor={`${formId}-to-${index}`}
                        className="text-[13px] font-medium text-[var(--jc-ink)]"
                      >
                        Destination city, airport, or venue
                      </Label>
                      <Input
                        id={`${formId}-to-${index}`}
                        placeholder="e.g. New Delhi, Mumbai, or Udaipur"
                        className="mt-1.5 min-h-12 rounded-[3px] border-[var(--jc-line-strong)] bg-[var(--jc-paper)] text-[16px]"
                        {...register(`trip.legs.${index}.to`)}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor={`${formId}-date-${index}`}
                        className="text-[13px] font-medium text-[var(--jc-ink)]"
                      >
                        Local departure date
                      </Label>
                      <Input
                        id={`${formId}-date-${index}`}
                        type="date"
                        className="mt-1.5 min-h-12 rounded-[3px] border-[var(--jc-line-strong)] bg-[var(--jc-paper)] text-[16px] tabular-nums"
                        {...register(`trip.legs.${index}.localDate`)}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor={`${formId}-window-${index}`}
                        className="text-[13px] font-medium text-[var(--jc-ink)]"
                      >
                        Preferred local time window
                      </Label>
                      <Input
                        id={`${formId}-window-${index}`}
                        placeholder="e.g. Morning departure, flexible"
                        className="mt-1.5 min-h-12 rounded-[3px] border-[var(--jc-line-strong)] bg-[var(--jc-paper)] text-[16px]"
                        {...register(`trip.legs.${index}.localTimeWindow`)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {watchedTripType === "multi-stop" && legFields.length < 6 && (
                <button
                  type="button"
                  onClick={() =>
                    appendLeg({ from: "", to: "", localDate: "", localTimeWindow: "" })
                  }
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-[3px] border border-[var(--jc-line-strong)] bg-[var(--jc-ivory)] px-4 text-[14px] font-medium text-[var(--jc-ink)] hover:border-[var(--jc-teal)] cursor-pointer"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  <span>Add another leg</span>
                </button>
              )}
            </div>

            {/* Conditional Return Date + Passengers */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {watchedTripType === "return" && (
                <div>
                  <Label
                    htmlFor={`${formId}-return-date`}
                    className="text-[14px] font-medium text-[var(--jc-ink)]"
                  >
                    Return date
                  </Label>
                  <Input
                    id={`${formId}-return-date`}
                    type="date"
                    aria-invalid={Boolean(errors.trip?.returnDate)}
                    className="mt-1.5 min-h-12 rounded-[3px] border-[var(--jc-line-strong)] bg-[var(--jc-ivory)] text-[16px] tabular-nums"
                    {...register("trip.returnDate")}
                  />
                  {errors.trip?.returnDate?.message && (
                    <p className="mt-1.5 text-[13px] text-[var(--jc-danger)]">
                      {errors.trip.returnDate.message}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label
                  htmlFor={`${formId}-passengers`}
                  className="text-[14px] font-medium text-[var(--jc-ink)]"
                >
                  Passengers
                </Label>
                <Input
                  id={`${formId}-passengers`}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder="e.g. 4, 22, or larger group"
                  aria-invalid={Boolean(errors.trip?.passengers)}
                  className="mt-1.5 min-h-12 rounded-[3px] border-[var(--jc-line-strong)] bg-[var(--jc-ivory)] text-[16px] tabular-nums"
                  {...register("trip.passengers", {
                    setValueAs: (v: string) => {
                      if (v === "" || v === null || v === undefined) return null;
                      const n = Number(v);
                      return Number.isNaN(n) ? null : n;
                    },
                  })}
                />
                {errors.trip?.passengers?.message && (
                  <p className="mt-1.5 text-[13px] text-[var(--jc-danger)]">
                    {errors.trip.passengers.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor={`${formId}-email`}
                  className="text-[14px] font-medium text-[var(--jc-ink)]"
                >
                  Email <span className="font-normal text-[var(--jc-muted)]">(optional)</span>
                </Label>
                <Input
                  id={`${formId}-email`}
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  aria-invalid={Boolean(errors.contact?.email)}
                  className="mt-1.5 min-h-12 rounded-[3px] border-[var(--jc-line-strong)] bg-[var(--jc-ivory)] text-[16px]"
                  {...register("contact.email")}
                />
                {errors.contact?.email?.message && (
                  <p className="mt-1.5 text-[13px] text-[var(--jc-danger)]">
                    {errors.contact.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Flexible dates toggle */}
            <div className="flex items-center gap-3">
              <Checkbox
                id={`${formId}-flexible`}
                checked={Boolean(watchedFlexible)}
                onCheckedChange={(checked) => setValue("trip.flexibleDates", Boolean(checked))}
                className="size-5 rounded-[3px] border-[var(--jc-line-strong)]"
              />
              <Label
                htmlFor={`${formId}-flexible`}
                className="text-[14px] font-normal text-[var(--jc-ink)] cursor-pointer"
              >
                My travel dates are flexible
              </Label>
            </div>

            {/* Helicopter & Event Venue Fields */}
            {(watchedService === "helicopter" || watchedService === "group-charter") && (
              <div className="grid grid-cols-1 gap-4 rounded-[3px] border border-[var(--jc-line-light)] bg-[var(--jc-ivory)] p-4 sm:grid-cols-2">
                <div>
                  <Label
                    htmlFor={`${formId}-venue`}
                    className="text-[14px] font-medium text-[var(--jc-ink)]"
                  >
                    City and venue or property name
                  </Label>
                  <Input
                    id={`${formId}-venue`}
                    placeholder="e.g. Udaipur resort or hotel name"
                    className="mt-1.5 min-h-12 rounded-[3px] border-[var(--jc-line-strong)] bg-[var(--jc-paper)] text-[16px]"
                    {...register("trip.venue")}
                  />
                  <p className="mt-1.5 text-[12px] text-[var(--jc-muted)]">
                    Landing feasibility and local clearances are checked by the operator after inquiry.
                  </p>
                </div>

                {watchedService === "helicopter" && (
                  <div>
                    <span className="block text-[14px] font-medium text-[var(--jc-ink)]">
                      Engine preference
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {ENGINE_CHOICES.map((eng) => {
                        const selected = watch("trip.enginePreference") === eng.value;
                        return (
                          <button
                            key={eng.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setValue("trip.enginePreference", eng.value)}
                            className={cn(
                              "min-h-10 rounded-[3px] border px-3 text-[13px] transition-colors cursor-pointer",
                              selected
                                ? "border-[var(--jc-teal)] bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                                : "border-[var(--jc-line-strong)] bg-[var(--jc-paper)] text-[var(--jc-ink)]"
                            )}
                          >
                            {eng.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <Label
                htmlFor={`${formId}-notes`}
                className="text-[14px] font-medium text-[var(--jc-ink)]"
              >
                Additional notes{" "}
                <span className="font-normal text-[var(--jc-muted)]">(optional)</span>
              </Label>
              <Textarea
                id={`${formId}-notes`}
                maxLength={1200}
                rows={3}
                placeholder="Luggage details, schedule constraints, or questions for Jayant. Please do not include passport numbers or payment card details."
                className="mt-1.5 min-h-24 rounded-[3px] border-[var(--jc-line-strong)] bg-[var(--jc-ivory)] p-3.5 text-[16px] text-[var(--jc-ink)]"
                {...register("trip.notes")}
              />
            </div>
          </div>
        )}
      </div>

      {/* Explicit Unchecked Contact Permission (PRD 10.1 & 10.4) */}
      <div className="mt-6 border-t border-[var(--jc-line-light)] pt-5">
        <div className="flex items-start gap-3">
          <Checkbox
            id={`${formId}-consent`}
            checked={watchedConsent === true}
            onCheckedChange={(checked) =>
              setValue(
                "consents.inquiryContact",
                (checked === true ? true : undefined) as unknown as true,
                { shouldValidate: true }
              )
            }
            aria-invalid={Boolean(errors.consents?.inquiryContact)}
            className="mt-0.5 size-5 shrink-0 rounded-[3px] border-[var(--jc-line-strong)]"
          />
          <Label
            htmlFor={`${formId}-consent`}
            className="block text-[14px] leading-relaxed font-normal text-[var(--jc-ink)] cursor-pointer"
          >
            I agree that {settings.brandName} (Jayant) may contact me by phone or message about this charter inquiry, as described in the{" "}
            <Link
              href="/privacy"
              className="font-medium text-[var(--jc-teal)] underline underline-offset-4"
            >
              Privacy notice
            </Link>
            . Your contact details are not forwarded to an operating partner without your separate permission.
          </Label>
        </div>
        <p className="mt-1.5 min-h-[1.25rem] pl-8 text-[13px] text-[var(--jc-danger)]">
          {errors.consents?.inquiryContact?.message || ""}
        </p>
      </div>

      <div className="mt-4">
        <button
          type="submit"
          disabled={submitState.kind === "submitting"}
          className="jc-btn-teal w-full"
        >
          {submitState.kind === "submitting" ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              <span>Recording your inquiry...</span>
            </>
          ) : (
            <span>Request a callback</span>
          )}
        </button>

        <p className="mt-3 mb-0 text-[13px] text-[var(--jc-muted)]">
          This submits an inquiry only. Aircraft availability, licensed operator details, and pricing are confirmed separately in your written quote.
        </p>
      </div>
    </form>
  );
}
