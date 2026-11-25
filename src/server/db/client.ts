import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type InquiryDb = BetterSQLite3Database<typeof schema>;

let cachedSqlite: Database.Database | null = null;
let cachedDb: InquiryDb | null = null;
let cachedDbPath: string | null = null;

function ensureTables(sqlite: Database.Database) {
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      submission_key TEXT NOT NULL UNIQUE,
      payload_hash TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone_raw TEXT NOT NULL,
      contact_phone_normalized TEXT NOT NULL,
      contact_email TEXT,
      service TEXT NOT NULL,
      trip_type TEXT,
      trip_json TEXT NOT NULL,
      passengers INTEGER,
      venue TEXT,
      engine_preference TEXT,
      aircraft_preference_id TEXT,
      notes TEXT,
      consent_inquiry_contact INTEGER NOT NULL,
      consent_notice_version TEXT NOT NULL,
      consent_marketing INTEGER NOT NULL DEFAULT 0,
      landing_path TEXT,
      referral_token TEXT,
      utm_json TEXT,
      current_stage TEXT NOT NULL DEFAULT 'received',
      possible_duplicate_of TEXT,
      owner_id TEXT NOT NULL DEFAULT 'jayant',
      crm_reference TEXT,
      handoff_approved_at TEXT,
      onward_consent_recorded_at TEXT,
      retention_until TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_inquiries_phone_submitted
      ON inquiries (contact_phone_normalized, submitted_at);
    CREATE INDEX IF NOT EXISTS idx_inquiries_stage
      ON inquiries (current_stage);

    CREATE TABLE IF NOT EXISTS inquiry_events (
      id TEXT PRIMARY KEY,
      inquiry_id TEXT NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      previous_stage TEXT,
      new_stage TEXT,
      actor TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      reason TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_events_inquiry ON inquiry_events (inquiry_id);

    CREATE TABLE IF NOT EXISTS delivery_jobs (
      id TEXT PRIMARY KEY,
      inquiry_id TEXT NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
      destination_type TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'pending',
      attempt_count INTEGER NOT NULL DEFAULT 0,
      next_attempt_at TEXT,
      last_error_code TEXT,
      acknowledged_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_delivery_inquiry ON delivery_jobs (inquiry_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_state ON delivery_jobs (state);
  `);
}

export function getInquiryDb(): { db: InquiryDb; sqlite: Database.Database } {
  const targetPath =
    process.env.INQUIRY_DB_PATH || path.join(process.cwd(), "data", "jayant-charter.db");

  if (cachedDb && cachedSqlite && cachedDbPath === targetPath) {
    return { db: cachedDb, sqlite: cachedSqlite };
  }

  if (cachedSqlite) {
    cachedSqlite.close();
    cachedSqlite = null;
    cachedDb = null;
  }

  if (targetPath !== ":memory:") {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  }

  const sqlite = new Database(targetPath);
  ensureTables(sqlite);

  cachedSqlite = sqlite;
  cachedDb = drizzle(sqlite, { schema });
  cachedDbPath = targetPath;

  return { db: cachedDb, sqlite };
}

export function resetInquiryDbForTests() {
  if (cachedSqlite) {
    cachedSqlite.close();
  }
  cachedSqlite = null;
  cachedDb = null;
  cachedDbPath = null;
}
