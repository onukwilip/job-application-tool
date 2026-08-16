# JAT — BU Adapter Module Implementation Plan (Point 3)

---

## Overview

Add `src/bu-adapter.ts` — a single module that routes all Browser Use calls to
either BU Cloud SDK or the local FastAPI wrapper, toggled by one env var.
Every place in JAT that currently calls the BU Cloud SDK is updated to call
`bu()` instead. DB update functions that receive BU output are updated to also
accept an optional `sessionId` and write it to the companies table when present.

The public API:

```typescript
bu(task: string, options?: { model?: string }): Promise<BuResult>

interface BuResult {
  output:     string;
  sessionId?: number;   // present on local path only
}
```

---

## Step 0 — Codebase scan (IDE agent instruction)

**Before writing any code, the IDE agent must scan the codebase and
identify every BU-related call site.** This ensures no instance is missed.

Run the following searches:

```bash
# Find all files importing from the BU Cloud SDK
grep -r "browser-use-sdk" src/ --include="*.ts" -l

# Find all .run() calls on a BU client
grep -r "\.run(" src/ --include="*.ts" -n

# Find all BU client instantiations
grep -r "new BrowserUse" src/ --include="*.ts" -n

# Find all BU-related imports
grep -r "BrowserUse\|BuModel\|bu_client\|BU_MODEL" src/ --include="*.ts" -n
```

For **each file and call site found**, note:
1. What task/prompt is passed to `.run()`
2. Which properties of `result` are used (e.g. `result.output`, any other property)
3. Which DB update function is called with the output
4. What DB column and status value that function writes

Also check the BU Cloud SDK v3 type definition for `client.run()` return type:

```bash
cat node_modules/browser-use-sdk/v3/index.d.ts | grep -A 10 "run("
```

Document any returned properties beyond `output` — the adapter must pass them
through or explicitly drop them with a comment explaining why.

Known call sites from codebase review (verify these are complete):
- `src/research.ts` — `researchCompany()` — uses `result.output`
- `src/get-email.ts` — `getCompanyDecisionMakers()` — uses `result.output`

---

## Files to create / modify

```
job-application-tool/
├── src/
│   ├── bu-adapter.ts           ← NEW
│   ├── migrate-bu-sessions.ts  ← NEW
│   ├── db.ts                   ← UPDATE: Company interface + 2 update fns
│   ├── research.ts             ← UPDATE: replace SDK call with bu()
│   └── get-email.ts            ← UPDATE: replace SDK call with bu()
└── .env                        ← UPDATE: 3 new vars
```

---

## Step 1 — Update `.env`

```dotenv
# ── Browser Use routing ────────────────────────────────────────────────────────
BROWSER_USE_LOCAL=false                        # true = local wrapper | false = BU Cloud
BROWSER_USE_LOCAL_URL=http://localhost:8000    # URL of the local FastAPI wrapper
BROWSER_USE_LOCAL_MODEL=gemini-3.6-flash       # model string for local path only
                                               # BROWSER_USE_MODEL remains for BU Cloud
```

---

## Step 2 — Create `src/bu-adapter.ts`

```typescript
// src/bu-adapter.ts
import 'dotenv/config';
import { BrowserUse, type BuModel } from 'browser-use-sdk/v3';

// ── Config ─────────────────────────────────────────────────────────────────────

const USE_LOCAL     = process.env.BROWSER_USE_LOCAL === 'true';
const LOCAL_URL     = process.env.BROWSER_USE_LOCAL_URL   ?? 'http://localhost:8000';
const LOCAL_MODEL   = process.env.BROWSER_USE_LOCAL_MODEL ?? 'gemini-3.6-flash';
const CLOUD_API_KEY = process.env.BROWSER_USE_API_KEY!;
const CLOUD_MODEL   = process.env.BROWSER_USE_MODEL as BuModel;

// Fetch timeout: 10 min. The local wrapper's own TASK_TIMEOUT_SECONDS=300 fires
// first, so JAT always receives a clean error response rather than a hanging fetch.
const FETCH_TIMEOUT_MS = 10 * 60 * 1000;

// ── Result type ────────────────────────────────────────────────────────────────

export interface BuResult {
  output:     string;
  sessionId?: number;  // present on local path only; undefined on Cloud path
}

// ── Cloud client (lazy init) ───────────────────────────────────────────────────

let _cloudClient: BrowserUse | null = null;

function getCloudClient(): BrowserUse {
  if (!_cloudClient) {
    _cloudClient = new BrowserUse({ apiKey: CLOUD_API_KEY });
  }
  return _cloudClient;
}

// ── Local path ─────────────────────────────────────────────────────────────────

async function runLocal(task: string, model: string): Promise<BuResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${LOCAL_URL}/run`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ task, model }),
      signal:  controller.signal,
    });
  } catch (err: any) {
    throw new Error(
      err.name === 'AbortError'
        ? `BU local: request timed out after ${FETCH_TIMEOUT_MS / 1000}s`
        : `BU local: network error — is the wrapper running at ${LOCAL_URL}? (${err.message})`
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`BU local: HTTP ${response.status} — ${body}`);
  }

  const data = await response.json() as {
    output:     string | null;
    error:      string | null;
    session_id: number | null;
  };

  if (data.error) throw new Error(`BU local agent error: ${data.error}`);

  return {
    output:    data.output    ?? 'No output returned from Browser Use',
    sessionId: data.session_id ?? undefined,
  };
}

// ── Cloud path ─────────────────────────────────────────────────────────────────

async function runCloud(task: string, model: BuModel): Promise<BuResult> {
  const result = await getCloudClient().run(task, { model });
  // NOTE: BU Cloud SDK v3 returns additional properties beyond `output`.
  // After running Step 0's SDK type scan, add any used properties here.
  // sessionId is intentionally omitted — Cloud returns no session ID.
  return {
    output: result.output ?? 'No output returned from Browser Use',
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Runs a Browser Use task via BU Cloud or the local wrapper.
 * Toggle with BROWSER_USE_LOCAL in .env — no code changes needed to switch.
 *
 * @param task    - The full prompt string (output of RESEARCH_PROMPT, OUTREACH_PROMPT, etc.)
 * @param options - Optional per-call overrides. model overrides the env default for this call only.
 * @returns BuResult with output (always) and optional sessionId (local path only).
 *
 * @example
 *   const { output, sessionId } = await bu(RESEARCH_PROMPT(name, urls, jobAd));
 */
export async function bu(
  task:    string,
  options: { model?: string } = {},
): Promise<BuResult> {
  if (USE_LOCAL) {
    return await runLocal(task, options.model ?? LOCAL_MODEL);
  } else {
    return await runCloud(task, (options.model ?? CLOUD_MODEL) as BuModel);
  }
}
```

---

## Step 3 — Create `src/migrate-bu-sessions.ts`

Adds two nullable INTEGER columns to `companies`. Idempotent — safe to re-run.

```typescript
// src/migrate-bu-sessions.ts
import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data', 'companies.db'));

const columns = ['research_bu_session_id', 'outreach_bu_session_id'];

for (const col of columns) {
  try {
    db.exec(`ALTER TABLE companies ADD COLUMN ${col} INTEGER`);
    console.log(`✓ Added: ${col}`);
  } catch (err: any) {
    if (err.message?.includes('duplicate column name')) {
      console.log(`↷ Already exists: ${col}`);
    } else throw err;
  }
}

console.log('\n✓ BU session columns migration complete.');
db.close();
```

**Run once before any pipeline run:**

```bash
npx ts-node src/migrate-bu-sessions.ts
```

---

## Step 4 — Update `src/db.ts`

### 4a. Update the `Company` interface

Add the two new nullable fields alongside existing columns:

```typescript
export interface Company {
  // ... all existing fields unchanged ...
  research_bu_session_id: number | null;  // ← new
  outreach_bu_session_id: number | null;  // ← new
}
```

### 4b. Update `updateInfrastructure()`

Extend the existing function to optionally write the session ID in the same
UPDATE statement. No second DB call needed.

```typescript
// BEFORE:
export function updateInfrastructure(id: number, infrastructure: string): void {
  db.prepare(`
    UPDATE companies
    SET infrastructure = ?, status = 'researched', updated_at = datetime('now')
    WHERE id = ?
  `).run(infrastructure, id);
}

// AFTER:
export function updateInfrastructure(
  id:             number,
  infrastructure: string,
  sessionId?:     number,          // optional — only written when present
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
```

> **Why `COALESCE`?** If `sessionId` is `null` (Cloud path), `COALESCE` keeps
> whatever value was there before rather than overwriting with NULL. This means
> re-running research on Cloud after a prior local run doesn't erase the session ID.

### 4c. Update `updateOutreach()`

Same pattern — extend with optional `sessionId`:

```typescript
// BEFORE:
export function updateOutreach(id: number, people: DecisionMaker[]): void {
  db.prepare(`
    UPDATE companies
    SET outreach = ?, outreach_status = 'done', updated_at = datetime('now')
    WHERE id = ?
  `).run(JSON.stringify(people), id);
}

// AFTER:
export function updateOutreach(
  id:        number,
  people:    DecisionMaker[],
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
```

---

## Step 5 — Update `src/research.ts`

Three targeted edits. `researchCompany()` return type changes from `Promise<string>`
to `Promise<{ output: string; sessionId?: number }>` so the caller receives the
session ID without needing an extra DB call.

### 5a. Replace the SDK import

```typescript
// REMOVE:
import { BrowserUse, type BuModel } from 'browser-use-sdk/v3';

// ADD:
import { bu, type BuResult } from './bu-adapter.js';
```

### 5b. Remove the client instantiation

```typescript
// REMOVE this block entirely:
const client = new BrowserUse({
  apiKey: process.env.BROWSER_USE_API_KEY!,
});
```

### 5c. Update `researchCompany()`

```typescript
// BEFORE:
export async function researchCompany(
  name:   string,
  urls:   string,
  jobAd:  string,
): Promise<string> {
  const task   = RESEARCH_PROMPT(name, urls, jobAd);
  const result = await client.run(task, { model: process.env.BROWSER_USE_MODEL as BuModel });
  return result.output ?? 'No output returned from Browser Use';
}

// AFTER:
export async function researchCompany(
  name:  string,
  urls:  string,
  jobAd: string,
): Promise<BuResult> {
  const task = RESEARCH_PROMPT(name, urls, jobAd);
  return await bu(task);
  // BuResult = { output: string, sessionId?: number }
  // sessionId is present on local path, undefined on Cloud path
}
```

---

## Step 6 — Update the research call site

The IDE agent must find where `researchCompany()` is called (confirmed in
`generate-email.ts` or equivalent orchestrator) and update it to destructure
`output` and pass `sessionId` through to `updateInfrastructure()`.

### Pattern to find and update:

```typescript
// BEFORE:
infrastructure = await researchCompany(
  company.name,
  company.urls,
  company.job_ad
);
updateInfrastructure(company.id, infrastructure);

// AFTER:
const { output: infrastructure, sessionId: researchSessionId } =
  await researchCompany(company.name, company.urls, company.job_ad);

updateInfrastructure(company.id, infrastructure, researchSessionId);
// sessionId is undefined on Cloud path → COALESCE in DB leaves column untouched
```

> **IDE agent instruction:** Search for every call to `researchCompany(` in the
> codebase. Apply this pattern at each call site. There should be only one, but
> confirm with grep before assuming.

---

## Step 7 — Update `src/get-email.ts`

### 7a. Replace the SDK import

```typescript
// REMOVE:
import { BrowserUse, type BuModel } from 'browser-use-sdk/v3';

// ADD:
import { bu } from './bu-adapter.js';
```

### 7b. Remove the client instantiation

```typescript
// REMOVE (exact variable name may differ — grep for 'new BrowserUse'):
const bu_client = new BrowserUse({ apiKey: process.env.BROWSER_USE_API_KEY! });
// and any BU_MODEL constant derived from process.env
```

### 7c. Update the BU call inside `getCompanyDecisionMakers()`

```typescript
// BEFORE:
const prompt = OUTREACH_PROMPT(company.name, company.urls);
const result = await bu_client.run(prompt, { model: BU_MODEL as BuModel });

const rawOutput = result.output;
const raw = typeof rawOutput === 'string'
  ? rawOutput
  : JSON.stringify(rawOutput ?? []);

// AFTER:
const prompt            = OUTREACH_PROMPT(company.name, company.urls);
const { output, sessionId } = await bu(prompt);

const raw = typeof output === 'string'
  ? output
  : JSON.stringify(output ?? []);
// rawOutput renamed to output — update any downstream references to rawOutput
// to use output instead (grep for 'rawOutput' within this file)
```

### 7d. Pass `sessionId` to `updateOutreach()`

Find the call to `updateOutreach()` in `getCompanyDecisionMakers()` and add
`sessionId` as the third argument:

```typescript
// BEFORE:
updateOutreach(company.id, people);

// AFTER:
updateOutreach(company.id, people, sessionId);
// sessionId is undefined on Cloud path → COALESCE in DB leaves column untouched
```

> **IDE agent instruction:** The variable `sessionId` from the `bu()` call must
> be in scope at the point where `updateOutreach()` is called. If the parse
> pipeline between the two spans multiple functions, thread `sessionId` through
> as a parameter or close over it from the outer function scope.

---

## Step 8 — Verify and test

### 8a. Run the migration

```bash
npx ts-node src/migrate-bu-sessions.ts
```

### 8b. Compile check

```bash
npx tsc --noEmit
```

Resolve all type errors before running any pipeline step.

### 8c. Test Cloud path (zero regression)

With `BROWSER_USE_LOCAL=false`, run one company through research and outreach.
Confirm:
- Output quality is identical to before
- `research_bu_session_id` and `outreach_bu_session_id` are NULL in DB (correct —
  Cloud path returns no session ID)

### 8d. Test local path

Start the BU local wrapper, set `BROWSER_USE_LOCAL=true`, run one company.
Confirm:
- Requests appear in the local wrapper logs
- `research_bu_session_id` is populated in the companies DB row
- `outreach_bu_session_id` is populated in the companies DB row
- Output quality is comparable to Cloud

### 8e. Confirm no remaining SDK imports

```bash
grep -r "browser-use-sdk" src/ --include="*.ts"
```

Only `bu-adapter.ts` should appear. If any other file still imports from the
SDK directly, it was missed in the scan — update it to use `bu()`.

---

## Success criteria

- `BROWSER_USE_LOCAL=false` → identical pipeline behaviour to before, no session IDs stored
- `BROWSER_USE_LOCAL=true` → all BU calls go to local wrapper, session IDs stored
- Switching between paths requires only changing one env var
- No file other than `bu-adapter.ts` imports from `browser-use-sdk`
- `tsc --noEmit` passes with zero errors