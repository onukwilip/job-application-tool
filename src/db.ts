import Database from 'better-sqlite3';
import path from 'path';

export type CompanyStatus = 'pending' | 'researched' | 'done' | 'failed';

export interface Company {
  id: number;
  name: string;
  urls: string;       // comma-separated if multiple pages
  job_ad: string;
  infrastructure: string | null;
  cold_email: string | null;
  status: CompanyStatus;
  error: string | null;
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
    job_ad      TEXT NOT NULL DEFAULT '',
    infrastructure TEXT,
    cold_email  TEXT,
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

export function updateInfrastructure(id: number, infrastructure: string): void {
  db.prepare(`
    UPDATE companies
    SET infrastructure = ?, status = 'researched', updated_at = datetime('now')
    WHERE id = ?
  `).run(infrastructure, id);
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

export default db;
