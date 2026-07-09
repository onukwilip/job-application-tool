# Implementation Plan — Multi-Provider Outreach (Waterfall)

This replaces the ContactOut-based `outreach.ts` with a three-provider waterfall:
Hunter.io (free) → Snov.io (free, async) → Anymail Finder ($29/mo).

Alongside the existing `implementation-plan-outreach.md`, only the following files change:
- `.env` — add provider keys + EMAIL_FINDER mode
- `src/outreach.ts` — replaced with waterfall logic
- `src/providers/` — three new provider modules (NEW directory)

---

## API summary (confirmed from docs)

### Hunter.io
- Endpoint: `GET https://api.hunter.io/v2/domain-search`
- Auth: `?api_key=KEY` query param
- Key params: `domain`, `type=personal`, `seniority=executive`, `limit=10`
- Credits: 1 credit per domain. Free if no emails found.
- Response: `data.emails[]` each with `first_name`, `last_name`, `value` (email),
  `position`, `seniority`, `linkedin`
- Free plan: 50 credits/month, API enabled automatically — no setup required

### Snov.io
- Auth: POST `https://api.snov.io/v1/oauth/access_token` with `client_id` + `client_secret`
  → bearer token valid 1 hour
- Async flow:
  1. `POST https://api.snov.io/v2/domain-search/start`
     body: `{ "domain": "example.com" }`
     → `{ "task_hash": "abc123" }`
  2. Poll `GET https://api.snov.io/v2/domain-search/result?task_hash=abc123`
     until `status === "completed"`, then read `data`
- Response items: `first_name`, `last_name`, `email`, `position`, `email_status`, `linkedin_url`
- Credits: 1 credit per batch of 50 emails returned
- Free plan: 50 credits/month. API requires emailing help@snov.io once.

### Anymail Finder
- Endpoint: `POST https://api.anymailfinder.com/v5.1/find-email/company`
- Auth: `Authorization: Bearer YOUR_API_KEY` header
- Body: `{ "domain": "acme.com" }`
- Credits: 1 credit per domain, up to 20 emails returned. Free if nothing found.
- Response: `{ "emails": ["a@co.com", ...], "email_status": "valid", "credits_charged": 1 }`
  (no names/titles — we filter by title from Hunter/Snov if we have them already)
- Paid plan: $29/month for 400 credits. Free 100-credit trial (card verified, not charged).
- Sync response, average 8 seconds per call.

---

## Step 1: Update .env

```env
# Provider keys (add the ones you have)
HUNTER_API_KEY=your_hunter_api_key
SNOV_CLIENT_ID=your_snov_client_id
SNOV_CLIENT_SECRET=your_snov_client_secret
ANYMAIL_FINDER_API_KEY=your_anymail_api_key

# Waterfall mode (default) or a single provider
# Values: waterfall | hunter | snov | anymail
EMAIL_FINDER=waterfall
```

---

## Step 2: Create src/providers/ directory

```
src/
└── providers/
    ├── types.ts       ← shared types + title filter
    ├── hunter.ts      ← Hunter.io adapter
    ├── snov.ts        ← Snov.io adapter (async + polling)
    ├── anymail.ts     ← Anymail Finder adapter
    └── index.ts       ← waterfall orchestrator
```

---

## Step 3: src/providers/types.ts

Shared result type and the title-filter function used by all providers.

```typescript
/** Normalized result returned by every provider */
export interface ProviderResult {
  name: string;
  title: string;
  linkedin: string | null;
  email: string;
}

/** Job title keywords we consider decision-makers */
const DECISION_MAKER_KEYWORDS = [
  'cto', 'chief technology', 'vp engineer', 'vice president engineer',
  'head of engineer', 'head of devops', 'head of cloud', 'head of platform',
  'head of infrastructure', 'platform engineer', 'devops lead',
  'infrastructure lead', 'engineering manager', 'co-founder', 'cofounder',
  'chief executive', 'ceo',
];

/**
 * Returns true if a job title string matches one of our decision-maker keywords.
 * Case-insensitive.
 */
export function isDecisionMaker(title: string): boolean {
  const lower = title.toLowerCase();
  return DECISION_MAKER_KEYWORDS.some(kw => lower.includes(kw));
}
```

---

## Step 4: src/providers/hunter.ts

```typescript
import { isDecisionMaker, type ProviderResult } from './types.js';

const BASE = 'https://api.hunter.io/v2';

interface HunterEmail {
  value: string;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  seniority: string | null;
  linkedin: string | null;
}

interface HunterResponse {
  data?: { emails: HunterEmail[] };
  errors?: { id: string; details: string }[];
}

export async function findWithHunter(
  domain: string,
  apiKey: string
): Promise<ProviderResult[]> {
  const url = new URL(`${BASE}/domain-search`);
  url.searchParams.set('domain', domain);
  url.searchParams.set('type', 'personal');
  url.searchParams.set('seniority', 'executive');
  url.searchParams.set('limit', '10');
  url.searchParams.set('api_key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Hunter API ${res.status}: ${res.statusText}`);

  const data = await res.json() as HunterResponse;
  if (!data.data?.emails?.length) return [];

  return data.data.emails
    .filter(e => e.value && (e.position ? isDecisionMaker(e.position) : true))
    .map(e => ({
      name: [e.first_name, e.last_name].filter(Boolean).join(' ') || 'Unknown',
      title: e.position ?? 'Unknown',
      linkedin: e.linkedin ?? null,
      email: e.value,
    }));
}
```

---

## Step 5: src/providers/snov.ts

Snov.io uses an async flow: start a search, poll until complete.

```typescript
import { isDecisionMaker, type ProviderResult } from './types.js';

const BASE = 'https://api.snov.io';

interface SnovToken {
  access_token: string;
  expires_in: number;
  fetchedAt: number;
}

// Module-level token cache to avoid re-authenticating every call
let cachedToken: SnovToken | null = null;

async function getSnovToken(clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();
  if (cachedToken && now - cachedToken.fetchedAt < (cachedToken.expires_in - 60) * 1000) {
    return cachedToken.access_token;
  }

  const res = await fetch(`${BASE}/v1/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) throw new Error(`Snov.io auth failed: ${res.status}`);
  const token = await res.json() as { access_token: string; expires_in: number };
  cachedToken = { ...token, fetchedAt: now };
  return token.access_token;
}

interface SnovProspect {
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
  linkedIn?: string;
  emailStatus?: string;
}

interface SnovStartResponse {
  task_hash?: string;
  result?: string;
}

interface SnovResultResponse {
  status: 'completed' | 'in_progress' | 'failed';
  data?: SnovProspect[];
}

export async function findWithSnov(
  domain: string,
  clientId: string,
  clientSecret: string
): Promise<ProviderResult[]> {
  const token = await getSnovToken(clientId, clientSecret);
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Step 1: Start the search
  const startRes = await fetch(`${BASE}/v2/domain-search/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ domain }),
  });
  if (!startRes.ok) throw new Error(`Snov.io search start failed: ${startRes.status}`);

  const startData = await startRes.json() as SnovStartResponse;
  const taskHash = startData.task_hash;
  if (!taskHash) throw new Error('Snov.io did not return a task_hash');

  // Step 2: Poll for results (max 12 attempts × 5s = 60s timeout)
  for (let attempt = 0; attempt < 12; attempt++) {
    await new Promise(r => setTimeout(r, 5000));

    const resultRes = await fetch(
      `${BASE}/v2/domain-search/result?task_hash=${taskHash}`,
      { headers }
    );
    if (!resultRes.ok) throw new Error(`Snov.io poll failed: ${resultRes.status}`);

    const result = await resultRes.json() as SnovResultResponse;
    if (result.status === 'in_progress') continue;
    if (result.status === 'failed') throw new Error('Snov.io search failed');

    // completed
    const prospects = result.data ?? [];
    return prospects
      .filter(p => p.email && (p.position ? isDecisionMaker(p.position) : true))
      .map(p => ({
        name: [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown',
        title: p.position ?? 'Unknown',
        linkedin: p.linkedIn ?? null,
        email: p.email,
      }));
  }

  throw new Error('Snov.io search timed out after 60 seconds');
}
```

---

## Step 6: src/providers/anymail.ts

Uses the Company Emails endpoint (1 credit, up to 20 emails).
Anymail returns emails only (no names/titles), so we mark title as Unknown.
We filter by keyword is not possible without names — so we return all found emails
with a note to review manually.

```typescript
import { type ProviderResult } from './types.js';

const BASE = 'https://api.anymailfinder.com/v5.1';

interface AnymailCompanyResponse {
  emails?: string[];
  email_status?: string;
  credits_charged?: number;
  error?: string;
}

export async function findWithAnymail(
  domain: string,
  apiKey: string
): Promise<ProviderResult[]> {
  const res = await fetch(`${BASE}/find-email/company`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain }),
  });

  if (!res.ok) throw new Error(`Anymail Finder ${res.status}: ${res.statusText}`);

  const data = await res.json() as AnymailCompanyResponse;
  if (data.error || !data.emails?.length) return [];

  // Anymail company endpoint returns emails only (no names/titles)
  // We flag title as "Review needed" so you know to look them up manually
  return data.emails.map(email => ({
    name: 'Unknown',
    title: 'Review needed',
    linkedin: null,
    email,
  }));
}
```

---

## Step 7: src/providers/index.ts

The waterfall orchestrator. Tries each enabled provider in order and stops
as soon as one returns results for a given domain.

```typescript
import { findWithHunter } from './hunter.js';
import { findWithSnov } from './snov.js';
import { findWithAnymail } from './anymail.js';
import type { ProviderResult } from './types.js';

export type EmailFinderMode = 'waterfall' | 'hunter' | 'snov' | 'anymail';

interface ProviderConfig {
  hunterApiKey?: string;
  snovClientId?: string;
  snovClientSecret?: string;
  anymailApiKey?: string;
  mode: EmailFinderMode;
}

export async function findDecisionMakers(
  domain: string,
  config: ProviderConfig
): Promise<ProviderResult[]> {
  const {
    hunterApiKey,
    snovClientId,
    snovClientSecret,
    anymailApiKey,
    mode,
  } = config;

  // Build the ordered list of providers to try based on mode + available keys
  const providers: Array<{ name: string; fn: () => Promise<ProviderResult[]> }> = [];

  if ((mode === 'waterfall' || mode === 'hunter') && hunterApiKey) {
    providers.push({
      name: 'Hunter.io',
      fn: () => findWithHunter(domain, hunterApiKey),
    });
  }

  if ((mode === 'waterfall' || mode === 'snov') && snovClientId && snovClientSecret) {
    providers.push({
      name: 'Snov.io',
      fn: () => findWithSnov(domain, snovClientId, snovClientSecret),
    });
  }

  if ((mode === 'waterfall' || mode === 'anymail') && anymailApiKey) {
    providers.push({
      name: 'Anymail Finder',
      fn: () => findWithAnymail(domain, anymailApiKey),
    });
  }

  if (providers.length === 0) {
    throw new Error(
      `No providers configured for mode "${mode}". ` +
      'Check your .env for HUNTER_API_KEY, SNOV_CLIENT_ID/SECRET, or ANYMAIL_FINDER_API_KEY.'
    );
  }

  // In waterfall mode: try providers in order, stop on first hit
  // In single-provider mode: run that provider directly
  if (mode === 'waterfall') {
    for (const provider of providers) {
      try {
        console.log(`    Trying ${provider.name}...`);
        const results = await provider.fn();
        if (results.length > 0) {
          console.log(`    Found ${results.length} contact(s) via ${provider.name}`);
          return results;
        }
        console.log(`    ${provider.name}: no results, trying next provider...`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`    ${provider.name} error: ${msg}, trying next provider...`);
      }
    }
    return [];
  }

  // Single provider mode
  return providers[0].fn();
}
```

---

## Step 8: Replace src/outreach.ts

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
import {
  findDecisionMakers,
  type EmailFinderMode,
} from './providers/index.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '5', 10);
const MODE = (process.env.EMAIL_FINDER ?? 'waterfall') as EmailFinderMode;

const PROVIDER_CONFIG = {
  hunterApiKey:      process.env.HUNTER_API_KEY,
  snovClientId:      process.env.SNOV_CLIENT_ID,
  snovClientSecret:  process.env.SNOV_CLIENT_SECRET,
  anymailApiKey:     process.env.ANYMAIL_FINDER_API_KEY,
  mode:              MODE,
};

// ─── Domain extraction ────────────────────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    const firstUrl = url.split(/[\s,]+/)[0].trim();
    const withProtocol = firstUrl.startsWith('http') ? firstUrl : `https://${firstUrl}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
  }
}

// ─── Per-company research ─────────────────────────────────────────────────────

async function researchOutreach(company: Company): Promise<void> {
  const domain = extractDomain(company.urls);
  console.log(`\n[OUTREACH] ${company.name} (domain: ${domain})`);

  if (!domain) {
    markOutreachFailed(company.id, 'Could not extract domain from urls');
    console.warn(`  Skipping — no domain found in: ${company.urls}`);
    return;
  }

  try {
    const results = await findDecisionMakers(domain, PROVIDER_CONFIG);

    // Map ProviderResult → DecisionMaker (the shape stored in DB)
    const people: DecisionMaker[] = results.map(r => ({
      name: r.name,
      title: r.title,
      linkedin: r.linkedin,
      emails: [r.email],
    }));

    // Deduplicate by email across all results
    const seen = new Set<string>();
    const deduped = people.filter(p => {
      const email = p.emails[0];
      if (seen.has(email)) return false;
      seen.add(email);
      return true;
    });

    console.log(`  Found ${deduped.length} contact(s) for ${company.name}`);
    deduped.forEach(p =>
      console.log(`  - ${p.title}: ${p.name} | ${p.emails[0]} | ${p.linkedin ?? 'no LinkedIn'}`)
    );

    updateOutreach(company.id, deduped);
    console.log(`  [DONE] ${company.name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markOutreachFailed(company.id, message);
    console.error(`  [FAILED] ${company.name}: ${message}`);
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting outreach research (waterfall mode)...');
  console.log(`Mode: ${MODE} | Concurrency: ${CONCURRENCY}`);
  console.log('Providers configured:', [
    PROVIDER_CONFIG.hunterApiKey      && 'Hunter.io',
    PROVIDER_CONFIG.snovClientId      && 'Snov.io',
    PROVIDER_CONFIG.anymailApiKey     && 'Anymail Finder',
  ].filter(Boolean).join(', ') || 'NONE — check .env');

  const companies = getCompaniesForOutreach();
  console.log(`Companies to research: ${companies.length}`);

  if (companies.length === 0) {
    console.log('No companies ready. Run "npm run start" first.');
    return;
  }

  const limit = pLimit(CONCURRENCY);
  const tasks = companies.map(c => limit(() => researchOutreach(c)));
  await Promise.allSettled(tasks);

  console.log('\n=== Outreach Research Summary ===');
  console.table(getSummary());
}

main().catch(console.error);
```

---

## Step 9: Update package.json

No new scripts needed. `npm run outreach` already points to `src/outreach.ts`.

---

## Running the waterfall

```bash
# 1. Set only the keys you have in .env
# Hunter.io: sign up free at hunter.io, copy your API key
# Snov.io: sign up free at snov.io, email help@snov.io to request API access
# Anymail Finder: sign up free at anymailfinder.com/trial/start (100 free credits, card verified only)

# 2. Run
npm run outreach
```

---

## Monthly credit budget

Provider          | Free credits | Paid option          | Cost per domain
------------------|-------------|----------------------|----------------
Hunter.io         | 50/month     | $49/month (2k cr)    | 1 credit
Snov.io           | 50/month     | $29/month (1k cr)    | 1 credit / 50 emails
Anymail Finder    | 100 (trial)  | $29/month (400 cr)   | 1 credit / 20 emails

**Combined free monthly capacity: 100 unique companies**
(50 Hunter + 50 Snov.io, assuming each company only needs one provider)

**With Anymail Finder at $29/month added:**
400 more domains covered per month = 500 total companies per month for $29.

---

## Honest limitations

1. **Snov.io's async polling adds 5-60 seconds latency per company.** Lower your
   `CONCURRENCY` to 2-3 when Snov.io is in the waterfall to avoid overlapping
   poll loops overwhelming your runtime.

2. **Anymail Finder's company endpoint returns emails only, no names or titles.**
   You'll see `title: "Review needed"` for those entries. Cross-reference with the
   LinkedIn URL from Hunter/Snov.io results if you have them.

3. **Hunter.io free plan limits results to 10 emails per domain** (documented in
   the API v1 reference: "On the Free plan, the results are limited to the first
   10 email addresses").

4. **Snov.io API access on the free plan requires a manual email** to help@snov.io
   before your first call. Without this, the API will return auth errors even with
   valid credentials.