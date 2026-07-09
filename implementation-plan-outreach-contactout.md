# Implementation Plan — Outreach Research (ContactOut)

This document covers only the **new additions** required for the outreach feature.
It sits alongside the existing `implementation-plan.md` and `implementation-plan-discovery.md`.

---

## What changes

```
cold-email-automator/
├── src/
│   ├── db.ts              ← UPDATE: add outreach types + 4 new functions
│   ├── outreach.ts        ← NEW
│   ├── migrate-outreach.ts ← NEW (run once to add outreach columns)
│   ├── discover.ts        (unchanged)
│   ├── research.ts        (unchanged)
│   ├── email.ts           (unchanged)
│   ├── utils.ts           (unchanged)
│   └── index.ts           (unchanged)
└── .env                   ← UPDATE: add CONTACTOUT_API_KEY
```

---

## Step 1: Update .env

Add this line to your existing `.env` file:

```env
CONTACTOUT_API_KEY=your_contactout_key_here
```

---

## Step 2: Migration script (src/migrate-outreach.ts)

Run this **once** to add the two new columns.
Safe to run multiple times — it checks before adding.

```typescript
import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'companies.db');
const db = new Database(DB_PATH);

const columns = db.prepare(`PRAGMA table_info(companies)`).all() as Array<{
  name: string;
}>;
const names = columns.map(c => c.name);

if (!names.includes('outreach')) {
  db.exec(`ALTER TABLE companies ADD COLUMN outreach TEXT`);
  console.log('Added: outreach column (stores JSON array of decision makers)');
} else {
  console.log('outreach column already exists. Skipping.');
}

if (!names.includes('outreach_status')) {
  db.exec(`ALTER TABLE companies ADD COLUMN outreach_status TEXT`);
  console.log('Added: outreach_status column');
} else {
  console.log('outreach_status column already exists. Skipping.');
}

db.close();
console.log('Migration complete.');
```

---

## Step 3: Update db.ts

Four additions only. The rest of the file stays exactly as it is.

**3a. Add `outreach` and `outreach_status` to the Company interface**

```typescript
export interface Company {
  id: number;
  name: string;
  urls: string;
  job_url: string | null;
  job_ad: string;
  infrastructure: string | null;
  cold_email: string | null;
  status: CompanyStatus;
  outreach: string | null;         // ← add this line (JSON string)
  outreach_status: string | null;  // ← add this line (null | 'done' | 'failed')
  error: string | null;
  created_at: string;
  updated_at: string;
}
```

**3b. Add `outreach` and `outreach_status` to the CREATE TABLE statement**

So fresh installs create these columns automatically without needing the migration script.
Add both lines after the `cold_email` line:

```sql
CREATE TABLE IF NOT EXISTS companies (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  urls          TEXT NOT NULL,
  job_url       TEXT,
  job_ad        TEXT NOT NULL DEFAULT '',
  infrastructure TEXT,
  cold_email    TEXT,
  outreach      TEXT,             -- ← add this line
  outreach_status TEXT,           -- ← add this line
  status        TEXT NOT NULL DEFAULT 'pending',
  error         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
)
```

**3c. Add the DecisionMaker interface just before the existing discovery types block**

```typescript
// ─── Outreach types and functions ────────────────────────────────────────────

export interface DecisionMaker {
  name: string;
  title: string;
  linkedin: string | null;
  emails: string[];
}
```

**3d. Append these three new functions at the bottom of db.ts**

After the existing `insertDiscoveredJob` function, add:

```typescript
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
export function updateOutreach(id: number, people: DecisionMaker[]): void {
  db.prepare(`
    UPDATE companies
    SET outreach = ?, outreach_status = 'done', updated_at = datetime('now')
    WHERE id = ?
  `).run(JSON.stringify(people), id);
}

/** Marks outreach research as failed for this company */
export function markOutreachFailed(id: number, error: string): void {
  db.prepare(`
    UPDATE companies
    SET outreach_status = 'failed', error = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(error, id);
}
```

---

## Step 4: New file src/outreach.ts

Create this file in full:

```typescript
import 'dotenv/config';
import pLimit from 'p-limit';
import {
  getCompaniesForOutreach,
  updateOutreach,
  markOutreachFailed,
  getSummary,
  type Company,
  type DecisionMaker,
} from './db.js';

// ─── Config ──────────────────────────────────────────────────────────────────

const CONTACTOUT_API_KEY = process.env.CONTACTOUT_API_KEY!;
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '5', 10);

// Titles to search for — technical and founding roles only
const TARGET_TITLES = [
  'CTO',
  'Chief Technology Officer',
  'VP Engineering',
  'VP of Engineering',
  'Vice President of Engineering',
  'Head of Engineering',
  'Head of DevOps',
  'Head of Cloud',
  'Head of Infrastructure',
  'Head of Platform',
  'Platform Engineering Lead',
  'DevOps Lead',
  'Infrastructure Lead',
  'Engineering Manager',
  'Co-Founder',
  'CEO',
];

// Seniority levels to include
const TARGET_SENIORITY = [
  'C Level',
  'Vice President',
  'Director',
  'Owner',
  'Partner',
];

// ─── ContactOut API response types ───────────────────────────────────────────

interface ContactOutProfile {
  full_name: string;
  title: string;
  contact_info?: {
    work_emails?: string[];
    personal_emails?: string[];
    emails?: string[];
  };
}

interface ContactOutResponse {
  status_code: number;
  message?: string;
  profiles?: Record<string, ContactOutProfile> | [];
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Extracts the bare domain from a company URL string.
 * Handles comma or space separated multiple URLs by taking the first one.
 * Examples:
 *   "https://www.twingate.com/about https://www.twingate.com/product" → "twingate.com"
 *   "https://broker.com, https://broker.com/docs"                     → "broker.com"
 */
function extractDomain(url: string): string {
  try {
    const firstUrl = url.split(/[\s,]+/)[0].trim();
    const withProtocol = firstUrl.startsWith('http')
      ? firstUrl
      : `https://${firstUrl}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    // Fallback: strip protocol and www manually
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split(',')[0]
      .trim();
  }
}

// ─── Core function ────────────────────────────────────────────────────────────

async function findDecisionMakers(company: Company): Promise<void> {
  const domain = extractDomain(company.urls);
  console.log(`\n[OUTREACH] ${company.name} (domain: ${domain})`);

  if (!domain) {
    console.warn(`  Skipping ${company.name} — could not extract domain from: ${company.urls}`);
    markOutreachFailed(company.id, 'Could not extract domain from urls');
    return;
  }

  try {
    const response = await fetch('https://api.contactout.com/v1/people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'token': CONTACTOUT_API_KEY,
      },
      body: JSON.stringify({
        domain: [domain],
        job_title: TARGET_TITLES,
        seniority: TARGET_SENIORITY,
        current_titles_only: true,
        reveal_info: true,
        data_types: ['work_email', 'personal_email'],
      }),
    });

    if (!response.ok) {
      throw new Error(`ContactOut API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as ContactOutResponse;

    // No profiles found (API returns [] instead of {} when empty)
    if (!data.profiles || Array.isArray(data.profiles)) {
      console.log(`  No decision makers found for ${company.name}`);
      updateOutreach(company.id, []);
      return;
    }

    // Map ContactOut profile shape → DecisionMaker shape
    const people: DecisionMaker[] = Object.entries(data.profiles).map(
      ([linkedinUrl, profile]) => ({
        name: profile.full_name,
        title: profile.title,
        linkedin: linkedinUrl || null,
        emails: [
          ...(profile.contact_info?.work_emails ?? []),
          ...(profile.contact_info?.personal_emails ?? []),
          ...(profile.contact_info?.emails ?? []),
        ].filter((e, i, arr) => Boolean(e) && arr.indexOf(e) === i), // deduplicate
      })
    );

    console.log(`  Found ${people.length} decision maker(s) for ${company.name}`);
    people.forEach(p =>
      console.log(
        `  - ${p.title}: ${p.name} | ${p.emails.length} email(s) | ${p.linkedin ?? 'no LinkedIn'}`
      )
    );

    updateOutreach(company.id, people);
    console.log(`  [DONE] ${company.name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markOutreachFailed(company.id, message);
    console.error(`  [FAILED] ${company.name}: ${message}`);
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  if (!CONTACTOUT_API_KEY) {
    console.error('CONTACTOUT_API_KEY is not set in .env');
    process.exit(1);
  }

  console.log('Starting outreach research via ContactOut People Search API...');
  console.log(`Concurrency: ${CONCURRENCY}`);

  const companies = getCompaniesForOutreach();
  console.log(`Companies to research: ${companies.length}`);

  if (companies.length === 0) {
    console.log('No companies ready for outreach research.');
    console.log('Run "npm run start" first to generate cold emails.');
    return;
  }

  const limit = pLimit(CONCURRENCY);
  const tasks = companies.map(c => limit(() => findDecisionMakers(c)));
  await Promise.allSettled(tasks);

  console.log('\n=== Outreach Research Summary ===');
  console.table(getSummary());
}

main().catch(console.error);
```

---

## Step 5: Update package.json scripts

Add `migrate-outreach` and `outreach` to the existing scripts block:

```json
{
  "scripts": {
    "import":           "tsx src/import.ts",
    "migrate":          "tsx src/migrate.ts",
    "migrate-outreach": "tsx src/migrate-outreach.ts",
    "discover":         "tsx src/discover.ts",
    "start":            "tsx src/index.ts",
    "outreach":         "tsx src/outreach.ts"
  }
}
```

---

## Step 6: Running the full pipeline

### First time only (existing DB needs the new columns)

```bash
npm run migrate-outreach
```

Expected output:
```
Added: outreach column (stores JSON array of decision makers)
Added: outreach_status column
Migration complete.
```

### Full weekly workflow

```bash
# 1. Find new job postings across all platforms
npm run discover

# 2. Research company infrastructure and generate cold emails
npm run start

# 3. Find decision maker contact details for completed companies
npm run outreach
```

### Re-running outreach safely

`npm run outreach` can be re-run at any time. It queries only companies where
`status = 'done'` and `outreach_status IS NULL OR outreach_status = 'failed'`,
so already-completed rows are never re-processed.

---

## What the outreach column looks like in the DB

After a successful run, the `outreach` column contains a JSON array like this:

```json
[
  {
    "name": "Jane Smith",
    "title": "CTO",
    "linkedin": "https://linkedin.com/in/janesmith",
    "emails": ["jane@twingate.com"]
  },
  {
    "name": "Tom Lee",
    "title": "VP of Engineering",
    "linkedin": "https://linkedin.com/in/tomlee",
    "emails": ["tom@twingate.com", "tom.lee@gmail.com"]
  }
]
```

To read it back in TypeScript:

```typescript
const people: DecisionMaker[] = JSON.parse(company.outreach ?? '[]');
```

---

## Cost estimate per outreach run

ContactOut pricing:
- 1 search credit per profile returned
- 1 email credit per profile where an email is found
- If no profiles are found for a company: 0 credits charged

For 50 companies, assuming an average of 2 matching decision makers per company
and emails found for 60% of them:

- Search credits: 50 companies × 2 profiles = ~100 search credits
- Email credits: 100 profiles × 60% = ~60 email credits
- Total: ~160 credits per run

No Browser Use tokens. No Claude tokens.

---

## Honest limitation

ContactOut's People Search coverage varies by company size. For well-indexed
companies (Series A and above, 50+ employees), results are generally good.
For very early-stage startups (under 20 employees, recently founded), the domain
may return few or no results. In those cases, `outreach` will be set to `[]`
and `outreach_status` to `done` — the company is still fully usable, just
without pre-filled contact details.