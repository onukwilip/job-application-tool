import Database from 'better-sqlite3';
import path from 'path';

export type CompanyStatus = 'pending' | 'researched' | 'done' | 'failed';

export interface Company {
  id: number;
  name: string;
  urls: string;       // comma-separated if multiple pages
  job_url: string | null;
  job_ad: string;
  infrastructure: string | null;
  cold_email: string | null;
  status: CompanyStatus;
  outreach: string | null;         // JSON string
  outreach_status: string | null;  // null | 'done' | 'failed'
  applied_status: string | null;   // null | 'done' | 'failed' | 'skipped'
  applied_at: string | null;
  applied_error: string | null;
  error: string | null;
  research_bu_session_id: number | null;
  outreach_bu_session_id: number | null;
  created_at: string;
  updated_at: string;
}

const DB_PATH = path.join(process.cwd(), 'data', 'companies.db');
const db = new Database(DB_PATH);

// Create table on first run
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    urls        TEXT NOT NULL,
    job_url     TEXT,
    job_ad      TEXT NOT NULL DEFAULT '',
    infrastructure TEXT,
    cold_email  TEXT,
    outreach    TEXT,
    outreach_status TEXT,
    applied_status TEXT,
    applied_at  TEXT,
    applied_error TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    error       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

export function insertCompany(name: string, urls: string, job_ad: string = ''): void {
  db.prepare(`
    INSERT INTO companies (name, urls, job_ad)
    VALUES (?, ?, ?)
  `).run(name, urls, job_ad);
}

export function getPendingCompanies(): Company[] {
  // Fetch pending AND failed (retry failed ones)
  return db.prepare(`
    SELECT * FROM companies
    WHERE status IN ('pending', 'failed')
    ORDER BY id ASC
  `).all() as Company[];
}

export function updateInfrastructure(
  id: number,
  infrastructure: string,
  sessionId?: number,
): void {
  db.prepare(`
    UPDATE companies
    SET infrastructure         = ?,
        status                 = 'researched',
        research_bu_session_id = COALESCE(?, research_bu_session_id),
        updated_at             = datetime('now')
    WHERE id = ?
  `).run(infrastructure, sessionId ?? null, id);
}

export function updateColdEmail(id: number, cold_email: string): void {
  db.prepare(`
    UPDATE companies
    SET cold_email = ?, status = 'done', updated_at = datetime('now')
    WHERE id = ?
  `).run(cold_email, id);
}

export function markFailed(id: number, error: string): void {
  db.prepare(`
    UPDATE companies
    SET status = 'failed', error = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(error, id);
}

export function getSummary() {
  return db.prepare(`
    SELECT status, COUNT(*) as count
    FROM companies
    GROUP BY status
  `).all();
}

// ─── Outreach types and functions ────────────────────────────────────────────

export interface DecisionMaker {
  name: string;
  title: string;
  linkedin: string | null;
  emails: string[];
}

// ─── Discovery types and functions ───────────────────────────────────────────

export interface DiscoveredJob {
  company_name: string;
  job_url: string;
  url: string;      // company homepage, products page, or job board profile as fallback
  job_ad: string;
}

/** Returns true if this exact job URL is already in the DB */
export function jobUrlExists(job_url: string): boolean {
  const row = db.prepare(`
    SELECT id FROM companies WHERE job_url = ? LIMIT 1
  `).get(job_url);
  return !!row;
}

/**
 * Inserts a discovered job as a new pending row.
 * Returns true if inserted, false if the job_url already existed (deduplication).
 */
export function insertDiscoveredJob(job: DiscoveredJob): boolean {
  if (job.job_url && jobUrlExists(job.job_url)) return false;

  db.prepare(`
    INSERT INTO companies (name, urls, job_url, job_ad, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(job.company_name, job.url, job.job_url ?? null, job.job_ad);

  return true;
}

/** Returns companies with cold emails generated that have not yet been outreach-researched */
export function getCompaniesForOutreach(): Company[] {
  return db.prepare(`
    SELECT * FROM companies
    WHERE status = 'done'
    AND (outreach_status IS NULL OR outreach_status = 'failed')
    ORDER BY id ASC
  `).all() as Company[];
}

/** Saves the array of decision makers as JSON and marks outreach as done */
export function updateOutreach(
  id: number,
  people: DecisionMaker[],
  sessionId?: number,
): void {
  db.prepare(`
    UPDATE companies
    SET outreach               = ?,
        outreach_status        = 'done',
        outreach_bu_session_id = COALESCE(?, outreach_bu_session_id),
        updated_at             = datetime('now')
    WHERE id = ?
  `).run(JSON.stringify(people), sessionId ?? null, id);
}

/** Marks outreach research as failed for this company */
export function markOutreachFailed(id: number, error: string): void {
  db.prepare(`
    UPDATE companies
    SET outreach_status = 'failed', error = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(error, id);
}

// ─── Sends table ─────────────────────────────────────────────────────────────

export interface Send {
  id: number;
  company_id: number;
  email: string;
  name: string;
  sent_at: string;
  message_id: string | null;
  subject: string | null;
  followup_sent_at: string | null;
  followup_message_id: string | null;
}

/**
 * Returns companies that:
 * - Have a generated cold email (status = 'done')
 * - Have outreach contacts with emails (outreach_status = 'done')
 * - Have NOT been emailed yet (no row in sends table)
 */
export function getCompaniesReadyToSend(): Company[] {
  return db.prepare(`
    SELECT * FROM companies
    WHERE status = 'done'
    AND outreach_status = 'done'
    AND outreach IS NOT NULL
    AND id NOT IN (SELECT DISTINCT company_id FROM sends)
    ORDER BY id ASC
  `).all() as Company[];
}

/** Record a sent email. Silently skips if already sent (UNIQUE constraint). */
export function recordSend(
  companyId: number,
  email: string,
  name: string,
  messageId: string,
  subject: string
): void {
  db.prepare(`
    INSERT OR IGNORE INTO sends (company_id, email, name, message_id, subject)
    VALUES (?, ?, ?, ?, ?)
  `).run(companyId, email, name, messageId, subject);
}

/** Get full send history */
export function getSends(): Send[] {
  return db.prepare(`
    SELECT s.*, c.name as company_name
    FROM sends s
    JOIN companies c ON c.id = s.company_id
    ORDER BY s.sent_at DESC
  `).all() as Send[];
}

export interface SendWithCompany extends Send {
  company_name: string;
}

/** Returns sends eligible for follow-up: message_id present, no followup_sent_at, sent >= 3 days ago */
export function getSendsReadyForFollowup(): SendWithCompany[] {
  return db.prepare(`
    SELECT s.*, c.name as company_name
    FROM sends s
    JOIN companies c ON c.id = s.company_id
    WHERE s.message_id IS NOT NULL
      AND s.followup_sent_at IS NULL
      AND s.sent_at <= datetime('now', '-3 days')
    ORDER BY s.sent_at ASC
  `).all() as SendWithCompany[];
}

/** Record a follow-up email as sent */
export function recordFollowup(sendId: number, followupMessageId: string): void {
  db.prepare(`
    UPDATE sends
    SET followup_sent_at = datetime('now'),
        followup_message_id = ?
    WHERE id = ?
  `).run(followupMessageId, sendId);
}

// ─── Application tracking ─────────────────────────────────────────────────────

/**
 * Returns companies that:
 * - Have a cold email generated (status = 'done')
 * - Have a job_url to apply to
 * - Have NOT been successfully applied to yet
 */
export function getCompaniesReadyToApply(): Company[] {
  return db.prepare(`
    SELECT * FROM companies
    WHERE status = 'done'
    AND job_url IS NOT NULL
    AND (applied_status IS NULL OR applied_status = 'failed')
    ORDER BY id ASC
  `).all() as Company[];
}

export function markApplied(id: number): void {
  db.prepare(`
    UPDATE companies
    SET applied_status = 'done', applied_at = datetime('now'),
        applied_error = NULL, updated_at = datetime('now')
    WHERE id = ?
  `).run(id);
}

export function markApplyFailed(id: number, error: string): void {
  db.prepare(`
    UPDATE companies
    SET applied_status = 'failed', applied_error = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(error, id);
}

export function markApplySkipped(id: number, reason: string): void {
  db.prepare(`
    UPDATE companies
    SET applied_status = 'skipped', applied_error = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(reason, id);
}

/** Breakdown of applied_status among companies that have a job_url */
export function getApplyStats() {
  return db.prepare(`
    SELECT applied_status, COUNT(*) as count
    FROM companies
    WHERE job_url IS NOT NULL
    GROUP BY applied_status
  `).all();
}

// ─── LinkedIn opens tracking ──────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS linkedin_opens (
    url        TEXT PRIMARY KEY,
    opened_at  TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

/** Returns the set of LinkedIn URLs already opened in a previous run */
export function getOpenedLinkedinUrls(): Set<string> {
  const rows = db.prepare(`SELECT url FROM linkedin_opens`).all() as { url: string }[];
  return new Set(rows.map((r) => r.url));
}

/** Records a LinkedIn URL as opened. Silently skips if already recorded. */
export function recordLinkedinOpen(url: string): void {
  db.prepare(`INSERT OR IGNORE INTO linkedin_opens (url) VALUES (?)`).run(url);
}

export default db;
