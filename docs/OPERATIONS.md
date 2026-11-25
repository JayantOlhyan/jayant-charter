# Operations, Content Editing & Rollback Guide

## 1. Adding Approved Content Without Code Changes

All structured records live in `content/` and are validated automatically before every build (`npm run validate:content`):

- **Publish a new Case Study:** Add a record to `content/case-studies.json` with `status: "published"` and `anonymizationVerified: true` (never auto-publish private itinerary records). Navigation links, homepage `ConditionalProofSection`, `/case-studies`, `/case-studies/[slug]`, and `/sitemap.xml` automatically activate on the next build.
- **Publish a new Aircraft Example:** Optimize desktop and mobile GLBs into `public/models/v1/`, add responsive posters to `content/media.json`, and append the new record to `content/aircraft.json`. `/aircraft`, `/aircraft/[slug]`, and the homepage 3D Hangar automatically include it.
- **Activate Live Contact Channels (D02 / D03):** Update `content/site-settings.json` (`channels`, `responseHoursConfigured`, `responseHoursLabel`, `featureFlags.showPreviewBanner: false`) and set `OWNER_NOTIFICATION_WEBHOOK_URL` + `OWNER_NOTIFICATION_SECRET` in the server environment.

## 2. Independent Feature & Rollback Switches

Controlled in `content/site-settings.json` under `featureFlags`:

- `enableLive3D`: Set `false` to serve pure high-resolution studio posters across all pages without loading `model-viewer`.
- `enableIntake`: Set `false` to pause `POST /api/inquiries` cleanly (`503`) with a clear maintenance notice.
- `enableSmoothScroll`: Set `false` to disable desktop Lenis smooth scrolling immediately.
- `showPreviewBanner`: Set `false` once live contact channels and legal entity disclosures are finalized.

## 3. Inquiry Storage & Permissioned Handoff

- Inquiries persist atomically to SQLite (`INQUIRY_DB_PATH`, WAL mode) alongside `inquiry_events` and transactional `delivery_jobs` outbox entries.
- Switching to PostgreSQL in production only requires swapping the Drizzle driver in `src/server/db/client.ts` while preserving the identical schema and service interface.
- Onward partner handoff is **never** automatic on form submission; `transitionInquiryStage` requires `recordOnwardConsent: true` before transitioning to `sent_to_partner`.
