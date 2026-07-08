# Implementation Plan — Job Discovery Extension

This document covers only the **new additions** required for the discovery feature.
The existing `implementation-plan.md` remains unchanged.

---

## What changes

```
cold-email-automator/
├── src/
│   ├── db.ts           ← UPDATE: add job_url to interface + discovery functions
│   ├── prompts.ts      ← UPDATE: append PLATFORMS + DISCOVERY_PROMPT
│   ├── discover.ts     ← NEW
│   ├── migrate.ts      ← NEW (run once to add job_url column to existing DB)
│   ├── research.ts     (unchanged)
│   ├── email.ts        (unchanged)
│   ├── utils.ts        (unchanged)
│   └── index.ts        (unchanged)
├── data/
│   └── companies.db
└── .env                ← UPDATE: add DISCOVERY_CONCURRENCY + BROWSER_USE_MODEL
```

---

## Step 1: Update .env

Add these two lines to your existing `.env` file:

```env
BROWSER_USE_MODEL=gpt-5.4-mini
DISCOVERY_CONCURRENCY=4
```

`DISCOVERY_CONCURRENCY=4` runs all four main platforms simultaneously, one Browser Use session each.
`BROWSER_USE_MODEL` is also used by the existing `research.ts` — update that file's `client.run(task)` call to `client.run(task, { model: process.env.BROWSER_USE_MODEL as string })` at the same time if you haven't already.

---

## Step 2: Migration script (src/migrate.ts)

Run this **once** against your existing database to add the `job_url` column.
It is safe to run multiple times — it checks first and skips if the column already exists.

```typescript
import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'companies.db');
const db = new Database(DB_PATH);

// Check whether job_url already exists
const columns = db.prepare(`PRAGMA table_info(companies)`).all() as Array<{
  name: string;
}>;
const alreadyExists = columns.some(col => col.name === 'job_url');

if (alreadyExists) {
  console.log('job_url column already exists. Nothing to do.');
} else {
  db.exec(`ALTER TABLE companies ADD COLUMN job_url TEXT`);
  console.log('job_url column added successfully.');
}

db.close();
```

---

## Step 3: Update db.ts

Three additions only — the rest of the file stays exactly as it is.

**3a. Add `job_url` to the Company interface**

```typescript
export interface Company {
  id: number;
  name: string;
  urls: string;
  job_url: string | null;   // ← add this line
  job_ad: string;
  infrastructure: string | null;
  cold_email: string | null;
  status: CompanyStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
}
```

**3b. Add `job_url` to the CREATE TABLE statement**

So that fresh installs create the column automatically without needing to run the migration script.
Add `job_url TEXT,` after the `urls` line:

```sql
CREATE TABLE IF NOT EXISTS companies (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  urls          TEXT NOT NULL,
  job_url       TEXT,           -- ← add this line
  job_ad        TEXT NOT NULL DEFAULT '',
  infrastructure TEXT,
  cold_email    TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  error         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
)
```

**3c. Append these new functions at the bottom of db.ts**

After the existing `getSummary` function, add:

```typescript
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
```

---

## Step 4: Append to prompts.ts

Add everything below at the **end** of the existing `prompts.ts` file.
Do not change anything already in the file.

```typescript
// ─── Job Discovery ────────────────────────────────────────────────────────────

export interface DiscoveryPlatform {
  name: string;
  searchUrl: string;
  instructions: string;
}

export const PLATFORMS: DiscoveryPlatform[] = [
  {
    name: 'Wellfound',
    searchUrl: 'https://wellfound.com/jobs?role=DevOps+Engineer&remote=true&salary=120000',
    instructions: `
      Also search separately for "Platform Engineer" and "Cloud Engineer".
      Use the Remote filter and salary filter ($120k+).
      Paginate through at least 3 pages per search term.
    `,
  },
  {
    name: 'Jobgether',
    searchUrl: 'https://jobgether.com/en/jobs?search=DevOps+Engineer&workplaceType=REMOTE',
    instructions: `
      Also search "Platform Engineer" and "Cloud Engineer".
      Filter for fully remote worldwide roles only — skip roles limited to a specific country.
      Paginate through at least 3 pages per search term.
    `,
  },
  {
    name: 'Welcome to the Jungle',
    searchUrl: 'https://www.welcometothejungle.com/en/jobs?query=devops+engineer&refinementList%5Bremote%5D=true',
    instructions: `
      Also search "Platform Engineer" and "Cloud Engineer".
      Look for remote worldwide listings only — skip country-restricted roles.
      Paginate through at least 3 pages per search term.
    `,
  },
  {
    name: 'Work at a Startup',
    searchUrl: 'https://www.workatastartup.com/jobs?remote=true&query=devops+engineer',
    instructions: `
      Also search "platform engineer" and "cloud engineer".
      Include only fully remote worldwide roles.
      Paginate through at least 3 pages per search term.
    `,
  },
  {
    name: 'Lever and Ashby via Google',
    searchUrl: [
      'https://www.google.com/search?q=site:jobs.lever.co',
      '+"devops+engineer"+OR+"platform+engineer"+OR+"cloud+engineer"',
      '+"remote"+"kubernetes"+OR+"google+cloud"+OR+"gcp"',
      '+-"US+only"+-"US+citizens"+-"must+be+based+in"+-"work+authorization"',
    ].join(''),
    instructions: `
      Also run a second Google search replacing site:jobs.lever.co with site:jobs.ashbyhq.com.
      Visit each Google result that looks like a relevant job posting page.
      Skip any that mention country restrictions, citizenship requirements, or "must be eligible to work in".
      Skip any posted more than 14 days ago.
    `,
  },
];

export const DISCOVERY_PROMPT = (platform: DiscoveryPlatform): string => `
You are a job researcher helping find DevOps and Platform Engineering roles.

Go to this URL: ${platform.searchUrl}

Platform-specific instructions:
${platform.instructions}

Your goal: find DevOps Engineer, Platform Engineer, Cloud Platform Engineer, and
Cloud/Infrastructure Engineer roles matching ALL of these criteria:

1. Fully remote worldwide — no country restriction, no citizenship or work permit requirement
2. Requires or strongly prefers: Google Cloud (GCP), Kubernetes, or container orchestration
3. Salary $120,000+ per year if shown — if salary is NOT shown, still include the listing
4. Posted within the last 14 days — if date is not visible, include the listing anyway

For each matching job:
1. Note the company name and the full job posting URL
2. Read the full job description text from the posting page
3. Visit the company's own website to find their homepage or products/services page.
   If you cannot access their main website, use the company's profile page on the job board.

Return ONLY a valid JSON array with no extra text, no markdown, no code blocks.
Each object must have exactly these four keys:

[
  {
    "company_name": "string",
    "job_url": "string — full URL of the job posting",
    "url": "string — company homepage or products page, or job board profile as fallback",
    "job_ad": "string — full job description text"
  }
]

Rules:
- Skip roles that restrict to a specific country, require citizenship, or say "must be eligible to work in X"
- Skip roles posted more than 14 days ago if the date is clearly visible
- Paginate through at least 3 pages of results
- Aim to return 30 to 50 matching jobs from this platform
- Return [] if no matching jobs are found
- Do NOT wrap the JSON in markdown fences or add any explanation
`;
```

---

## Step 5: New file src/discover.ts

Create this file in full:

```typescript
import 'dotenv/config';
import pLimit from 'p-limit';
import Anthropic from '@anthropic-ai/sdk';
import { BrowserUse } from 'browser-use-sdk/v3';
import {
  PLATFORMS,
  DISCOVERY_PROMPT,
  type DiscoveryPlatform,
} from './prompts.js';
import {
  insertDiscoveredJob,
  getSummary,
  type DiscoveredJob,
} from './db.js';

// ─── Clients ─────────────────────────────────────────────────────────────────

const browserUse = new BrowserUse({
  apiKey: process.env.BROWSER_USE_API_KEY!,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const CONCURRENCY = parseInt(process.env.DISCOVERY_CONCURRENCY ?? '4', 10);
const MODEL = (process.env.BROWSER_USE_MODEL ?? 'gpt-5.4-mini') as string;

// ─── JSON parsing with rescue chain ──────────────────────────────────────────

/** Normalises alternative key names the AI might return */
function normalizeJob(item: Record<string, unknown>): DiscoveredJob | null {
  const company_name = String(
    item.company_name ?? item.company ?? item.name ?? item.companyName ?? ''
  );
  const job_url = String(
    item.job_url ?? item.jobUrl ?? item.job_link ?? item.link ?? item.posting_url ?? ''
  );
  const url = String(
    item.url ?? item.company_url ?? item.companyUrl ?? item.website ?? item.homepage ?? ''
  );
  const job_ad = String(
    item.job_ad ?? item.jobAd ?? item.description ?? item.job_description ?? item.content ?? ''
  );

  if (!company_name && !job_url) return null;
  return { company_name, job_url, url, job_ad };
}

/** Extracts the outermost [...] block from a string containing prose */
function extractArrayFromText(text: string): unknown[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Unwraps { "jobs": [...] } style responses */
function unwrapObject(parsed: unknown): unknown[] | null {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  const values = Object.values(parsed as Record<string, unknown>);
  const arrayValue = values.find(v => Array.isArray(v));
  return arrayValue ? (arrayValue as unknown[]) : null;
}

/**
 * Last resort: ask Claude Haiku to extract and reformat the data.
 * Costs ~$0.01-0.05, far cheaper than losing a full Browser Use session.
 */
async function rescueWithClaude(
  raw: string,
  platformName: string
): Promise<DiscoveredJob[]> {
  console.warn(`  [${platformName}] Attempting Claude Haiku rescue...`);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: `Extract all job listings from the text below and return them as a valid JSON array.

Each item must have exactly these keys:
- company_name (string)
- job_url (string, full URL of the job posting)
- url (string, company homepage or products page, or job board profile as fallback)
- job_ad (string, full job description text)

Use empty string "" for any missing field.
Return ONLY the raw JSON array. No markdown, no code blocks, no explanation.
Return [] if no valid jobs are found.

Text:
${raw}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') return [];

    const parsed = JSON.parse(content.text.trim());
    if (!Array.isArray(parsed)) return [];

    console.log(`  [${platformName}] Claude rescue extracted ${parsed.length} jobs`);
    return parsed as DiscoveredJob[];
  } catch (err) {
    console.error(`  [${platformName}] Claude rescue also failed:`, err);
    return [];
  }
}

/**
 * Multi-stage parser: strips fences → tries JSON.parse → extracts embedded array
 * → normalises key names → falls back to Claude Haiku rescue if everything else fails.
 */
async function parseJobs(raw: string, platformName: string): Promise<DiscoveredJob[]> {
  // Stage 1: strip markdown fences
  const cleaned = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```$/m, '')
    .trim();

  let items: unknown[] | null = null;

  // Stage 2: try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      items = parsed;
    } else {
      // Stage 2b: unwrap { "jobs": [...] }
      items = unwrapObject(parsed);
    }
  } catch {
    // Stage 2c: extract array from surrounding prose
    items = extractArrayFromText(cleaned);
  }

  // Stage 3: normalise key names
  if (items && items.length > 0) {
    const normalized = items
      .map(item => normalizeJob(item as Record<string, unknown>))
      .filter((j): j is DiscoveredJob => j !== null);

    if (normalized.length > 0) return normalized;

    console.warn(
      `  [${platformName}] Parsed ${items.length} items but none survived normalisation`
    );
  }

  // Stage 4: Claude rescue
  console.warn(
    `  [${platformName}] Local parsing failed. Raw (first 300 chars):`,
    raw.slice(0, 300)
  );
  return rescueWithClaude(raw, platformName);
}

// ─── Per-platform discovery ───────────────────────────────────────────────────

async function discoverFromPlatform(platform: DiscoveryPlatform): Promise<void> {
  console.log(`\n[START] Searching ${platform.name}...`);

  try {
    const result = await browserUse.run(DISCOVERY_PROMPT(platform), {
      model: MODEL,
    });

    const raw = result.output ?? '[]';
    const jobs = await parseJobs(raw, platform.name); // parseJobs is async
    console.log(`  [${platform.name}] Found ${jobs.length} matching jobs`);

    let inserted = 0;
    let skipped = 0;

    for (const job of jobs) {
      if (!job.company_name || !job.job_url) {
        skipped++;
        continue;
      }

      const wasInserted = insertDiscoveredJob(job);
      if (wasInserted) {
        inserted++;
        console.log(`  + ${job.company_name} (${job.job_url})`);
      } else {
        skipped++;
        console.log(`  ~ Already exists: ${job.company_name}`);
      }
    }

    console.log(
      `  [${platform.name}] Done. Inserted: ${inserted}, Skipped/duplicate: ${skipped}`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  [${platform.name}] Failed: ${message}`);
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting job discovery...');
  console.log(`Platforms: ${PLATFORMS.map(p => p.name).join(', ')}`);
  console.log(`Concurrency: ${CONCURRENCY} | Model: ${MODEL}`);

  const limit = pLimit(CONCURRENCY);

  const tasks = PLATFORMS.map(platform =>
    limit(() => discoverFromPlatform(platform))
  );

  await Promise.allSettled(tasks);

  console.log('\n=== Discovery Summary ===');
  console.table(getSummary());
  console.log('\nRun "npm run start" to generate emails for all new pending companies.');
}

main().catch(console.error);
```

---

## Step 6: Update package.json scripts

Add `migrate` and `discover` to the existing scripts block:

```json
{
  "scripts": {
    "import":   "tsx src/import.ts",
    "migrate":  "tsx src/migrate.ts",
    "discover": "tsx src/discover.ts",
    "start":    "tsx src/index.ts"
  }
}
```

---

## Step 7: Running the full workflow

### First time only (existing DB needs the new column)

```bash
npm run migrate
```

Expected output:
```
job_url column added successfully.
```

### Weekly discovery run

```bash
# Step 1: find new jobs across all platforms
npm run discover

# Step 2: generate cold emails for all newly discovered pending companies
npm run start
```

### Re-running discovery safely

`npm run discover` can be re-run at any time. Already-seen job URLs are deduplicated
by the `jobUrlExists` check in `db.ts`, so no duplicates are ever inserted.
Companies already marked `done` in the DB from previous email runs are also skipped
since their `job_url` will already exist.

---

## Cost estimate per discovery run

| Platform | Browser Use sessions | Approx. cost at gpt-5.4-mini |
|---|---|---|
| Wellfound | 1 (heavy, multi-search) | $0.50 - $1.00 |
| Jobgether | 1 | $0.30 - $0.60 |
| Welcome to the Jungle | 1 | $0.30 - $0.60 |
| Work at a Startup | 1 | $0.30 - $0.60 |
| Lever + Ashby via Google | 1 (visits many pages) | $0.50 - $1.50 |
| **Total per weekly run** | **5 sessions** | **$1.90 - $4.30** |

Claude Haiku rescue calls (if triggered): ~$0.01 - $0.05 each, negligible.