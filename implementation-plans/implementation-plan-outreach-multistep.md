# Implementation Plan — Outreach v2 (BU + Hunter + Anymail Finder)

This is a **separate script** from the existing `outreach.ts`.
It does not modify or replace any existing file.

---

## What this script does

For each company with `status = 'done'` and no outreach data yet:

1. **Browser Use (MiniMax M3)** visits the company website and searches for
   technical decision makers (CTO, VP Engineering, Head of DevOps/Cloud, CEO/Co-Founder)
   returning name, title, LinkedIn URL, and email where discoverable
2. **Parse + normalize** the BU output using the same rescue chain from `discover.ts`,
   with Claude Haiku as a last-resort reformatter
3. **For each person without an email:**
   - Try **Hunter.io Email Finder** (name + domain) — 1 credit only if found
   - If still empty and LinkedIn URL exists → **Anymail Finder LinkedIn** endpoint — 2 credits if found
   - If still empty and no LinkedIn URL → **Anymail Finder Name** endpoint — 2 credits if found
4. Store the enriched people array in the existing `outreach` column as JSON
5. Set `outreach_status = 'done'`

---

## New files only

```
cold-email-automator/
├── src/
│   └── get-email.ts     ← NEW (run with `npm run get-email`)
└── .env                 ← UPDATE: add ANYMAIL_FINDER_API_KEY if not already present
```

All other files (db.ts, outreach.ts, discover.ts, etc.) remain unchanged.
This script reuses the existing `outreach` and `outreach_status` columns
added by `migrate-outreach.ts`.

---

## Step 1: Verify the MiniMax M3 model string

Before writing any code, open your Browser Use Cloud dashboard,
start a test session, and select MiniMax M3 from the model dropdown.
Check the session detail or `.bu_execution_state.json` to find the exact
model identifier string (e.g. `minimax-m3`, `minimax/m3`, etc.).

Add it to `.env`:

```env
# Already exists:
BROWSER_USE_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
HUNTER_API_KEY=your_key

# Add if not already present:
ANYMAIL_FINDER_API_KEY=your_key

# Set the verified model string from your BU dashboard:
OUTREACH_BU_MODEL=minimax-m3
```

---

## Step 2: src/get-email.ts (full file)

```typescript
import 'dotenv/config';
import pLimit from 'p-limit';
import Anthropic from '@anthropic-ai/sdk';
import { BrowserUse } from 'browser-use-sdk/v3';
import {
  getCompaniesForOutreach,
  updateOutreach,
  markOutreachFailed,
  getSummary,
  type Company,
  type DecisionMaker,
} from './db.js';

// ─── Clients ─────────────────────────────────────────────────────────────────

const browserUse  = new BrowserUse({ apiKey: process.env.BROWSER_USE_API_KEY! });
const anthropic   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const BU_MODEL          = (process.env.OUTREACH_BU_MODEL   ?? 'minimax-m3') as string;
const HUNTER_KEY        = process.env.HUNTER_API_KEY;
const ANYMAIL_KEY       = process.env.ANYMAIL_FINDER_API_KEY;
const CONCURRENCY       = parseInt(process.env.CONCURRENCY ?? '3', 10);
const OUTREACH_LIMIT    = process.env.OUTREACH_LIMIT
  ? parseInt(process.env.OUTREACH_LIMIT, 10)
  : undefined;

// ─── Domain extraction (same helper used in outreach.ts) ─────────────────────

function extractDomain(url: string): string {
  try {
    const first       = url.split(/[\s,]+/)[0].trim();
    const withProto   = first.startsWith('http') ? first : `https://${first}`;
    const parsed      = new URL(withProto);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
  }
}

// ─── BU prompt ───────────────────────────────────────────────────────────────

function buildOutreachPrompt(companyName: string, companyUrl: string): string {
  return `
You are a research assistant helping find technical decision makers at a company.

Company: ${companyName}
Website: ${companyUrl}

Your goal: find the following people at this company:
- CTO (Chief Technology Officer)
- VP of Engineering / Vice President of Engineering
- Head of Engineering / Head of DevOps / Head of Cloud / Head of Infrastructure / Head of Platform
- Co-Founder or CEO (only include if the company appears to have fewer than 100 employees)

For each person you find:
1. Check the company's /about or /team page first
2. Search Google for "[Company Name] [Title] LinkedIn" to find their LinkedIn profile URL
3. Look for their email address on GitHub profiles, speaker bios, personal websites, or contact pages

Return ONLY a valid JSON array. No markdown, no code blocks, no explanation, no text before or after.

Each object must have exactly these four keys:
[
  {
    "name": "string — full name, e.g. Jane Smith",
    "title": "string — their exact role",
    "linkedin": "string — full LinkedIn URL, or null if not found",
    "email": "string — email address if found, or null if not found"
  }
]

Rules:
- Only include people you actually found evidence for — do not guess or invent names
- Return fewer than 5 people if you cannot find them all
- Return [] if you cannot find any relevant people at this company
- Do NOT wrap JSON in markdown fences
`;
}

// ─── BU output normalisation (mirrors discover.ts parseJobs) ─────────────────

interface RawPerson {
  name?: string;
  full_name?: string;
  fullName?: string;
  title?: string;
  position?: string;
  role?: string;
  linkedin?: string;
  linkedin_url?: string;
  linkedinUrl?: string;
  email?: string;
  email_address?: string;
  emailAddress?: string;
}

function normalizePerson(item: Record<string, unknown>): DecisionMaker | null {
  const raw = item as RawPerson;
  const name = String(
    raw.name ?? raw.full_name ?? raw.fullName ?? ''
  ).trim();
  const title = String(
    raw.title ?? raw.position ?? raw.role ?? ''
  ).trim();
  const linkedin = (
    raw.linkedin ?? raw.linkedin_url ?? raw.linkedinUrl ?? null
  ) as string | null;
  const email = (
    raw.email ?? raw.email_address ?? raw.emailAddress ?? null
  ) as string | null;

  // Must have at least a name to be worth keeping
  if (!name) return null;

  return {
    name,
    title,
    linkedin: linkedin || null,
    emails:   email ? [email] : [],
  };
}

function extractArrayFromText(text: string): unknown[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

function unwrapObject(parsed: unknown): unknown[] | null {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  const values = Object.values(parsed as Record<string, unknown>);
  const arr    = values.find(v => Array.isArray(v));
  return arr ? (arr as unknown[]) : null;
}

async function rescueWithClaude(raw: string, companyName: string): Promise<DecisionMaker[]> {
  console.warn(`  [${companyName}] Haiku rescue...`);
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Extract all people from this text and return a valid JSON array.
Each item must have exactly these keys: name, title, linkedin (URL or null), email (string or null).
Return ONLY the raw JSON array — no markdown, no explanation.
Return [] if no valid people are found.

Text:
${raw}`,
      }],
    });
    const content = msg.content[0];
    if (content.type !== 'text') return [];
    const cleaned = content.text
      .replace(/^```json\s*/im, '')
      .replace(/^```\s*/im, '')
      .replace(/\s*```$/m, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((p: Record<string, unknown>) => normalizePerson(p))
      .filter((p): p is DecisionMaker => p !== null);
  } catch (err) {
    console.error(`  [${companyName}] Haiku rescue failed:`, err);
    return [];
  }
}

async function parsePeople(raw: string, companyName: string): Promise<DecisionMaker[]> {
  // Stage 1: strip markdown fences
  const cleaned = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```$/m, '')
    .trim();

  let items: unknown[] | null = null;

  // Stage 2: try direct JSON.parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      items = parsed;
    } else {
      items = unwrapObject(parsed);
    }
  } catch {
    // Stage 3: extract embedded array from prose
    items = extractArrayFromText(cleaned);
  }

  // Stage 4: normalize key names
  if (items && items.length > 0) {
    const normalized = items
      .map(item => normalizePerson(item as Record<string, unknown>))
      .filter((p): p is DecisionMaker => p !== null);
    if (normalized.length > 0) return normalized;
    console.warn(`  [${companyName}] Parsed ${items.length} items but none survived normalisation`);
  }

  // Stage 5: Claude Haiku rescue
  console.warn(`  [${companyName}] Local parse failed. Raw (first 300 chars):`, raw.slice(0, 300));
  return rescueWithClaude(raw, companyName);
}

// ─── Email enrichment: Hunter.io Email Finder ─────────────────────────────────

async function tryHunter(
  firstName: string,
  lastName: string,
  domain: string
): Promise<string | null> {
  if (!HUNTER_KEY) return null;
  try {
    const url = new URL('https://api.hunter.io/v2/email-finder');
    url.searchParams.set('domain',     domain);
    url.searchParams.set('first_name', firstName);
    url.searchParams.set('last_name',  lastName);
    url.searchParams.set('api_key',    HUNTER_KEY);

    const res  = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json() as { data?: { email?: string | null } };
    return data.data?.email ?? null;
  } catch { return null; }
}

// ─── Email enrichment: Anymail Finder ────────────────────────────────────────

async function tryAnymailByLinkedIn(linkedinUrl: string): Promise<string | null> {
  if (!ANYMAIL_KEY) return null;
  try {
    const res = await fetch('https://api.anymailfinder.com/v5.1/find-email/linkedin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANYMAIL_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ linkedin_url: linkedinUrl }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { email?: string | null };
    return data.email ?? null;
  } catch { return null; }
}

async function tryAnymailByName(
  firstName: string,
  lastName: string,
  domain: string
): Promise<string | null> {
  if (!ANYMAIL_KEY) return null;
  try {
    const res = await fetch('https://api.anymailfinder.com/v5.1/find-email/name', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANYMAIL_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, domain }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { email?: string | null };
    return data.email ?? null;
  } catch { return null; }
}

// ─── Email enrichment orchestrator ───────────────────────────────────────────

async function enrichEmail(
  person: DecisionMaker,
  domain: string
): Promise<DecisionMaker> {
  // Already has an email from BU — no enrichment needed
  if (person.emails.length > 0 && person.emails[0]) return person;

  const nameParts = person.name.trim().split(/\s+/);
  const firstName = nameParts[0]    ?? '';
  const lastName  = nameParts.slice(1).join(' ') || nameParts[0] ?? '';

  // 1. Hunter Email Finder (name + domain)
  if (firstName && lastName && domain && HUNTER_KEY) {
    const hunterEmail = await tryHunter(firstName, lastName, domain);
    if (hunterEmail) {
      console.log(`    [Hunter] Found email for ${person.name}`);
      return { ...person, emails: [hunterEmail] };
    }
  }

  // 2a. Anymail by LinkedIn URL (if available)
  if (person.linkedin && ANYMAIL_KEY) {
    const anymailEmail = await tryAnymailByLinkedIn(person.linkedin);
    if (anymailEmail) {
      console.log(`    [Anymail/LinkedIn] Found email for ${person.name}`);
      return { ...person, emails: [anymailEmail] };
    }
  }

  // 2b. Anymail by name + domain (fallback when no LinkedIn)
  if (!person.linkedin && firstName && domain && ANYMAIL_KEY) {
    const anymailEmail = await tryAnymailByName(firstName, lastName, domain);
    if (anymailEmail) {
      console.log(`    [Anymail/Name] Found email for ${person.name}`);
      return { ...person, emails: [anymailEmail] };
    }
  }

  // Nothing found — leave email empty
  return person;
}

// ─── Per-company research ─────────────────────────────────────────────────────

async function processCompany(company: Company): Promise<void> {
  const domain = extractDomain(company.urls);
  console.log(`\n[GET-EMAIL] ${company.name} (domain: ${domain})`);

  try {
    // Step 1: Browser Use finds decision makers
    const prompt = buildOutreachPrompt(company.name, company.urls);
    const result = await browserUse.run(prompt, { model: BU_MODEL });

    const rawOutput = result.output;
    const raw = typeof rawOutput === 'string'
      ? rawOutput
      : JSON.stringify(rawOutput ?? []);

    // Step 2: Parse + normalize
    const people = await parsePeople(raw, company.name);
    console.log(`  BU found ${people.length} person(s) for ${company.name}`);

    // Step 3: Enrich emails for anyone missing one
    const enriched = await Promise.all(
      people.map(person => enrichEmail(person, domain))
    );

    enriched.forEach(p => {
      const emailStatus = p.emails.length > 0 ? p.emails[0] : 'no email found';
      console.log(`  - ${p.title}: ${p.name} | ${emailStatus} | ${p.linkedin ?? 'no LinkedIn'}`);
    });

    // Step 4: Store
    updateOutreach(company.id, enriched);
    console.log(`  [DONE] ${company.name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markOutreachFailed(company.id, message);
    console.error(`  [FAILED] ${company.name}: ${message}`);
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting outreach email discovery...');
  console.log(`BU model: ${BU_MODEL} | Concurrency: ${CONCURRENCY}`);
  console.log('Enrichment providers:', [
    HUNTER_KEY   && 'Hunter.io',
    ANYMAIL_KEY  && 'Anymail Finder',
  ].filter(Boolean).join(' → ') || 'None configured (BU only)');

  const allCompanies = getCompaniesForOutreach();
  const companies    = OUTREACH_LIMIT
    ? allCompanies.slice(0, OUTREACH_LIMIT)
    : allCompanies;

  console.log(`Eligible companies: ${allCompanies.length} | Processing this run: ${companies.length}`);

  if (companies.length === 0) {
    console.log('No companies ready. Run "npm run start" first to generate cold emails.');
    return;
  }

  const limit = pLimit(CONCURRENCY);
  const tasks = companies.map(c => limit(() => processCompany(c)));
  await Promise.allSettled(tasks);

  console.log('\n=== Summary ===');
  console.table(getSummary());
}

main().catch(console.error);
```

---

## Step 3: Add script to package.json

```json
{
  "scripts": {
    "import":           "tsx src/import.ts",
    "migrate":          "tsx src/migrate.ts",
    "migrate-outreach": "tsx src/migrate-outreach.ts",
    "discover":         "tsx src/discover.ts",
    "start":            "tsx src/index.ts",
    "outreach":         "tsx src/outreach.ts",
    "get-email":        "tsx src/get-email.ts"
  }
}
```

---

## Step 4: Running it

```bash
# First time: run migrations if not already done
npm run migrate
npm run migrate-outreach

# Run the discovery and email pipeline first
npm run discover
npm run start

# Then find decision makers + emails
npm run get-email

# Optional: process only N companies per run (rate-limit protection)
OUTREACH_LIMIT=10 npm run get-email
```

---

## Flow summary (per company)

```
BU (MiniMax M3) searches company site + LinkedIn
    ↓
parsePeople: stage 1 strip fences
             stage 2 JSON.parse
             stage 3 unwrap object
             stage 4 extract array from prose
             stage 5 Claude Haiku rescue (last resort)
    ↓
For each person without an email:
    Hunter Email Finder (name + domain) → 1 credit if found
        ↓ (if still empty)
    Has LinkedIn URL? → Anymail LinkedIn endpoint → 2 credits if found
    No LinkedIn URL?  → Anymail Name endpoint    → 2 credits if found
        ↓ (if still empty)
    email stays null
    ↓
updateOutreach(id, enriched people)
```

---

## Credit budget for 66 companies

### Browser Use (MiniMax M3)
Estimated 2-4 min per session at ~50K-100K tokens. At MiniMax M3 pricing
(cheapest tier on BU Cloud), roughly $0.05-0.15 per company.
66 companies ≈ $3-10 total from your $49 BU credits.

### Hunter.io (Email Finder)
1 credit per found email. Free plan: 50 credits/month.
Assuming BU finds emails for ~30% of people, Hunter covers the rest.
For 66 companies × avg 2 people = 132 people × 70% needing enrichment
= ~92 Hunter calls. Free plan (50 credits) covers the first month;
remaining 42 would need next month's reset or a paid plan.

Practical fix: add `OUTREACH_LIMIT=25` per run so each run stays within
the 50 free Hunter credits, then run again next month.

### Anymail Finder
2 credits per found email, charged only if an email is actually returned.
Only triggered when Hunter also found nothing.
Expected hit rate: 15-25% of remaining cases.
~20-30 Anymail calls across 66 companies.
$29/month plan (400 credits) is more than enough.
For now, leave `ANYMAIL_FINDER_API_KEY` unset and skip Anymail entirely
until you've used the Hunter free tier and decided if you need more coverage.

---

## One honest caveat

MiniMax M3's BrowseComp score (83.5%) means it's strong at
finding publicly available information. LinkedIn profile URLs
are almost always findable. Emails are much harder.

Realistic email hit rates for this pipeline:
- BU finds email directly: ~10-15% of people
- Hunter finds email after BU: ~25-35% of remaining
- Anymail finds email after Hunter: ~10-20% of remaining
- Total email coverage: ~40-60% of all people found