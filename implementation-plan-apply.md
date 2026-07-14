# Implementation Plan — Job Application Script

Visits each job URL in the DB and submits the application on Prince's behalf
using Browser Use, with the cold email body as the cover letter.

---

## What changes

```
cold-email-automator/
├── src/
│   ├── apply.ts             ← NEW
│   └── migrate-apply.ts     ← NEW (run once)
└── .env                     ← UPDATE
```

---

## Step 1: Update .env

```env
# Personal details for form filling
APPLICANT_FIRST_NAME=Prince
APPLICANT_LAST_NAME=Onukwili
APPLICANT_EMAIL=onukwilip@gmail.com
APPLICANT_PHONE=++2349168572271
APPLICANT_CITY=Lagos
APPLICANT_COUNTRY=Nigeria
APPLICANT_LINKEDIN=https://www.linkedin.com/in/prince-onukwili-a82143233
APPLICANT_PORTFOLIO=https://www.linkedin.com/in/prince-onukwili-a82143233/details/projects/
APPLICANT_WEBSITE=https://www.linkedin.com/in/prince-onukwili-a82143233
APPLICANT_GENDER=Male

# Salary expectations (used if the form requires it)
APPLICANT_SALARY='N/A'
APPLICANT_SALARY_MIN='N/A'
APPLICANT_SALARY_MAX='N/A'
RESUME_URL=https://drive.usercontent.google.com/download?id=1pykzDb3FvM3UifGdeKHN7LK9QvrkzLMJ&export=download
APPLY_BU_MODEL=bu-mini
APPLY_LIMIT=5
```

---

## Step 2: src/migrate-apply.ts

```typescript
import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data', 'companies.db'));

const columns = (db.prepare(`PRAGMA table_info(companies)`)
  .all() as Array<{ name: string }>)
  .map(c => c.name);

if (!columns.includes('applied_status')) {
  db.exec(`ALTER TABLE companies ADD COLUMN applied_status TEXT`);
  console.log('Added: applied_status (null | done | failed | skipped)');
}
if (!columns.includes('applied_at')) {
  db.exec(`ALTER TABLE companies ADD COLUMN applied_at TEXT`);
  console.log('Added: applied_at');
}
if (!columns.includes('applied_error')) {
  db.exec(`ALTER TABLE companies ADD COLUMN applied_error TEXT`);
  console.log('Added: applied_error');
}

db.close();
console.log('Migration complete.');
```

---

## Step 3: New db.ts functions (append to bottom)

```typescript
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
```

---

## Step 4: src/apply.ts

```typescript
import 'dotenv/config';
import pLimit from 'p-limit';
import Anthropic from '@anthropic-ai/sdk';
import { BrowserUse } from 'browser-use-sdk/v3';
import {
  getCompaniesReadyToApply,
  markApplied,
  markApplyFailed,
  markApplySkipped,
  getSummary,
  type Company,
} from './db.js';

// ─── Clients ─────────────────────────────────────────────────────────────────

const browserUse = new BrowserUse({ apiKey: process.env.BROWSER_USE_API_KEY! });
const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── Config ───────────────────────────────────────────────────────────────────

const BU_MODEL   = (process.env.APPLY_BU_MODEL ?? 'minimax-m3') as string;
const APPLY_LIMIT = process.env.APPLY_LIMIT
  ? parseInt(process.env.APPLY_LIMIT, 10)
  : undefined;

// Keep concurrency low — form filling needs careful pacing
// Running 2 sessions at once is the safe ceiling
const CONCURRENCY = 2;

const APPLICANT = {
  firstName:  process.env.APPLICANT_FIRST_NAME  ?? 'Prince',
  lastName:   process.env.APPLICANT_LAST_NAME   ?? 'Onukwili',
  email:      process.env.APPLICANT_EMAIL        ?? '',
  phone:      process.env.APPLICANT_PHONE        ?? '',
  city:       process.env.APPLICANT_CITY         ?? 'Lagos',
  country:    process.env.APPLICANT_COUNTRY      ?? 'Nigeria',
  linkedin:   process.env.APPLICANT_LINKEDIN     ?? '',
  website:    process.env.APPLICANT_PORTFOLIO      ?? process.env.APPLICANT_LINKEDIN ?? '',
  gender:     process.env.APPLICANT_GENDER       ?? 'Male',
  salary:     process.env.APPLICANT_SALARY       ?? '120000',
  salaryMin:  process.env.APPLICANT_SALARY_MIN   ?? '100000',
  salaryMax:  process.env.APPLICANT_SALARY_MAX   ?? '150000',
  resumeUrl:  process.env.RESUME_URL             ?? '',
};

// ─── Cover letter extraction ──────────────────────────────────────────────────

/**
 * Extracts the cover letter body from a cold email.
 * Splits at the line starting with "Hi NAME" and returns everything after it.
 * Falls back to the full email if the greeting line is not found.
 *
 * Note: Unicode bold characters (𝗯𝗼𝗹𝗱) will appear as-is in the form field
 * since stripUnicodeBold is not implemented in this version.
 */
function extractCoverLetter(coldEmail: string): string {
  const parts = coldEmail.split(/Hi NAME[.,\s\.\.\.]/);
  return parts.length > 1 ? parts[1].trim() : coldEmail.trim();
}

// ─── BU prompt ────────────────────────────────────────────────────────────────

function buildApplyPrompt(jobUrl: string, coverLetterBody: string): string {
  return `
You are submitting a job application on behalf of ${APPLICANT.firstName} ${APPLICANT.lastName}.

Visit this URL and complete the application form:
${jobUrl}

════════════════════════════════════════
PERSONAL DETAILS — use EXACTLY these values
════════════════════════════════════════
First name:    ${APPLICANT.firstName}
Last name:     ${APPLICANT.lastName}
Full name:     ${APPLICANT.firstName} ${APPLICANT.lastName}
Email:         ${APPLICANT.email}
Phone:         ${APPLICANT.phone}
City:          ${APPLICANT.city}
Country:       ${APPLICANT.country}
LinkedIn URL:  ${APPLICANT.linkedin}
Website URL:   ${APPLICANT.website}
Portfolio:     ${APPLICANT.linkedin}

════════════════════════════════════════
RESUME / CV
════════════════════════════════════════
Download this file and upload it as the resume or CV attachment:
${APPLICANT.resumeUrl}

════════════════════════════════════════
COVER LETTER
════════════════════════════════════════
If the form has a cover letter text field, paste this text exactly:

${coverLetterBody}

If the form has a cover letter FILE upload instead of a text field,
create a plain text file with the above content and upload it.

════════════════════════════════════════
STANDARD ANSWERS FOR SPECIFIC FIELDS
════════════════════════════════════════

Gender:
→ Select "${APPLICANT.gender}" or the closest available option

Race / Ethnicity:
→ Select "Decline to self-identify" or "I prefer not to answer"
  or the equivalent option. If that option does not exist, select "Other".

Veteran status:
→ Select "I am not a veteran" or "Decline to self-identify" or "No"

Disability status:
→ Select "No, I don't have a disability" or "Decline to self-identify"

Work authorization questions — answer ALL of these as YES:
→ "Are you authorized to work in [any country]?"       → YES / Yes
→ "Do you require visa sponsorship?"                   → YES / Yes
→ "Will you in the future require visa sponsorship?"   → YES / Yes
→ "Are you legally authorized to work in [country]?"   → YES / Yes
→ "Are you authorized to work where you reside?"       → YES / Yes

Salary / compensation:
→ If a single number is required: ${APPLICANT.salary}
→ If a range is required: ${APPLICANT.salaryMin} to ${APPLICANT.salaryMax}
→ If a currency selector appears: choose USD

"How did you hear about us?" / "Referral source":
→ Select "LinkedIn" if available, otherwise "Online" or "Job board"

Years of experience:
→ If required, enter 3

Location / remote preference:
→ If asked whether you want remote: select "Remote" or "Yes"
→ If asked for preferred location: enter "Remote — Lagos, Nigeria"

════════════════════════════════════════
SUBMISSION
════════════════════════════════════════
After filling ALL fields, click the final Submit button.

If the form requires creating an account BEFORE showing the application:
→ Do NOT create an account. Stop and report failure.

If a required field has no suitable answer from the information above:
→ Leave it blank if the form allows it.
→ If the field is mandatory and you have no value, report it in issues.

════════════════════════════════════════
RETURN FORMAT
════════════════════════════════════════
Return ONLY a valid JSON object — no markdown, no explanation:

{
  "success": true or false,
  "message": "one sentence describing what happened",
  "fields_filled": ["list of field names you filled in"],
  "issues": ["any fields you could not fill or problems encountered"],
  "submitted_url": "the URL where the form was on final submission"
}
`;
}

// ─── Result parsing (same rescue chain pattern as discover.ts) ────────────────

interface ApplyResult {
  success: boolean;
  message: string;
  fields_filled?: string[];
  issues?: string[];
  submitted_url?: string;
}

async function parseResult(
  raw: string,
  companyName: string
): Promise<ApplyResult | null> {
  const cleaned = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```$/m, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.success === 'boolean') return parsed as ApplyResult;
  } catch { /* fall through */ }

  // Try extracting a JSON object from prose
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (typeof parsed.success === 'boolean') return parsed as ApplyResult;
    } catch { /* fall through */ }
  }

  // Haiku rescue
  console.warn(`  [${companyName}] Haiku rescue for apply result...`);
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Extract the application result from this text and return a JSON object with:
success (boolean), message (string), issues (array of strings).
Return ONLY the raw JSON, no markdown.

Text:
${raw.slice(0, 2000)}`,
      }],
    });
    const content = msg.content[0];
    if (content.type !== 'text') return null;
    const rescueCleaned = content.text
      .replace(/^```json\s*/im, '')
      .replace(/\s*```$/m, '')
      .trim();
    return JSON.parse(rescueCleaned) as ApplyResult;
  } catch {
    return null;
  }
}

// ─── Per-company application ──────────────────────────────────────────────────

async function applyToCompany(company: Company): Promise<void> {
  console.log(`\n[APPLY] ${company.name} → ${company.job_url}`);

  if (!APPLICANT.resumeUrl) {
    const msg = 'RESUME_URL not set in .env';
    markApplyFailed(company.id, msg);
    console.error(`  ✗ ${msg}`);
    return;
  }

  if (!company.cold_email) {
    markApplySkipped(company.id, 'No cold email generated');
    console.warn(`  Skipped — no cold email in DB`);
    return;
  }

  const coverLetter = extractCoverLetter(company.cold_email);
  const prompt      = buildApplyPrompt(company.job_url!, coverLetter);

  try {
    const result = await browserUse.run(prompt, { model: BU_MODEL });

    const rawOutput = result.output;
    const raw = typeof rawOutput === 'string'
      ? rawOutput
      : JSON.stringify(rawOutput ?? {});

    const parsed = await parseResult(raw, company.name);

    if (!parsed) {
      markApplyFailed(company.id, 'Could not parse BU output');
      console.error(`  ✗ Could not parse result from BU`);
      console.error(`    Raw (first 300):`, raw.slice(0, 300));
      return;
    }

    if (parsed.success) {
      markApplied(company.id);
      console.log(`  ✓ Applied successfully — ${parsed.message}`);
      if (parsed.fields_filled?.length) {
        console.log(`    Fields filled: ${parsed.fields_filled.join(', ')}`);
      }
    } else {
      // Determine if this is a permanent skip or a retriable failure
      const isSkip = parsed.message?.toLowerCase().includes('account creation')
        || parsed.message?.toLowerCase().includes('no form found')
        || parsed.message?.toLowerCase().includes('already applied');

      if (isSkip) {
        markApplySkipped(company.id, parsed.message);
        console.warn(`  ↷ Skipped — ${parsed.message}`);
      } else {
        markApplyFailed(company.id, parsed.message);
        console.error(`  ✗ Failed — ${parsed.message}`);
      }

      if (parsed.issues?.length) {
        console.warn(`    Issues: ${parsed.issues.join(' | ')}`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markApplyFailed(company.id, message);
    console.error(`  ✗ BU session error: ${message}`);
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting job application run...');
  console.log(`BU model:   ${BU_MODEL}`);
  console.log(`Applicant:  ${APPLICANT.firstName} ${APPLICANT.lastName} <${APPLICANT.email}>`);
  console.log(`Resume URL: ${APPLICANT.resumeUrl || 'NOT SET — will fail'}`);
  console.log(`Concurrency: ${CONCURRENCY}\n`);

  const allCompanies = getCompaniesReadyToApply();
  const companies    = APPLY_LIMIT
    ? allCompanies.slice(0, APPLY_LIMIT)
    : allCompanies;

  console.log(`Ready to apply: ${allCompanies.length} | This run: ${companies.length}`);

  if (companies.length === 0) {
    console.log('Nothing to apply to. Run "npm run start" first to generate cold emails.');
    return;
  }

  const limit = pLimit(CONCURRENCY);
  const tasks = companies.map(c => limit(() => applyToCompany(c)));
  await Promise.allSettled(tasks);

  console.log('\n=== Application Summary ===');
  console.table(getSummary());

  // Show breakdown of apply statuses specifically
  console.log('\nApplication statuses:');
  const db = (await import('./db.js')).default;
  const applyStats = db.prepare(`
    SELECT applied_status, COUNT(*) as count
    FROM companies
    WHERE job_url IS NOT NULL
    GROUP BY applied_status
  `).all();
  console.table(applyStats);
}

main().catch(console.error);
```

---

## Step 5: Update package.json

```json
{
  "scripts": {
    "import":           "tsx src/import.ts",
    "migrate":          "tsx src/migrate.ts",
    "migrate-outreach": "tsx src/migrate-outreach.ts",
    "migrate-sends":    "tsx src/migrate-sends.ts",
    "migrate-apply":    "tsx src/migrate-apply.ts",
    "discover":         "tsx src/discover.ts",
    "start":            "tsx src/index.ts",
    "outreach":         "tsx src/outreach.ts",
    "get-email":        "tsx src/get-email.ts",
    "send-email":       "tsx src/send-email.ts",
    "apply":            "tsx src/apply.ts"
  }
}
```

---

## Step 6: Running it

```bash
# One-time migrations
npm run migrate-apply

# Run pipeline first
npm run discover
npm run start
npm run get-email   # optional, for email outreach in parallel

# Apply to 5 companies first as a test
APPLY_LIMIT=5 npm run apply

# Check results in DB Browser:
# SELECT name, job_url, applied_status, applied_error FROM companies
# WHERE job_url IS NOT NULL ORDER BY applied_at DESC;

# Apply to remaining
npm run apply
```

---

## applied_status values

| Value | Meaning |
|---|---|
| `null` | Not yet attempted |
| `done` | Application submitted successfully |
| `failed` | BU attempted but something went wrong — will retry next run |
| `skipped` | Permanent skip (required account creation, no form found, etc.) |

---

## Known limitation

The Unicode bold characters in the cover letter (𝗯𝗼𝗹𝗱 𝘁𝗲𝘅𝘁) will appear
as-is in the form's cover letter field. Most ATS systems handle Unicode
gracefully, but if you see garbled characters in submitted applications,
adding the `stripUnicodeBold` function from the earlier plan to
`extractCoverLetter` will fix it.

---

## Cost estimate

Each BU session for form filling: ~2-8 minutes depending on form complexity.
At MiniMax M3 pricing (cheapest BU Cloud model): ~$0.05-0.20 per application.
For 66 companies: ~$3-13 total from your BU credits.